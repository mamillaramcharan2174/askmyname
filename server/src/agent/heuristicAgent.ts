import { AnalysisQuery } from '../schema/queryAst.js';
import { ColumnProfile, DatasetProfile } from '../schema/dataset.js';
import { ClarificationPrompt } from '../schema/agent.js';

export interface InterpretationResult {
  isAmbiguous: boolean;
  clarification?: ClarificationPrompt;
  plan: string[];
  queryAst?: AnalysisQuery;
  reasoning: string;
}

export class HeuristicAgent {
  interpret(
    question: string,
    profile: DatasetProfile,
    previousQuery?: AnalysisQuery
  ): InterpretationResult {
    const qLower = question.trim().toLowerCase();
    const columns = profile.columns;

    // 1. Check for intentional ambiguity or underspecified queries
    // e.g., "show performance", "show metrics", "give me data", "summary"
    const ambiguousTriggers = [
      'show performance',
      'analyze performance',
      'how are we doing',
      'overview',
      'show metrics',
      'performance summary',
      'performance',
    ];
    const hasByOrFor = /\b(by|for|across|in|per)\b/i.test(qLower);
    if (ambiguousTriggers.some((t) => qLower.includes(t)) && !hasByOrFor) {
      const numericCols = columns.filter((c) => c.inferredType === 'number');
      const catCols = columns.filter((c) => c.inferredType === 'string' && c.uniqueCount <= 10);

      const options = [];
      if (numericCols.length > 0 && catCols.length > 0) {
        options.push({
          label: `Total ${numericCols[0].name} by ${catCols[0].name}`,
          description: `Compare ${numericCols[0].name} across key categories`,
          promptSuggestion: `Show total ${numericCols[0].name} by ${catCols[0].name}`,
        });
      }
      if (numericCols.length > 1 && catCols.length > 0) {
        options.push({
          label: `Average ${numericCols[1].name} by ${catCols[0].name}`,
          description: `Analyze average distribution of ${numericCols[1].name}`,
          promptSuggestion: `Show average ${numericCols[1].name} by ${catCols[0].name}`,
        });
      }
      if (numericCols.length > 0) {
        const topNumeric = numericCols.find((c) => /rev|sales|profit|amount/i.test(c.name)) || numericCols[0];
        options.push({
          label: `Top 5 records by ${topNumeric.name}`,
          description: `Highlight highest ranking individual entries`,
          promptSuggestion: `Which 5 records had the highest ${topNumeric.name}?`,
        });
      }

      return {
        isAmbiguous: true,
        clarification: {
          isAmbiguous: true,
          reason: `The question "${question}" is general and does not specify which metric or dimension to evaluate.`,
          clarificationQuestion: `Which performance metric and dimension would you like to examine?`,
          options,
        },
        plan: [
          'Detect ambiguity in user intent',
          'Identify candidate numeric metrics and categorical dimensions in schema',
          'Prompt user for specific metric choice',
        ],
        reasoning: 'Ambiguity detected: question lacks specific metric and dimension targets.',
      };
    }

    // 2. Check for follow-up phrasing referencing previous query
    let baseQuery: AnalysisQuery = {
      filters: [],
      groupBy: [],
      aggregates: [],
      limit: 50,
    };

    const isFollowUp = !!previousQuery && (
      qLower.startsWith('now ') ||
      qLower.startsWith('also ') ||
      qLower.startsWith('break ') ||
      qLower.startsWith('filter ') ||
      qLower.includes('break that down by') ||
      qLower.includes('breakdown by') ||
      qLower.includes('only ')
    );

    if (isFollowUp && previousQuery) {
      baseQuery = JSON.parse(JSON.stringify(previousQuery));
    }

    // Find categorical dimensions
    const stringCols = columns.filter((c) => c.inferredType === 'string');
    const numericCols = columns.filter((c) => c.inferredType === 'number');
    const dateCols = columns.filter((c) => c.inferredType === 'date' || c.name.toLowerCase().includes('quarter') || c.name.toLowerCase().includes('date'));

    let matchedGroupBy: string[] = baseQuery.groupBy || [];
    let matchedAggs = baseQuery.aggregates ? [...baseQuery.aggregates] : [];
    let matchedFilters = baseQuery.filters ? [...baseQuery.filters] : [];
    let sortColumn: string | undefined = undefined;
    let sortDir: 'asc' | 'desc' = 'desc';
    let limit = baseQuery.limit || 50;

    // First check specific "Which <dimension>" syntax (e.g. "Which product", "Which category", "Which country")
    const whichMatch = qLower.match(/which\s+([a-z0-9_]+)/i);
    if (whichMatch && matchedGroupBy.length === 0 && !isFollowUp) {
      const targetNoun = whichMatch[1].toLowerCase();
      const matchedCol = columns.find((c) => {
        const lower = c.name.toLowerCase();
        return lower === targetNoun || lower.includes(targetNoun) || targetNoun.includes(lower.split('_')[0]);
      });
      if (matchedCol) {
        matchedGroupBy = [matchedCol.name];
      }
    }

    // Detect breakdown / group by
    for (const col of [...stringCols, ...dateCols]) {
      const colNameLower = col.name.toLowerCase().replace(/_/g, ' ');
      if (
        qLower.includes(`by ${colNameLower}`) ||
        qLower.includes(`each ${colNameLower}`) ||
        qLower.includes(`per ${colNameLower}`) ||
        qLower.includes(`across ${colNameLower}`) ||
        (qLower.includes(colNameLower) && !qLower.includes(`by `) && (qLower.includes('breakdown') || qLower.includes('break down')))
      ) {
        if (!matchedGroupBy.includes(col.name)) {
          if (isFollowUp && (qLower.includes('break that down') || qLower.includes('breakdown'))) {
            matchedGroupBy = [col.name];
          } else {
            matchedGroupBy.push(col.name);
          }
        }
      }
    }

    // If no explicit "by", check if single category mentioned
    if (matchedGroupBy.length === 0 && !isFollowUp) {
      for (const col of [...stringCols, ...dateCols]) {
        const colNameLower = col.name.toLowerCase().replace(/_/g, ' ');
        const isFilterCol = (qLower.includes('last quarter') || qLower.includes('q1') || qLower.includes('q2') || qLower.includes('q3') || qLower.includes('q4')) && /quarter/i.test(col.name);
        if (qLower.includes(colNameLower) && !isFilterValue(col, qLower) && !isFilterCol) {
          matchedGroupBy.push(col.name);
          break;
        }
      }
    }

    // Detect numeric metrics and aggregations
    const wantsHighest = qLower.includes('highest') || qLower.includes('top') || qLower.includes('most') || qLower.includes('best') || qLower.includes('maximum') || qLower.includes('max');
    const wantsLowest = qLower.includes('lowest') || qLower.includes('bottom') || qLower.includes('least') || qLower.includes('worst') || qLower.includes('minimum') || qLower.includes('min');
    const wantsAverage = qLower.includes('average') || qLower.includes('avg') || qLower.includes('mean');
    const wantsCount = qLower.includes('how many') || qLower.includes('count') || qLower.includes('number of');

    // Identify target metric column
    let targetMetricCol: ColumnProfile | undefined = undefined;
    for (const col of numericCols) {
      const colNameLower = col.name.toLowerCase().replace(/_/g, ' ');
      if (qLower.includes(colNameLower)) {
        targetMetricCol = col;
        break;
      }
    }

    // Keyword synonyms if column wasn't explicitly named
    if (!targetMetricCol) {
      if (qLower.includes('sales') || qLower.includes('revenue') || qLower.includes('turnover')) {
        targetMetricCol = numericCols.find((c) => /rev|sales|amount/i.test(c.name));
      } else if (qLower.includes('profit') || qLower.includes('margin') || qLower.includes('gain')) {
        targetMetricCol = numericCols.find((c) => /profit|margin/i.test(c.name));
      } else if (qLower.includes('unit') || qLower.includes('quantity') || qLower.includes('volume')) {
        targetMetricCol = numericCols.find((c) => /unit|quantity|qty/i.test(c.name));
      } else if (qLower.includes('discount')) {
        targetMetricCol = numericCols.find((c) => /discount/i.test(c.name));
      } else if (qLower.includes('cost') || qLower.includes('expense')) {
        targetMetricCol = numericCols.find((c) => /cost|expense/i.test(c.name));
      } else if (qLower.includes('satisfaction') || qLower.includes('rating') || qLower.includes('score')) {
        targetMetricCol = numericCols.find((c) => /satisfaction|rating|score/i.test(c.name));
      }
    }

    // Default numeric column if still not found and aggregation requested
    if (!targetMetricCol && numericCols.length > 0 && !wantsCount) {
      targetMetricCol = numericCols.find((c) => /rev|sales|profit|amount/i.test(c.name)) || numericCols[0];
    }

    if (wantsCount) {
      matchedAggs = [{ column: '*', func: 'count', alias: 'total_count' }];
      sortColumn = 'total_count';
      sortDir = 'desc';
    } else if (targetMetricCol) {
      const func = wantsAverage ? 'avg' : (wantsLowest && !wantsHighest ? 'min' : (wantsHighest && !wantsLowest && matchedGroupBy.length === 0 ? 'max' : 'sum'));
      const alias = `${func}_${targetMetricCol.name.toLowerCase()}`;
      matchedAggs = [{ column: targetMetricCol.name, func, alias }];
      sortColumn = alias;
      sortDir = wantsLowest ? 'asc' : 'desc';
    }

    // Detect Filters
    const qtrCol = columns.find((c) => /quarter|qtr/i.test(c.name));
    if (qtrCol) {
      if (qLower.includes('last quarter') || qLower.includes('q4')) {
        matchedFilters = matchedFilters.filter((f) => f.column !== qtrCol.name);
        matchedFilters.push({ column: qtrCol.name, operator: '=', value: 'Q4' });
      } else if (qLower.includes('q3')) {
        matchedFilters = matchedFilters.filter((f) => f.column !== qtrCol.name);
        matchedFilters.push({ column: qtrCol.name, operator: '=', value: 'Q3' });
      } else if (qLower.includes('q2')) {
        matchedFilters = matchedFilters.filter((f) => f.column !== qtrCol.name);
        matchedFilters.push({ column: qtrCol.name, operator: '=', value: 'Q2' });
      } else if (qLower.includes('q1')) {
        matchedFilters = matchedFilters.filter((f) => f.column !== qtrCol.name);
        matchedFilters.push({ column: qtrCol.name, operator: '=', value: 'Q1' });
      }
    }

    // Value matches for categorical columns
    for (const col of stringCols) {
      for (const sample of col.sampleValues) {
        if (!sample) continue;
        const sStr = String(sample).trim();
        const sLower = sStr.toLowerCase();
        if (sLower.length >= 3 && qLower.includes(sLower)) {
          if (matchedGroupBy.includes(col.name) && !qLower.includes(`only ${sLower}`) && !qLower.includes(`in ${sLower}`)) {
            continue;
          }
          matchedFilters = matchedFilters.filter((f) => !(f.column === col.name && f.value === sStr));
          matchedFilters.push({ column: col.name, operator: '=', value: sStr });
        }
      }
    }

    // Number limits
    const limitMatch = qLower.match(/top\s+(\d+)/) || qLower.match(/first\s+(\d+)/);
    if (limitMatch) {
      limit = parseInt(limitMatch[1], 10);
    } else if (wantsHighest || wantsLowest) {
      limit = matchedGroupBy.length > 0 ? (qLower.includes('product had the highest') ? 5 : 10) : 10;
    }

    if (qLower.includes('which') && matchedGroupBy.length === 0) {
      const prodCol = columns.find((c) => /product|item|category/i.test(c.name));
      if (prodCol) {
        matchedGroupBy = [prodCol.name];
        limit = 5;
      }
    }

    // Check if user is asking for columns that DO NOT exist at all in dataset
    // (e.g. "salary", "employee count", "churn")
    const commonMissingKeywords = ['salary', 'employee', 'churn', 'weather', 'temperature', 'inventory', 'warehouse', 'tax'];
    for (const kw of commonMissingKeywords) {
      if (qLower.includes(kw)) {
        const hasMatchingCol = columns.some((c) => c.name.toLowerCase().includes(kw));
        if (!hasMatchingCol) {
          return {
            isAmbiguous: true,
            clarification: {
              isAmbiguous: true,
              reason: `The dataset does not contain any column related to "${kw}". Available columns are: ${columns.map((c) => c.name).join(', ')}.`,
              clarificationQuestion: `Would you like to analyze one of the available metrics instead?`,
              options: numericCols.slice(0, 3).map((nc) => ({
                label: `Analyze ${nc.name}`,
                description: `Using available numeric metric ${nc.name}`,
                promptSuggestion: `Show total ${nc.name} by ${matchedGroupBy[0] || (stringCols[0] ? stringCols[0].name : 'category')}`,
              })),
            },
            plan: [
              'Verify column existence against schema',
              `Detect missing attribute: "${kw}"`,
              'Return safe clarification prompt with alternative options',
            ],
            reasoning: `Unresolvable column "${kw}" requested. Clarification required.`,
          };
        }
      }
    }

    // Final AST formulation
    const queryAst: AnalysisQuery = {
      filters: matchedFilters,
      groupBy: matchedGroupBy,
      aggregates: matchedAggs,
      sort: sortColumn ? { column: sortColumn, direction: sortDir } : undefined,
      limit,
    };

    const plan = [
      `1. Analyze user intent from prompt: "${question}"`,
      `2. Identify target measures (${matchedAggs.map((a) => `${a.func}(${a.column})`).join(', ') || 'record selection'}) and groupings (${matchedGroupBy.join(', ') || 'overall'})`,
      matchedFilters.length > 0
        ? `3. Apply filter constraints: ${matchedFilters.map((f) => `${f.column} ${f.operator} '${f.value}'`).join(', ')}`
        : '3. No filter constraints requested',
      `4. Execute read-only aggregation with safe sorting by ${sortColumn || 'default'} ${sortDir.toUpperCase()}`,
      `5. Render visual chart and explain findings with caveats`,
    ];

    return {
      isAmbiguous: false,
      plan,
      queryAst,
      reasoning: 'Extracted safe structured AST query based on dataset column profile and intent heuristics.',
    };
  }
}

function isFilterValue(col: ColumnProfile, qLower: string): boolean {
  return col.sampleValues.some((s) => s && qLower.includes(String(s).toLowerCase()));
}

export const heuristicAgent = new HeuristicAgent();

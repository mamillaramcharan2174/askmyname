import { z } from 'zod';
import { ChartConfig, ChartConfigSchema, InsightSummary, InsightSummarySchema } from '../schema/agent.js';
import { AnalysisQuery } from '../schema/queryAst.js';
import { ColumnProfile } from '../schema/dataset.js';

export const ChartFormatterInputSchema = z.object({
  question: z.string(),
  queryAst: z.custom<AnalysisQuery>(),
  results: z.array(z.record(z.any())),
  columns: z.array(z.custom<ColumnProfile>()),
  totalMatchedRows: z.number(),
});

export type ChartFormatterInput = z.infer<typeof ChartFormatterInputSchema>;

export interface FormatterOutput {
  chartConfig: ChartConfig;
  insight: InsightSummary;
  suggestedFollowUps: string[];
}

const PALETTE = [
  '#0284c7', // Sky 600
  '#0ea5e9', // Sky 500
  '#38bdf8', // Sky 400
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#8b5cf6', // Purple 500
  '#ec4899', // Pink 500
  '#f43f5e', // Rose 500
];

export class ChartFormatterTool {
  name = 'chart_result_formatter';
  description = 'Analyzes computed analysis results, selects the optimal visual chart layout, generates color schemes, and constructs data insights.';

  execute(input: ChartFormatterInput): FormatterOutput {
    const { question, queryAst, results, columns, totalMatchedRows } = input;

    if (!results || results.length === 0) {
      const fallbackConfig: ChartConfig = {
        chartType: 'table',
        title: 'Query Results (0 rows matched)',
        xAxisKey: '',
        yAxisKeys: [],
        legend: false,
      };
      const fallbackInsight: InsightSummary = {
        summary: 'No data matched the requested filter criteria.',
        keyFindings: ['Filter conditions eliminated all rows in the dataset.'],
        dataCaveats: ['Try loosening filter criteria or selecting an alternate date/category.'],
        limitations: ['Empty result set prevents visualization.'],
      };
      return {
        chartConfig: fallbackConfig,
        insight: fallbackInsight,
        suggestedFollowUps: ['Show top 5 categories without filters', 'Show all records'],
      };
    }

    const firstRow = results[0];
    const keys = Object.keys(firstRow);

    // Identify categorical (dimension) keys vs numeric (metric) keys
    const dimensionKeys: string[] = [];
    const metricKeys: string[] = [];

    for (const k of keys) {
      const isNum = typeof firstRow[k] === 'number';
      if (isNum) {
        metricKeys.push(k);
      } else {
        dimensionKeys.push(k);
      }
    }

    // Determine primary dimension and metrics
    const primaryDim = dimensionKeys[0] || (queryAst.groupBy && queryAst.groupBy[0]) || keys[0];
    const primaryMetrics = metricKeys.length > 0 ? metricKeys : [keys[keys.length - 1]];

    // Determine chart type
    let chartType: 'bar' | 'line' | 'pie' | 'area' | 'table' = 'bar';
    const dimLower = primaryDim.toLowerCase();
    const isTemporal = ['date', 'quarter', 'month', 'year', 'day', 'week'].some((t) => dimLower.includes(t));

    const qLower = question.toLowerCase();
    const isRankingOrComparison = qLower.includes('highest') || qLower.includes('top') || qLower.includes('lowest') || qLower.includes('compare') || qLower.includes('which');

    if (results.length === 1 && metricKeys.length <= 1) {
      chartType = 'table';
    } else if (isTemporal) {
      chartType = results.length > 8 ? 'area' : 'line';
    } else if (isRankingOrComparison) {
      chartType = 'bar';
    } else if (results.length >= 2 && results.length <= 6 && metricKeys.length === 1 && (dimLower.includes('segment') || dimLower.includes('status') || dimLower.includes('share') || dimLower.includes('mode'))) {
      chartType = 'pie';
    } else if (dimensionKeys.length === 0 && metricKeys.length > 1) {
      chartType = 'bar';
    } else if (metricKeys.length > 0) {
      chartType = 'bar';
    } else {
      chartType = 'table';
    }

    const yAxisKeys = primaryMetrics.slice(0, 3).map((k, idx) => ({
      key: k,
      label: formatLabel(k),
      color: PALETTE[idx % PALETTE.length],
    }));

    const chartTitle = queryAst.groupBy && queryAst.groupBy.length > 0
      ? `${formatLabel(primaryMetrics[0] || 'Metric')} by ${formatLabel(primaryDim)}`
      : `Analysis Results (${results.length} rows)`;

    const chartConfig: ChartConfig = ChartConfigSchema.parse({
      chartType,
      title: chartTitle,
      xAxisKey: primaryDim,
      yAxisKeys,
      legend: yAxisKeys.length > 1,
    });

    // Generate plain language insights and findings
    const findings: string[] = [];
    let summary = '';

    if (results.length > 0 && metricKeys.length > 0) {
      const topMetric = metricKeys[0];
      const sortedByMetric = [...results].sort((a, b) => Number(b[topMetric] ?? 0) - Number(a[topMetric] ?? 0));
      const highest = sortedByMetric[0];
      const lowest = sortedByMetric[sortedByMetric.length - 1];

      if (dimensionKeys.length > 0) {
        findings.push(
          `**Top Performer:** ${highest[primaryDim]} leads with ${formatVal(highest[topMetric], topMetric)}.`
        );
        if (results.length > 1 && highest !== lowest) {
          findings.push(
            `**Lowest:** ${lowest[primaryDim]} recorded ${formatVal(lowest[topMetric], topMetric)}.`
          );
        }
      }

      // Grand total if multiple rows
      if (results.length > 1) {
        const total = results.reduce((acc, r) => acc + Number(r[topMetric] ?? 0), 0);
        findings.push(`**Total across all ${results.length} groups:** ${formatVal(Math.round(total * 100) / 100, topMetric)}.`);
      }

      summary = `Based on the uploaded dataset, ${highest[primaryDim] ?? 'the calculation'} yielded the highest ${formatLabel(topMetric)} (${formatVal(highest[topMetric], topMetric)}).`;
    } else if (results.length === 1) {
      const vals = Object.entries(results[0]).map(([k, v]) => `${formatLabel(k)}: ${v}`);
      summary = `The query calculated: ${vals.join(', ')}.`;
      findings.push(...vals);
    } else {
      summary = `Retrieved ${results.length} records matching the criteria.`;
      findings.push(`Displaying ${results.length} records in tabular view.`);
    }

    const caveats: string[] = [
      `Computed over ${totalMatchedRows} matching records out of total dataset rows.`,
      `Safe read-only execution applied without modifying underlying CSV data.`,
    ];

    if (queryAst.filters && queryAst.filters.length > 0) {
      const filterSummary = queryAst.filters
        .map((f) => `${f.column} ${f.operator} ${f.value ?? ''}`)
        .join(', ');
      caveats.push(`Active filters: ${filterSummary}`);
    }

    const limitations: string[] = [
      `Results reflect only the columns and records present in this dataset.`,
      `Calculations exclude unparseable or null cell entries for numeric aggregations.`,
    ];

    // Generate context-aware follow-up suggestions
    const followUps: string[] = [];
    const otherDims = columns.filter((c) => c.inferredType === 'string' && c.name !== primaryDim && c.uniqueCount <= 15);
    if (otherDims.length > 0) {
      followUps.push(`Break this down by ${otherDims[0].name}`);
    }
    const dateCol = columns.find((c) => c.inferredType === 'date' || c.name.toLowerCase().includes('quarter'));
    if (dateCol && !isTemporal) {
      followUps.push(`Show trend over time by ${dateCol.name}`);
    }
    if (metricKeys.length > 0) {
      followUps.push(`Show average instead of sum for ${formatLabel(metricKeys[0])}`);
    }
    if (followUps.length === 0) {
      followUps.push('Show top 5 results only', 'Export results to CSV');
    }

    const insight: InsightSummary = InsightSummarySchema.parse({
      summary,
      keyFindings: findings,
      dataCaveats: caveats,
      limitations,
    });

    return {
      chartConfig,
      insight,
      suggestedFollowUps: followUps.slice(0, 3),
    };
  }
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatVal(val: any, metricName: string): string {
  if (typeof val !== 'number') return String(val);
  const lower = metricName.toLowerCase();
  if (lower.includes('rev') || lower.includes('price') || lower.includes('cost') || lower.includes('sales') || lower.includes('profit')) {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (lower.includes('pct') || lower.includes('margin') || lower.includes('discount') || lower.includes('rate') || lower.includes('percent')) {
    return `${val}%`;
  }
  return val.toLocaleString('en-US');
}

export const chartFormatter = new ChartFormatterTool();

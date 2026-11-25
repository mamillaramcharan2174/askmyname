import { sessionStore } from '../data/sessionStore.js';
import { AgentAnalysisResponse, AgentAnalysisResponseSchema, TraceStep } from '../schema/agent.js';
import { safeQueryEngine } from '../tools/safeQueryEngine.js';
import { chartFormatter } from '../tools/chartFormatter.js';
import { aiService } from './aiService.js';
import { AnalysisQuery } from '../schema/queryAst.js';
import { DatasetProfile } from '../schema/dataset.js';

export class AgentRunner {
  async runAnalysis(
    datasetId: string,
    question: string,
    previousQuery?: AnalysisQuery,
    fallbackRows?: Record<string, any>[],
    fallbackProfile?: DatasetProfile
  ): Promise<AgentAnalysisResponse> {
    const totalStart = performance.now();
    const steps: TraceStep[] = [];

    const session = sessionStore.getOrRestoreDataset(datasetId, fallbackRows, fallbackProfile);
    if (!session) {
      throw new Error(`Dataset with ID "${datasetId}" was not found or session has expired.`);
    }

    const { profile, rawRows, history } = session;

    // STEP 1: Schema Profiling & Intent Context
    const step1Start = performance.now();
    const step1: TraceStep = {
      id: 'step_1_schema_intent',
      step: '1. Inspect Dataset Schema & Validate Columns',
      tool: 'schema_profiler',
      status: 'running',
      durationMs: 0,
      input: {
        datasetId,
        filename: profile.filename,
        columnCount: profile.columns.length,
        rowCount: profile.rowCount,
      },
    };
    steps.push(step1);

    // Profile inspection observation
    step1.output = {
      columnsAvailable: profile.columns.map((c) => `${c.name} (${c.inferredType})`),
      totalRows: profile.rowCount,
      detectedIssues: profile.issues.length,
    };
    step1.status = 'completed';
    step1.durationMs = Math.round(performance.now() - step1Start);

    // STEP 2: Intent Planning & AST Formulation (AI / Heuristic)
    const step2Start = performance.now();
    const step2: TraceStep = {
      id: 'step_2_plan_ast',
      step: '2. Formulate Safe AST Query & Check Ambiguity',
      tool: 'intent_planner',
      status: 'running',
      durationMs: 0,
      input: { question, dataset: profile.filename },
    };
    steps.push(step2);

    const convHistory = history.slice(0, 3).map((h) => ({
      question: h.question,
      answerSummary: h.response.insight?.summary || '',
    }));

    const planResult = await aiService.planQuery(question, profile, previousQuery, convHistory);

    step2.output = {
      isAmbiguous: planResult.isAmbiguous,
      reasoning: planResult.reasoning,
      plan: planResult.plan,
      queryAst: planResult.queryAst,
    };
    step2.status = 'completed';
    step2.durationMs = Math.round(performance.now() - step2Start);

    // If ambiguous or unresolvable question, return clarification prompt immediately
    if (planResult.isAmbiguous && planResult.clarification) {
      const response: AgentAnalysisResponse = {
        success: true,
        isClarification: true,
        clarification: planResult.clarification,
        question,
        plan: planResult.plan,
        steps,
        suggestedFollowUps: planResult.clarification.options.map((o) => o.promptSuggestion),
        executionTimeMs: Math.round(performance.now() - totalStart),
      };

      sessionStore.addHistory(datasetId, question, response);
      return AgentAnalysisResponseSchema.parse(response);
    }

    if (!planResult.queryAst) {
      throw new Error('Agent failed to formulate an analysis query for this request.');
    }

    // STEP 3: Safe Data Engine Execution
    const step3Start = performance.now();
    const step3: TraceStep = {
      id: 'step_3_execute_engine',
      step: '3. Execute Read-Only Aggregations (Zero Eval)',
      tool: 'safe_data_engine',
      status: 'running',
      durationMs: 0,
      input: {
        filtersCount: planResult.queryAst.filters?.length || 0,
        groupBy: planResult.queryAst.groupBy,
        aggregates: planResult.queryAst.aggregates,
        sort: planResult.queryAst.sort,
        limit: planResult.queryAst.limit,
      },
    };
    steps.push(step3);

    let queryResult;
    try {
      queryResult = safeQueryEngine.execute({
        query: planResult.queryAst,
        columns: profile.columns,
        rows: rawRows,
      });

      step3.output = {
        pseudoSql: queryResult.pseudoSql,
        matchedRows: queryResult.totalMatchedRows,
        resultRows: queryResult.outputRowsCount,
      };
      step3.status = 'completed';
      step3.durationMs = Math.round(performance.now() - step3Start);
    } catch (engineErr: any) {
      step3.status = 'failed';
      step3.error = engineErr.message;
      step3.durationMs = Math.round(performance.now() - step3Start);
      throw engineErr;
    }

    // STEP 4: Format Results, Charts, and Insights
    const step4Start = performance.now();
    const step4: TraceStep = {
      id: 'step_4_format_chart',
      step: '4. Format Visualization, Metrics & Insights',
      tool: 'chart_result_formatter',
      status: 'running',
      durationMs: 0,
      input: {
        resultsCount: queryResult.results.length,
        question,
      },
    };
    steps.push(step4);

    const formatted = chartFormatter.execute({
      question,
      queryAst: planResult.queryAst,
      results: queryResult.results,
      columns: profile.columns,
      totalMatchedRows: queryResult.totalMatchedRows,
    });

    step4.output = {
      selectedChart: formatted.chartConfig.chartType,
      xAxisKey: formatted.chartConfig.xAxisKey,
      yAxisCount: formatted.chartConfig.yAxisKeys.length,
      insightsCount: formatted.insight.keyFindings.length,
    };
    step4.status = 'completed';
    step4.durationMs = Math.round(performance.now() - step4Start);

    const response: AgentAnalysisResponse = {
      success: true,
      isClarification: false,
      question,
      plan: planResult.plan,
      steps,
      queryAst: planResult.queryAst,
      pseudoSql: queryResult.pseudoSql,
      totalMatchedRows: queryResult.totalMatchedRows,
      outputRowsCount: queryResult.outputRowsCount,
      results: queryResult.results,
      chartConfig: formatted.chartConfig,
      insight: formatted.insight,
      suggestedFollowUps: formatted.suggestedFollowUps,
      executionTimeMs: Math.round(performance.now() - totalStart),
    };

    // Save to session history
    sessionStore.addHistory(datasetId, question, response);

    return AgentAnalysisResponseSchema.parse(response);
  }
}

export const agentRunner = new AgentRunner();

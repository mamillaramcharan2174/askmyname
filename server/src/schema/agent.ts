import { z } from 'zod';
import { AnalysisQuerySchema } from './queryAst.js';

export const TraceStepSchema = z.object({
  id: z.string(),
  step: z.string(),
  tool: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  durationMs: z.number(),
  input: z.any().optional(),
  output: z.any().optional(),
  error: z.string().optional(),
});

export type TraceStep = z.infer<typeof TraceStepSchema>;

export const ClarificationOptionSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  promptSuggestion: z.string(),
});

export type ClarificationOption = z.infer<typeof ClarificationOptionSchema>;

export const ClarificationPromptSchema = z.object({
  isAmbiguous: z.literal(true),
  reason: z.string(),
  clarificationQuestion: z.string(),
  options: z.array(ClarificationOptionSchema),
});

export type ClarificationPrompt = z.infer<typeof ClarificationPromptSchema>;

export const ChartConfigSchema = z.object({
  chartType: z.enum(['bar', 'line', 'pie', 'area', 'table']),
  title: z.string(),
  xAxisKey: z.string(),
  yAxisKeys: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      color: z.string().optional(),
    })
  ),
  legend: z.boolean().default(true),
});

export type ChartConfig = z.infer<typeof ChartConfigSchema>;

export const InsightSummarySchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  dataCaveats: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type InsightSummary = z.infer<typeof InsightSummarySchema>;

export const AgentAnalysisResponseSchema = z.object({
  success: z.boolean(),
  isClarification: z.boolean(),
  clarification: ClarificationPromptSchema.optional(),
  question: z.string(),
  plan: z.array(z.string()),
  steps: z.array(TraceStepSchema),
  queryAst: AnalysisQuerySchema.optional(),
  pseudoSql: z.string().optional(),
  totalMatchedRows: z.number().optional(),
  outputRowsCount: z.number().optional(),
  results: z.array(z.record(z.any())).optional(),
  chartConfig: ChartConfigSchema.optional(),
  insight: InsightSummarySchema.optional(),
  suggestedFollowUps: z.array(z.string()),
  executionTimeMs: z.number(),
  error: z.string().optional(),
});

export type AgentAnalysisResponse = z.infer<typeof AgentAnalysisResponseSchema>;

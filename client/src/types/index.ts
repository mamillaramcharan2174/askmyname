export type InferredType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnProfile {
  name: string;
  inferredType: InferredType;
  nullable: boolean;
  nullCount: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  sampleValues: any[];
}

export interface DatasetIssue {
  severity: 'warning' | 'info';
  message: string;
  column?: string;
}

export interface DatasetProfile {
  id: string;
  filename: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  issues: DatasetIssue[];
  previewRows: Record<string, any>[];
  uploadedAt: string;
}

export interface TraceStep {
  id: string;
  step: string;
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  durationMs: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface ClarificationOption {
  label: string;
  description?: string;
  promptSuggestion: string;
}

export interface ClarificationPrompt {
  isAmbiguous: true;
  reason: string;
  clarificationQuestion: string;
  options: ClarificationOption[];
}

export interface ChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'table';
  title: string;
  xAxisKey: string;
  yAxisKeys: Array<{
    key: string;
    label: string;
    color?: string;
  }>;
  legend: boolean;
}

export interface InsightSummary {
  summary: string;
  keyFindings: string[];
  dataCaveats: string[];
  limitations: string[];
}

export interface FilterCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'is_null' | 'not_null';
  value?: any;
}

export interface AggregationItem {
  column: string;
  func: 'count' | 'sum' | 'avg' | 'min' | 'max';
  alias: string;
}

export interface AnalysisQuery {
  select?: string[];
  filters?: FilterCondition[];
  groupBy?: string[];
  aggregates?: AggregationItem[];
  derivedMetric?: {
    name: string;
    formula: 'difference' | 'ratio' | 'percentage' | 'margin';
    columnA: string;
    columnB: string;
  };
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export interface AgentAnalysisResponse {
  success: boolean;
  isClarification: boolean;
  clarification?: ClarificationPrompt;
  question: string;
  plan: string[];
  steps: TraceStep[];
  queryAst?: AnalysisQuery;
  pseudoSql?: string;
  totalMatchedRows?: number;
  outputRowsCount?: number;
  results?: Record<string, any>[];
  chartConfig?: ChartConfig;
  insight?: InsightSummary;
  suggestedFollowUps: string[];
  executionTimeMs: number;
  error?: string;
}

export interface AgentStatus {
  status: string;
  aiProvider: string;
  mode: string;
  supportedFeatures: string[];
}

export interface HistoryItem {
  id: string;
  question: string;
  response: AgentAnalysisResponse;
  timestamp: string;
}

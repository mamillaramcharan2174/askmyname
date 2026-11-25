import { z } from 'zod';

export const FilterOperatorSchema = z.enum([
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  'contains',
  'starts_with',
  'ends_with',
  'in',
  'not_in',
  'is_null',
  'not_null',
]);

export type FilterOperator = z.infer<typeof FilterOperatorSchema>;

export const FilterConditionSchema = z.object({
  column: z.string().min(1),
  operator: FilterOperatorSchema,
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
    z.null(),
  ]).optional(),
});

export type FilterCondition = z.infer<typeof FilterConditionSchema>;

export const AggregationFuncSchema = z.enum(['count', 'sum', 'avg', 'min', 'max']);
export type AggregationFunc = z.infer<typeof AggregationFuncSchema>;

export const AggregationItemSchema = z.object({
  column: z.string().min(1),
  func: AggregationFuncSchema,
  alias: z.string().min(1),
});

export type AggregationItem = z.infer<typeof AggregationItemSchema>;

export const DerivedMetricSchema = z.object({
  name: z.string().min(1),
  formula: z.enum(['difference', 'ratio', 'percentage', 'margin']),
  columnA: z.string().min(1),
  columnB: z.string().min(1),
});

export type DerivedMetric = z.infer<typeof DerivedMetricSchema>;

export const SortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirectionSchema>;

export const SortItemSchema = z.object({
  column: z.string().min(1),
  direction: SortDirectionSchema.default('desc'),
});

export type SortItem = z.infer<typeof SortItemSchema>;

export const AnalysisQuerySchema = z.object({
  select: z.array(z.string()).optional(),
  filters: z.array(FilterConditionSchema).optional().default([]),
  groupBy: z.array(z.string()).optional().default([]),
  aggregates: z.array(AggregationItemSchema).optional().default([]),
  derivedMetric: DerivedMetricSchema.optional(),
  sort: SortItemSchema.optional(),
  limit: z.number().int().positive().max(1000).default(50),
});

export type AnalysisQuery = z.infer<typeof AnalysisQuerySchema>;

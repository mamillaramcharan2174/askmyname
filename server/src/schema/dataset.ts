import { z } from 'zod';

export const InferredTypeSchema = z.enum(['number', 'string', 'date', 'boolean']);
export type InferredType = z.infer<typeof InferredTypeSchema>;

export const ColumnProfileSchema = z.object({
  name: z.string(),
  inferredType: InferredTypeSchema,
  nullable: z.boolean(),
  nullCount: z.number(),
  uniqueCount: z.number(),
  min: z.union([z.number(), z.string()]).optional(),
  max: z.union([z.number(), z.string()]).optional(),
  sampleValues: z.array(z.any()),
});

export type ColumnProfile = z.infer<typeof ColumnProfileSchema>;

export const DatasetIssueSchema = z.object({
  severity: z.enum(['warning', 'info']),
  message: z.string(),
  column: z.string().optional(),
});

export type DatasetIssue = z.infer<typeof DatasetIssueSchema>;

export const DatasetProfileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  rowCount: z.number(),
  columnCount: z.number(),
  columns: z.array(ColumnProfileSchema),
  issues: z.array(DatasetIssueSchema),
  previewRows: z.array(z.record(z.any())),
  uploadedAt: z.string(),
});

export type DatasetProfile = z.infer<typeof DatasetProfileSchema>;

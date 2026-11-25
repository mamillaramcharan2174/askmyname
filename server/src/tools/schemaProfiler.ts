import { z } from 'zod';
import { ColumnProfile, DatasetIssue, DatasetProfile, DatasetProfileSchema, InferredType } from '../schema/dataset.js';

export const SchemaProfilerInputSchema = z.object({
  datasetId: z.string(),
  filename: z.string(),
  rows: z.array(z.record(z.any())).min(1, 'Dataset must have at least 1 row'),
});

export type SchemaProfilerInput = z.infer<typeof SchemaProfilerInputSchema>;

export class SchemaProfilerTool {
  name = 'schema_profiler';
  description = 'Inspects dataset structure, infers strict data types, calculates basic statistics, and identifies quality issues.';

  execute(input: SchemaProfilerInput): DatasetProfile {
    const validatedInput = SchemaProfilerInputSchema.parse(input);
    const { datasetId, filename, rows } = validatedInput;

    if (rows.length === 0) {
      throw new Error('Dataset contains zero rows');
    }

    const columnNames = Object.keys(rows[0] || {});
    if (columnNames.length === 0) {
      throw new Error('Dataset has no detectable column headers');
    }

    const columns: ColumnProfile[] = [];
    const issues: DatasetIssue[] = [];

    const sampleLimit = Math.min(rows.length, 500);

    for (const col of columnNames) {
      let nullCount = 0;
      let numberCount = 0;
      let dateCount = 0;
      let booleanCount = 0;
      let totalChecked = 0;
      const uniqueVals = new Set<string>();
      const sampleVals: any[] = [];
      let minNum: number | undefined = undefined;
      let maxNum: number | undefined = undefined;
      let minDate: string | undefined = undefined;
      let maxDate: string | undefined = undefined;

      for (let i = 0; i < sampleLimit; i++) {
        const val = rows[i][col];
        if (val === undefined || val === null || val === '' || val === 'null' || val === 'N/A' || val === 'NaN') {
          nullCount++;
          continue;
        }

        totalChecked++;
        const strVal = String(val).trim();
        uniqueVals.add(strVal);

        if (sampleVals.length < 5 && !sampleVals.includes(val)) {
          sampleVals.push(val);
        }

        // Check boolean
        if (['true', 'false', 'yes', 'no'].includes(strVal.toLowerCase())) {
          booleanCount++;
        }

        // Check numeric
        const cleanNumStr = strVal.replace(/[$,]/g, '');
        const parsedNum = Number(cleanNumStr);
        if (!isNaN(parsedNum) && cleanNumStr !== '') {
          numberCount++;
          if (minNum === undefined || parsedNum < minNum) minNum = parsedNum;
          if (maxNum === undefined || parsedNum > maxNum) maxNum = parsedNum;
        }

        // Check Date
        if (isNaN(parsedNum) && strVal.length >= 8 && (strVal.includes('-') || strVal.includes('/'))) {
          const timestamp = Date.parse(strVal);
          if (!isNaN(timestamp)) {
            dateCount++;
            if (minDate === undefined || strVal < minDate) minDate = strVal;
            if (maxDate === undefined || strVal > maxDate) maxDate = strVal;
          }
        }
      }

      // Infer dominant type
      let inferredType: InferredType = 'string';
      if (totalChecked > 0) {
        if (numberCount / totalChecked > 0.8) {
          inferredType = 'number';
        } else if (dateCount / totalChecked > 0.8) {
          inferredType = 'date';
        } else if (booleanCount / totalChecked > 0.8) {
          inferredType = 'boolean';
        }
      }

      // Count full null count across whole dataset if rows > sampleLimit
      let fullNullCount = nullCount;
      if (rows.length > sampleLimit) {
        let count = 0;
        for (const row of rows) {
          const v = row[col];
          if (v === undefined || v === null || v === '' || v === 'null' || v === 'N/A') {
            count++;
          }
        }
        fullNullCount = count;
      }

      // Identify quality issues
      const nullRatio = fullNullCount / rows.length;
      if (nullRatio > 0.5) {
        issues.push({
          severity: 'warning',
          column: col,
          message: `Column "${col}" has ${Math.round(nullRatio * 100)}% missing or null values.`,
        });
      }

      if (uniqueVals.size === 1 && rows.length > 5) {
        issues.push({
          severity: 'info',
          column: col,
          message: `Column "${col}" has only 1 unique constant value across all rows.`,
        });
      }

      columns.push({
        name: col,
        inferredType,
        nullable: fullNullCount > 0,
        nullCount: fullNullCount,
        uniqueCount: uniqueVals.size,
        min: inferredType === 'number' ? minNum : (inferredType === 'date' ? minDate : undefined),
        max: inferredType === 'number' ? maxNum : (inferredType === 'date' ? maxDate : undefined),
        sampleValues: sampleVals,
      });
    }

    const profile: DatasetProfile = {
      id: datasetId,
      filename,
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
      issues,
      previewRows: rows.slice(0, 15),
      uploadedAt: new Date().toISOString(),
    };

    return DatasetProfileSchema.parse(profile);
  }
}

export const schemaProfiler = new SchemaProfilerTool();

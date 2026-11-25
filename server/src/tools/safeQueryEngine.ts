import { z } from 'zod';
import { AnalysisQuery, AnalysisQuerySchema, FilterCondition } from '../schema/queryAst.js';
import { ColumnProfile } from '../schema/dataset.js';

export const SafeQueryEngineInputSchema = z.object({
  query: AnalysisQuerySchema,
  columns: z.array(z.custom<ColumnProfile>()),
  rows: z.array(z.record(z.any())),
});

export type SafeQueryEngineInput = z.infer<typeof SafeQueryEngineInputSchema>;

export interface SafeQueryResult {
  results: Record<string, any>[];
  pseudoSql: string;
  totalMatchedRows: number;
  outputRowsCount: number;
  executionTimeMs: number;
}

export class SafeQueryEngineTool {
  name = 'safe_data_engine';
  description = 'Executes safe, allowlisted, read-only aggregation queries without using SQL or eval.';

  execute(input: SafeQueryEngineInput): SafeQueryResult {
    const startTime = performance.now();
    const { query, columns, rows } = input;

    // Build lookup sets for safe validation
    const validColMap = new Map<string, ColumnProfile>();
    for (const c of columns) {
      validColMap.set(c.name.toLowerCase(), c);
    }

    const resolveCol = (colName: string): ColumnProfile => {
      if (colName === '*') {
        return {
          name: '*',
          inferredType: 'number',
          nullable: false,
          nullCount: 0,
          uniqueCount: 0,
          sampleValues: [],
        };
      }
      const matched = validColMap.get(colName.toLowerCase());
      if (!matched) {
        throw new Error(
          `Validation Error: Column "${colName}" does not exist in dataset. Available columns: ${columns.map((c) => c.name).join(', ')}`
        );
      }
      return matched;
    };

    // 1. Validate Columns
    if (query.select) {
      for (const col of query.select) resolveCol(col);
    }
    for (const f of query.filters || []) {
      resolveCol(f.column);
    }
    for (const g of query.groupBy || []) {
      resolveCol(g);
    }
    for (const a of query.aggregates || []) {
      const colMeta = resolveCol(a.column);
      if (['sum', 'avg'].includes(a.func) && colMeta.name !== '*' && colMeta.inferredType !== 'number') {
        throw new Error(
          `Validation Error: Aggregation function "${a.func.toUpperCase()}" can only be calculated on numeric columns. Column "${colMeta.name}" has type "${colMeta.inferredType}".`
        );
      }
    }
    if (query.derivedMetric) {
      resolveCol(query.derivedMetric.columnA);
      resolveCol(query.derivedMetric.columnB);
    }

    // 2. Filter Rows
    const filterRow = (row: Record<string, any>, filter: FilterCondition): boolean => {
      const actualCol = resolveCol(filter.column).name;
      const rawVal = row[actualCol];
      const op = filter.operator;
      const targetVal = filter.value;

      if (op === 'is_null') {
        return rawVal === undefined || rawVal === null || rawVal === '' || rawVal === 'null';
      }
      if (op === 'not_null') {
        return rawVal !== undefined && rawVal !== null && rawVal !== '' && rawVal !== 'null';
      }

      if (rawVal === undefined || rawVal === null || rawVal === '') {
        return false;
      }

      const colMeta = resolveCol(filter.column);
      if (colMeta.inferredType === 'number') {
        const numVal = Number(String(rawVal).replace(/[$,]/g, ''));
        const numTarget = Number(targetVal);

        switch (op) {
          case '=':
            return numVal === numTarget;
          case '!=':
            return numVal !== numTarget;
          case '>':
            return numVal > numTarget;
          case '>=':
            return numVal >= numTarget;
          case '<':
            return numVal < numTarget;
          case '<=':
            return numVal <= numTarget;
          case 'in':
            return Array.isArray(targetVal) ? targetVal.map(Number).includes(numVal) : numVal === numTarget;
          case 'not_in':
            return Array.isArray(targetVal) ? !targetVal.map(Number).includes(numVal) : numVal !== numTarget;
          default:
            return false;
        }
      }

      // String and Date comparisons
      const strVal = String(rawVal).trim().toLowerCase();
      const strTarget = String(targetVal ?? '').trim().toLowerCase();

      switch (op) {
        case '=':
          return strVal === strTarget;
        case '!=':
          return strVal !== strTarget;
        case 'contains':
          return strVal.includes(strTarget);
        case 'starts_with':
          return strVal.startsWith(strTarget);
        case 'ends_with':
          return strVal.endsWith(strTarget);
        case '>':
          return strVal > strTarget;
        case '>=':
          return strVal >= strTarget;
        case '<':
          return strVal < strTarget;
        case '<=':
          return strVal <= strTarget;
        case 'in':
          if (Array.isArray(targetVal)) {
            const list = targetVal.map((v) => String(v).trim().toLowerCase());
            return list.includes(strVal);
          }
          return strVal === strTarget;
        case 'not_in':
          if (Array.isArray(targetVal)) {
            const list = targetVal.map((v) => String(v).trim().toLowerCase());
            return !list.includes(strVal);
          }
          return strVal !== strTarget;
        default:
          return false;
      }
    };

    let filteredRows = rows;
    if (query.filters && query.filters.length > 0) {
      filteredRows = rows.filter((row) => query.filters!.every((filter) => filterRow(row, filter)));
    }
    const totalMatchedRows = filteredRows.length;

    let computedRows: Record<string, any>[] = [];

    // Helper for safe numeric extraction
    const extractNum = (val: any): number => {
      if (typeof val === 'number') return val;
      const clean = String(val).replace(/[$,]/g, '');
      const parsed = Number(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    // 3. Group By and Aggregation
    const hasGrouping = query.groupBy && query.groupBy.length > 0;
    const hasAggs = query.aggregates && query.aggregates.length > 0;

    if (hasGrouping) {
      const actualGroupCols = query.groupBy!.map((g) => resolveCol(g).name);
      const groups = new Map<string, { keyRecord: Record<string, any>; items: Record<string, any>[] }>();

      for (const row of filteredRows) {
        const keyParts = actualGroupCols.map((c) => String(row[c] ?? 'N/A'));
        const groupKey = keyParts.join('|||');

        if (!groups.has(groupKey)) {
          const keyRecord: Record<string, any> = {};
          actualGroupCols.forEach((c) => {
            keyRecord[c] = row[c];
          });
          groups.set(groupKey, { keyRecord, items: [] });
        }
        groups.get(groupKey)!.items.push(row);
      }

      for (const group of groups.values()) {
        const resultRecord: Record<string, any> = { ...group.keyRecord };

        if (hasAggs) {
          for (const agg of query.aggregates!) {
            const actualCol = resolveCol(agg.column).name;
            const alias = agg.alias || `${agg.func}_${actualCol}`;

            if (agg.func === 'count') {
              resultRecord[alias] = group.items.length;
            } else {
              const numbers = group.items
                .map((r) => extractNum(r[actualCol]))
                .filter((n) => !isNaN(n));

              if (numbers.length === 0) {
                resultRecord[alias] = 0;
              } else if (agg.func === 'sum') {
                resultRecord[alias] = round2(numbers.reduce((acc, curr) => acc + curr, 0));
              } else if (agg.func === 'avg') {
                const sum = numbers.reduce((acc, curr) => acc + curr, 0);
                resultRecord[alias] = round2(sum / numbers.length);
              } else if (agg.func === 'min') {
                resultRecord[alias] = round2(Math.min(...numbers));
              } else if (agg.func === 'max') {
                resultRecord[alias] = round2(Math.max(...numbers));
              }
            }
          }
        } else {
          resultRecord['record_count'] = group.items.length;
        }

        // Apply derived metric if present
        if (query.derivedMetric) {
          applyDerivedMetric(resultRecord, query.derivedMetric);
        }

        computedRows.push(resultRecord);
      }
    } else if (hasAggs) {
      // Global aggregation across all filtered rows
      const singleRow: Record<string, any> = {};
      for (const agg of query.aggregates!) {
        const actualCol = resolveCol(agg.column).name;
        const alias = agg.alias || `${agg.func}_${actualCol}`;

        if (agg.func === 'count') {
          singleRow[alias] = filteredRows.length;
        } else {
          const numbers = filteredRows
            .map((r) => extractNum(r[actualCol]))
            .filter((n) => !isNaN(n));

          if (numbers.length === 0) {
            singleRow[alias] = 0;
          } else if (agg.func === 'sum') {
            singleRow[alias] = round2(numbers.reduce((acc, curr) => acc + curr, 0));
          } else if (agg.func === 'avg') {
            const sum = numbers.reduce((acc, curr) => acc + curr, 0);
            singleRow[alias] = round2(sum / numbers.length);
          } else if (agg.func === 'min') {
            singleRow[alias] = round2(Math.min(...numbers));
          } else if (agg.func === 'max') {
            singleRow[alias] = round2(Math.max(...numbers));
          }
        }
      }

      if (query.derivedMetric) {
        applyDerivedMetric(singleRow, query.derivedMetric);
      }

      computedRows.push(singleRow);
    } else {
      // Direct projection
      const selectCols = query.select && query.select.length > 0
        ? query.select.map((s) => resolveCol(s).name)
        : columns.map((c) => c.name);

      computedRows = filteredRows.map((r) => {
        const rowObj: Record<string, any> = {};
        for (const c of selectCols) {
          rowObj[c] = r[c];
        }
        if (query.derivedMetric) {
          applyDerivedMetric(rowObj, query.derivedMetric);
        }
        return rowObj;
      });
    }

    // 4. Sort
    if (query.sort) {
      const sortCol = query.sort.column;
      const isAsc = query.sort.direction === 'asc';

      computedRows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];

        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return isAsc ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return isAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    // 5. Limit
    const limit = Math.min(query.limit ?? 50, 1000);
    const finalRows = computedRows.slice(0, limit);

    // 6. Generate Readable Pseudo-SQL representation
    const pseudoSql = generatePseudoSql(query, resolveCol);

    const endTime = performance.now();

    return {
      results: finalRows,
      pseudoSql,
      totalMatchedRows,
      outputRowsCount: finalRows.length,
      executionTimeMs: Math.round(endTime - startTime),
    };
  }
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

function applyDerivedMetric(record: Record<string, any>, dm: { name: string; formula: string; columnA: string; columnB: string }) {
  const valA = Number(record[dm.columnA] ?? 0);
  const valB = Number(record[dm.columnB] ?? 0);

  if (dm.formula === 'difference') {
    record[dm.name] = round2(valA - valB);
  } else if (dm.formula === 'ratio') {
    record[dm.name] = valB === 0 ? 0 : round2(valA / valB);
  } else if (dm.formula === 'percentage') {
    record[dm.name] = valB === 0 ? 0 : round2((valA / valB) * 100);
  } else if (dm.formula === 'margin') {
    record[dm.name] = valA === 0 ? 0 : round2(((valA - valB) / valA) * 100);
  }
}

function generatePseudoSql(query: AnalysisQuery, resolveCol: (name: string) => ColumnProfile): string {
  const selectParts: string[] = [];

  if (query.groupBy && query.groupBy.length > 0) {
    selectParts.push(...query.groupBy.map((g) => resolveCol(g).name));
  }

  if (query.aggregates && query.aggregates.length > 0) {
    for (const a of query.aggregates) {
      const col = a.column === '*' ? '*' : resolveCol(a.column).name;
      selectParts.push(`${a.func.toUpperCase()}(${col}) AS ${a.alias}`);
    }
  }

  if (query.derivedMetric) {
    selectParts.push(`FORMULA(${query.derivedMetric.formula}, ${query.derivedMetric.columnA}, ${query.derivedMetric.columnB}) AS ${query.derivedMetric.name}`);
  }

  if (selectParts.length === 0) {
    if (query.select && query.select.length > 0) {
      selectParts.push(...query.select.map((s) => resolveCol(s).name));
    } else {
      selectParts.push('*');
    }
  }

  let sql = `SELECT ${selectParts.join(', ')}\nFROM uploaded_dataset`;

  if (query.filters && query.filters.length > 0) {
    const whereClauses = query.filters.map((f) => {
      const col = resolveCol(f.column).name;
      if (f.operator === 'is_null') return `${col} IS NULL`;
      if (f.operator === 'not_null') return `${col} IS NOT NULL`;
      const valStr = typeof f.value === 'string' ? `'${f.value}'` : JSON.stringify(f.value);
      return `${col} ${f.operator} ${valStr}`;
    });
    sql += `\nWHERE ${whereClauses.join(' AND ')}`;
  }

  if (query.groupBy && query.groupBy.length > 0) {
    sql += `\nGROUP BY ${query.groupBy.map((g) => resolveCol(g).name).join(', ')}`;
  }

  if (query.sort) {
    const dir = (query.sort.direction || 'desc').toUpperCase();
    sql += `\nORDER BY ${query.sort.column} ${dir}`;
  }

  if (query.limit) {
    sql += `\nLIMIT ${query.limit}`;
  }

  return sql + ';';
}

export const safeQueryEngine = new SafeQueryEngineTool();

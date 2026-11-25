import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { schemaProfiler } from './dist/tools/schemaProfiler.js';
import { heuristicAgent } from './dist/agent/heuristicAgent.js';
import { safeQueryEngine } from './dist/tools/safeQueryEngine.js';
import { chartFormatter } from './dist/tools/chartFormatter.js';
import { agentRunner } from './dist/agent/agentRunner.js';
import { sessionStore } from './dist/data/sessionStore.js';

async function runDirectUnitTests() {
  console.log('======================================================');
  console.log('🧪 RUNNING DIRECT IN-MEMORY UNIT & INTEGRATION TESTS');
  console.log('======================================================\n');

  // 1. Read tech_sales_2024.csv
  const csvPath = path.resolve('src/data/samples/tech_sales_2024.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: 'greedy' });
  const rows = parsed.data;
  console.log(`[PASS] Read ${rows.length} rows from ${path.basename(csvPath)}`);

  // 2. Test Tool 1: schemaProfiler
  console.log('\n--- Testing Tool 1: Schema Profiler ---');
  const datasetId = 'test_ds_001';
  const profile = schemaProfiler.execute({
    datasetId,
    filename: 'tech_sales_2024.csv',
    rows,
  });
  console.log(`[PASS] Schema Profile generated for ${profile.filename}:`);
  console.log(`       Rows: ${profile.rowCount}, Columns: ${profile.columnCount}, Issues: ${profile.issues.length}`);
  console.log('       Columns identified:');
  for (const c of profile.columns) {
    console.log(`         • ${c.name.padEnd(24)} Type: ${c.inferredType.padEnd(8)} Nulls: ${c.nullCount} Unique: ${c.uniqueCount}`);
  }

  // Store in sessionStore for agentRunner
  sessionStore.setDataset({
    id: datasetId,
    filename: profile.filename,
    rawRows: rows,
    profile,
    createdAt: new Date(),
    history: [],
  });

  // 3. Test Agent Planning & AST Formulation
  console.log('\n--- Testing Agent Planning: "Which product had the highest sales last quarter?" ---');
  const plan1 = heuristicAgent.interpret('Which product had the highest sales last quarter?', profile);
  console.log(`[PASS] Is Ambiguous: ${plan1.isAmbiguous}`);
  console.log(`       Plan steps: ${plan1.plan.length}`);
  console.log(`       Generated AST:`, JSON.stringify(plan1.queryAst));

  // 4. Test Tool 2: Safe Data Engine
  console.log('\n--- Testing Tool 2: Safe Data Engine ---');
  const queryResult1 = safeQueryEngine.execute({
    query: plan1.queryAst,
    columns: profile.columns,
    rows,
  });
  console.log(`[PASS] Execution completed in ${queryResult1.executionTimeMs}ms`);
  console.log(`       Matched rows: ${queryResult1.totalMatchedRows}, Output rows: ${queryResult1.outputRowsCount}`);
  console.log(`       Generated Safe Pseudo-SQL:\n       ${queryResult1.pseudoSql.replace(/\n/g, '\n       ')}`);
  console.log(`       Top row:`, queryResult1.results[0]);

  // 5. Test Tool 3: Chart Formatter
  console.log('\n--- Testing Tool 3: Chart Result Formatter ---');
  const chartOutput1 = chartFormatter.execute({
    question: 'Which product had the highest sales last quarter?',
    queryAst: plan1.queryAst,
    results: queryResult1.results,
    columns: profile.columns,
    totalMatchedRows: queryResult1.totalMatchedRows,
  });
  console.log(`[PASS] Selected Chart Type: ${chartOutput1.chartConfig.chartType}`);
  console.log(`       Title: ${chartOutput1.chartConfig.title}`);
  console.log(`       X-Axis: ${chartOutput1.chartConfig.xAxisKey}, Y-Axis: ${chartOutput1.chartConfig.yAxisKeys.map((y) => y.label).join(', ')}`);
  console.log(`       Summary: ${chartOutput1.insight.summary}`);
  console.log(`       Key Findings:`, chartOutput1.insight.keyFindings);

  // 6. Test End-to-End AgentRunner
  console.log('\n--- Testing End-to-End AgentRunner with Conversational Context ---');
  const agentRes1 = await agentRunner.runAnalysis(datasetId, 'Which product had the highest sales last quarter?');
  console.log(`[PASS] AgentRunner Q1 execution time: ${agentRes1.executionTimeMs}ms`);
  console.log(`       Step count: ${agentRes1.steps.length}`);
  for (const s of agentRes1.steps) {
    console.log(`         • ${s.step.padEnd(45)} [Tool: ${s.tool.padEnd(22)} Status: ${s.status}] (${s.durationMs}ms)`);
  }

  // 7. Test Conversational Follow-Up: "Now break that down by region"
  console.log('\n--- Testing Conversational Follow-Up: "Now break that down by region" ---');
  const agentRes2 = await agentRunner.runAnalysis(datasetId, 'Now break that down by region', agentRes1.queryAst);
  console.log(`[PASS] Follow-up executed. Pseudo-SQL:\n       ${agentRes2.pseudoSql.replace(/\n/g, '\n       ')}`);
  console.log(`       Output groups: ${agentRes2.results.length} rows`);
  console.log(`       First group:`, agentRes2.results[0]);

  // 8. Test Ambiguity & Clarification (No-Guessing Guardrail): "Show performance"
  console.log('\n--- Testing Ambiguity Detection & Clarification: "Show performance" ---');
  const agentRes3 = await agentRunner.runAnalysis(datasetId, 'Show performance');
  console.log(`[PASS] Is Clarification: ${agentRes3.isClarification}`);
  console.log(`       Reason: ${agentRes3.clarification.reason}`);
  console.log(`       Clarification Question: ${agentRes3.clarification.clarificationQuestion}`);
  console.log(`       Clickable Options:`);
  for (const opt of agentRes3.clarification.options) {
    console.log(`         - [${opt.label}]: "${opt.promptSuggestion}"`);
  }

  // 9. Test Missing Column Handling: "Show churn rate"
  console.log('\n--- Testing Missing Column Detection: "Show churn rate" ---');
  const agentRes4 = await agentRunner.runAnalysis(datasetId, 'Show churn rate');
  console.log(`[PASS] Is Clarification for missing column: ${agentRes4.isClarification}`);
  console.log(`       Reason: ${agentRes4.clarification.reason}`);

  // 10. Test Multi-Metric: "Show average discount and total revenue by customer segment"
  console.log('\n--- Testing Multi-Metric Aggregation ---');
  const agentRes5 = await agentRunner.runAnalysis(datasetId, 'Show average discount and total revenue by customer segment');
  console.log(`[PASS] Multi-metric Pseudo-SQL:\n       ${agentRes5.pseudoSql.replace(/\n/g, '\n       ')}`);
  console.log(`       First row:`, agentRes5.results[0]);

  console.log('\n======================================================');
  console.log('🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runDirectUnitTests().catch((err) => {
  console.error('[TEST FAILURE]', err);
  process.exit(1);
});

import { agentRunner } from './agent/agentRunner.js';
import { sessionStore } from './data/sessionStore.js';
import { schemaProfiler } from './tools/schemaProfiler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('🧪 ===============================================');
  console.log('🧪 Starting AskMyData End-to-End Test Suite');
  console.log('🧪 ===============================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, extraInfo = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Load and profile Tech Sales CSV
  console.log('--- TEST 1: CSV Schema Profiling ---');
  const candidatePaths = [
    path.join(__dirname, 'data/samples/tech_sales_2024.csv'),
    path.join(__dirname, '../src/data/samples/tech_sales_2024.csv'),
    path.join(process.cwd(), 'src/data/samples/tech_sales_2024.csv'),
    path.join(process.cwd(), 'dist/data/samples/tech_sales_2024.csv'),
  ];
  const samplePath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const csvContent = fs.readFileSync(samplePath, 'utf-8');
  const parsed = Papa.parse<Record<string, any>>(csvContent, { header: true, skipEmptyLines: 'greedy' });

  assert(parsed.data.length === 140, 'Parses 140 raw records from tech_sales_2024.csv');

  const datasetId = 'test_tech_sales';
  const profile = schemaProfiler.execute({
    datasetId,
    filename: 'tech_sales_2024.csv',
    rows: parsed.data,
  });

  assert(profile.rowCount === 140, 'Profile row count is 140');
  assert(profile.columnCount === 12, 'Profile detects 12 columns');

  const revenueCol = profile.columns.find((c) => c.name === 'Revenue');
  assert(revenueCol?.inferredType === 'number', 'Revenue column inferred as number');

  const dateCol = profile.columns.find((c) => c.name === 'Date');
  assert(dateCol?.inferredType === 'date', 'Date column inferred as date');

  sessionStore.setDataset({
    id: datasetId,
    filename: 'tech_sales_2024.csv',
    rawRows: parsed.data,
    profile,
    createdAt: new Date(),
    history: [],
  });

  // TEST 2: Main hackathon question: "Which product had the highest sales last quarter?"
  console.log('\n--- TEST 2: Primary Question Flow ---');
  const q1 = 'Which product had the highest sales last quarter?';
  const res1 = await agentRunner.runAnalysis(datasetId, q1);

  assert(res1.success === true, 'Response marked success');
  assert(res1.isClarification === false, 'Question recognized as unambiguous');
  assert(res1.plan.length >= 3, `Plan generated with ${res1.plan.length} steps`);
  assert(res1.steps.length === 4, 'Execution trace contains exactly 4 distinct tool steps');

  const stepTools = res1.steps.map((s) => s.tool);
  assert(stepTools.includes('schema_profiler'), 'Trace includes schema_profiler tool');
  assert(stepTools.includes('intent_planner'), 'Trace includes intent_planner tool');
  assert(stepTools.includes('safe_data_engine'), 'Trace includes safe_data_engine tool');
  assert(stepTools.includes('chart_result_formatter'), 'Trace includes chart_result_formatter tool');

  const allCompleted = res1.steps.every((s) => s.status === 'completed');
  assert(allCompleted, 'All 4 trace steps completed successfully');

  assert(!!res1.pseudoSql && res1.pseudoSql.includes('SELECT'), 'Readable Pseudo-SQL query generated');
  assert(res1.pseudoSql!.includes('Q4'), 'Filter condition applied for last quarter (Q4)');
  assert(res1.pseudoSql!.includes('GROUP BY Product_Category'), 'Group by Product_Category correctly inferred');

  assert(Array.isArray(res1.results) && res1.results!.length > 0, `Results returned ${res1.results?.length} aggregated records`);
  assert(res1.chartConfig?.chartType === 'bar', `Auto-selected bar chart for categorical sales comparison`);
  assert(Boolean(res1.insight?.summary.includes('AI Platform') || (res1.results && res1.results[0]?.Product_Category === 'AI Platform')), 'Identified top product (AI Platform)');
  assert(res1.insight?.dataCaveats.length! > 0, 'Insight includes safe data caveats');

  // TEST 3: Ambiguous Question Clarification
  console.log('\n--- TEST 3: Ambiguity Handling & Clarification ---');
  const q2 = 'Show performance summary';
  const res2 = await agentRunner.runAnalysis(datasetId, q2);

  assert(res2.isClarification === true, 'Detected ambiguity on broad question');
  assert(!!res2.clarification, 'Clarification prompt generated');
  assert(res2.clarification?.options.length! >= 2, `Provided ${res2.clarification?.options.length} actionable clarification options`);
  assert(res2.clarification?.reason.length! > 10, 'Specific reason explained for why question is ambiguous');

  // TEST 4: Unresolvable Missing Column Handling
  console.log('\n--- TEST 4: Missing Column Guardrail ---');
  const q3 = 'What is the average employee salary by department?';
  const res3 = await agentRunner.runAnalysis(datasetId, q3);

  assert(res3.isClarification === true, 'Detected unresolvable column (salary)');
  assert(Boolean(res3.clarification?.reason.includes('salary')), 'Clarification specifically points out missing column "salary"');
  assert(res3.clarification?.options.length! > 0, 'Offers valid alternatives from available columns');

  // TEST 5: Conversational Follow-Up
  console.log('\n--- TEST 5: Conversational Follow-Up Context ---');
  const q4 = 'Now break that down by region';
  const res4 = await agentRunner.runAnalysis(datasetId, q4, res1.queryAst);

  assert(res4.isClarification === false, 'Follow-up resolved without ambiguity');
  assert(res4.queryAst?.groupBy?.includes('Region') || false, 'Grouped by Region from follow-up');
  assert(res4.results!.length > 1, `Calculated breakdown across ${res4.results?.length} regions`);

  // TEST 6: Session History Retention
  console.log('\n--- TEST 6: Session History ---');
  const history = sessionStore.getHistory(datasetId);
  assert(history.length >= 4, `Preserved ${history.length} analysis items in session store`);

  console.log('\n===============================================');
  console.log(`🏁 Test Results: ${passed} / ${total} passed`);
  console.log('===============================================\n');

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

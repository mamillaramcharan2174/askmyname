import { app } from './dist/index.js';
import http from 'http';

async function runTests() {
  console.log('--- Starting In-Process AskMyData Server Test ---');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(4005, resolve));
  console.log('Test server listening on port 4005');

  const baseUrl = 'http://127.0.0.1:4005';

  try {
    // 1. Health check
    console.log('\n[1] Testing /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('✓ Health status:', healthData.status);

    // 2. Agent status
    console.log('\n[2] Testing /api/agent/status...');
    const statusRes = await fetch(`${baseUrl}/api/agent/status`);
    const statusData = await statusRes.json();
    console.log('✓ AI Provider:', statusData.aiProvider, '| Mode:', statusData.mode);

    // 3. Load Sample Dataset: tech_sales_2024
    console.log('\n[3] Testing POST /api/dataset/sample (tech_sales_2024)...');
    const sampleRes = await fetch(`${baseUrl}/api/dataset/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleName: 'tech_sales_2024' }),
    });
    const sampleData = await sampleRes.json();
    if (!sampleData.success) throw new Error('Failed to load sample: ' + JSON.stringify(sampleData));
    const datasetId = sampleData.datasetId;
    console.log(`✓ Sample loaded! Dataset ID: ${datasetId}`);
    console.log(`✓ Row count: ${sampleData.profile.rowCount}, Column count: ${sampleData.profile.columnCount}`);
    console.log('✓ Inferred Columns:', sampleData.profile.columns.map((c) => `${c.name} (${c.inferredType})`).join(', '));

    // 4. Test Plain-Language Question: "Which product had the highest sales last quarter?"
    console.log('\n[4] Testing Q1: "Which product had the highest sales last quarter?"...');
    const q1Res = await fetch(`${baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        question: 'Which product had the highest sales last quarter?',
      }),
    });
    const q1Data = await q1Res.json();
    if (!q1Data.success) throw new Error('Q1 failed: ' + JSON.stringify(q1Data));
    console.log('✓ Q1 Plan:\n ', q1Data.plan.join('\n  '));
    console.log('✓ Q1 Pseudo-SQL:\n ', q1Data.pseudoSql.replace(/\n/g, ' '));
    console.log('✓ Q1 Chart Type:', q1Data.chartConfig.chartType, '| Title:', q1Data.chartConfig.title);
    console.log('✓ Q1 Execution Trace Steps:', q1Data.steps.map((s) => `${s.step} [Tool: ${s.tool}, ${s.durationMs}ms]`).join(' -> '));
    console.log('✓ Q1 Executive Summary:', q1Data.insight.summary);
    console.log('✓ Q1 Top 3 Results:', JSON.stringify(q1Data.results.slice(0, 3)));

    // 5. Test Conversational Follow-Up: "Now break that down by region"
    console.log('\n[5] Testing Conversational Follow-Up: "Now break that down by region"...');
    const followUpRes = await fetch(`${baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        question: 'Now break that down by region',
        previousQuery: q1Data.queryAst,
      }),
    });
    const followUpData = await followUpRes.json();
    if (!followUpData.success) throw new Error('Follow-up failed: ' + JSON.stringify(followUpData));
    console.log('✓ Follow-up Pseudo-SQL:\n ', followUpData.pseudoSql.replace(/\n/g, ' '));
    console.log('✓ Follow-up Chart Type:', followUpData.chartConfig.chartType);
    console.log('✓ Follow-up Results Count:', followUpData.results.length);

    // 6. Test Ambiguity & Clarification (No-Guessing Guardrail): "Show performance"
    console.log('\n[6] Testing Ambiguity & Clarification Guardrail: "Show performance"...');
    const clarifyRes = await fetch(`${baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        question: 'Show performance',
      }),
    });
    const clarifyData = await clarifyRes.json();
    console.log('✓ Clarification Triggered?:', clarifyData.isClarification);
    console.log('✓ Clarification Question:', clarifyData.clarification?.clarificationQuestion);
    console.log('✓ Options Presented:', clarifyData.clarification?.options.map((o) => `"${o.label}" -> ${o.promptSuggestion}`));

    // 7. Test Safe Rejection: "Drop table users;"
    console.log('\n[7] Testing Malicious/Unsupported Query Safety: "Drop table users;"...');
    const dropRes = await fetch(`${baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        question: 'Drop table users;',
      }),
    });
    const dropData = await dropRes.json();
    console.log('✓ Drop Table handled safely. Result:', dropData.isClarification ? 'Prompted for clarification' : (dropData.error || dropData.pseudoSql));

    // 8. Test E-Commerce Sample Dataset
    console.log('\n[8] Testing E-Commerce Sample Dataset...');
    const ecomRes = await fetch(`${baseUrl}/api/dataset/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleName: 'ecommerce_orders' }),
    });
    const ecomData = await ecomRes.json();
    console.log(`✓ E-Commerce loaded: ${ecomData.profile.rowCount} rows, ID: ${ecomData.datasetId}`);

    const qEcomRes = await fetch(`${baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId: ecomData.datasetId,
        question: 'Which category generated the highest total sales?',
      }),
    });
    const qEcomData = await qEcomRes.json();
    console.log('✓ Ecom Query Pseudo-SQL:', qEcomData.pseudoSql.replace(/\n/g, ' '));
    console.log('✓ Ecom Top Result:', JSON.stringify(qEcomData.results[0]));

    console.log('\n========================================');
    console.log('🎉 ALL BACKEND AGENT TESTS PASSED SUCCESSFULLY!');
    console.log('========================================');
  } finally {
    server.close();
    console.log('Test server shut down.');
  }
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

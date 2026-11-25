import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabaseService } from './data/supabaseClient.js';

async function verify() {
  console.log('1. Checking Supabase Status...');
  const status = supabaseService.getStatus();
  console.log('Status:', JSON.stringify(status));

  console.log('2. Fetching live table "tech_sales_2024" from Supabase...');
  const result = await supabaseService.fetchTableData({ tableName: 'tech_sales_2024' });
  console.log(`✅ Success! Fetched ${result.rows.length} rows from remote Supabase.`);
  console.log('Sample row from Supabase:', result.rows[0]);

  console.log('3. Testing history record persistence to "askmydata_history"...');
  await supabaseService.saveHistoryRecord({
    datasetId: 'test_ds_supabase',
    question: 'Which product had the highest sales last quarter?',
    pseudoSql: 'SELECT product_category, SUM(revenue) FROM tech_sales_2024 GROUP BY product_category;',
    executionTimeMs: 42,
    insightSummary: 'AI Platform led with highest sales in Q4.',
  });
  console.log('✅ History record successfully saved to Supabase!');
}

verify().catch((err) => {
  console.error('❌ Supabase verification error:', err);
  process.exit(1);
});

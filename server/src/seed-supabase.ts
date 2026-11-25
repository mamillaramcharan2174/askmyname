import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const csvPath = path.resolve(__dirname, '../../sample_datasets/tech_sales_2024.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

  const rows = parsed.data.map((r: any) => ({
    order_id: r.Order_ID,
    date: r.Date,
    quarter: r.Quarter,
    region: r.Region,
    customer_segment: r.Customer_Segment,
    product_category: r.Product_Category,
    units_sold: parseInt(r.Units_Sold, 10),
    unit_price: parseFloat(r.Unit_Price),
    revenue: parseFloat(r.Revenue),
    discount_pct: parseFloat(r.Discount_Pct),
    cost: parseFloat(r.Cost),
    customer_satisfaction: parseFloat(r.Customer_Satisfaction),
  }));

  console.log(`Parsed ${rows.length} rows. Inserting into tech_sales_2024...`);
  const { data, error } = await supabase.from('tech_sales_2024').upsert(rows, { onConflict: 'order_id' });

  if (error) {
    console.error('Insert error:', error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${rows.length} records into Supabase table "tech_sales_2024"!`);
}

seed().catch(console.error);

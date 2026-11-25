import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { schemaProfiler } from '../tools/schemaProfiler.js';
import { sessionStore } from '../data/sessionStore.js';
import { supabaseService } from '../data/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file limit
});

export const datasetRouter = Router();

// Upload user CSV file
datasetRouter.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No CSV file was uploaded. Please provide a valid .csv file.' });
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const parseResult = Papa.parse<Record<string, any>>(csvContent, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // preserve original types for strict schema profiling
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      res.status(400).json({
        error: `Failed to parse CSV file: ${parseResult.errors.map((e) => e.message).join(', ')}`,
      });
      return;
    }

    if (parseResult.data.length === 0) {
      res.status(400).json({ error: 'The uploaded CSV file contains no data rows.' });
      return;
    }

    // Limit maximum rows for security and memory
    const rows = parseResult.data.slice(0, 50000);
    const datasetId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const filename = req.file.originalname || 'uploaded_dataset.csv';

    const profile = schemaProfiler.execute({
      datasetId,
      filename,
      rows,
    });

    sessionStore.setDataset({
      id: datasetId,
      filename,
      rawRows: rows,
      profile,
      createdAt: new Date(),
      history: [],
    });

    res.json({
      success: true,
      datasetId,
      profile,
    });
  } catch (err: any) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: err.message || 'An unexpected error occurred while processing the CSV upload.' });
  }
});

// Load one of the bundled demo datasets
datasetRouter.post('/sample', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sampleName = 'tech_sales_2024' } = req.body;

    const allowedSamples: Record<string, string> = {
      tech_sales_2024: 'tech_sales_2024.csv',
      ecommerce_orders: 'ecommerce_orders.csv',
    };

    const targetFilename = allowedSamples[sampleName] || 'tech_sales_2024.csv';
    const candidatePaths = [
      path.join(__dirname, '../data/samples', targetFilename),
      path.join(process.cwd(), 'src/data/samples', targetFilename),
      path.join(process.cwd(), 'dist/data/samples', targetFilename),
      path.join(process.cwd(), '../sample_datasets', targetFilename),
      path.join(process.cwd(), 'sample_datasets', targetFilename),
    ];

    const targetPath = candidatePaths.find((p) => fs.existsSync(p));
    if (!targetPath) {
      res.status(404).json({ error: `Sample dataset "${targetFilename}" not found on server.` });
      return;
    }

    const csvContent = fs.readFileSync(targetPath, 'utf-8');
    const parseResult = Papa.parse<Record<string, any>>(csvContent, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    const rows = parseResult.data;
    const datasetId = `sample_${sampleName}_${Date.now()}`;

    const profile = schemaProfiler.execute({
      datasetId,
      filename: targetFilename,
      rows,
    });

    sessionStore.setDataset({
      id: datasetId,
      filename: targetFilename,
      rawRows: rows,
      profile,
      createdAt: new Date(),
      history: [],
    });

    res.json({
      success: true,
      datasetId,
      profile,
    });
  } catch (err: any) {
    console.error('[Sample Load Error]', err);
    res.status(500).json({ error: err.message || 'Failed to load sample dataset.' });
  }
});

// Load live data from a Supabase table (safe read-only)
datasetRouter.post('/supabase', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableName, supabaseUrl, supabaseKey } = req.body;

    if (!tableName || String(tableName).trim() === '') {
      res.status(400).json({ error: 'Please specify the Supabase table name to import.' });
      return;
    }

    const cleanTableName = String(tableName).trim();
    const { rows, rowCount } = await supabaseService.fetchTableData({
      tableName: cleanTableName,
      url: supabaseUrl?.trim() || undefined,
      key: supabaseKey?.trim() || undefined,
      limit: 25000,
    });

    const datasetId = `supabase_${cleanTableName}_${Date.now()}`;
    const filename = `supabase:${cleanTableName}`;

    const profile = schemaProfiler.execute({
      datasetId,
      filename,
      rows,
    });

    sessionStore.setDataset({
      id: datasetId,
      filename,
      rawRows: rows,
      profile,
      createdAt: new Date(),
      history: [],
    });

    res.json({
      success: true,
      datasetId,
      profile,
      importedRows: rows.length,
      totalTableRows: rowCount,
    });
  } catch (err: any) {
    console.error('[Supabase Import Error]', err);
    res.status(400).json({ error: err.message || 'Failed to import table from Supabase.' });
  }
});

// Check Supabase default configuration status
datasetRouter.get('/supabase/status', (req: Request, res: Response): void => {
  res.json(supabaseService.getStatus());
});

// Retrieve dataset profile & preview rows
datasetRouter.get('/:id', (req: Request, res: Response): void => {
  const datasetId = String(req.params.id);
  const session = sessionStore.getDataset(datasetId);
  if (!session) {
    res.status(404).json({ error: 'Dataset not found.' });
    return;
  }
  res.json({
    datasetId: session.id,
    profile: session.profile,
  });
});

// Retrieve dataset conversation & query history
datasetRouter.get('/:id/history', (req: Request, res: Response): void => {
  const datasetId = String(req.params.id);
  const history = sessionStore.getHistory(datasetId);
  res.json({ history });
});

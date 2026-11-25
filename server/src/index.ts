import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { datasetRouter } from './routes/datasetRoutes.js';
import { agentRouter } from './routes/agentRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AskMyData Server',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use('/api/dataset', datasetRouter);
app.use('/api/agent', agentRouter);

// Serve client static production build if available
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];
const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[AskMyData Server] Serving static web client from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Server Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred.',
  });
});

export { app };

const isDirectRun = process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts');
if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`🚀 AskMyData Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Mode: ${process.env.GEMINI_API_KEY ? 'Gemini AI Integration' : 'Autonomous Local Demo Mode'}`);
  });
}

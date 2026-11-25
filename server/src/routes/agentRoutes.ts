import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { agentRunner } from '../agent/agentRunner.js';
import { AnalysisQuerySchema } from '../schema/queryAst.js';

export const agentRouter = Router();

const QueryRequestSchema = z.object({
  datasetId: z.string().min(1, 'datasetId is required'),
  question: z.string().min(1, 'Question cannot be empty'),
  previousQuery: AnalysisQuerySchema.optional(),
});

// Run plain-language analytics query
agentRouter.post('/query', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = QueryRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request payload',
        details: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }

    const { datasetId, question, previousQuery } = parseResult.data;

    const analysisResponse = await agentRunner.runAnalysis(datasetId, question, previousQuery);

    res.json(analysisResponse);
  } catch (err: any) {
    console.error('[Agent Query Error]', err);
    res.status(400).json({
      success: false,
      error: err.message || 'An error occurred during query execution',
    });
  }
});

// Get agent service status and runtime mode
agentRouter.get('/status', (req: Request, res: Response): void => {
  const hasGemini = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: 'online',
    aiProvider: hasGemini ? 'Google Gemini API' : 'Built-in Local Heuristic Agent',
    mode: hasGemini ? 'live-llm' : 'demo-deterministic',
    supportedFeatures: [
      'Plain-language CSV Q&A',
      'Step-by-step Execution Tracing',
      'Safe Allowlisted Read-Only AST Engine',
      'Ambiguity & Clarification Prompts',
      'Auto-selected Charts (Bar, Line, Area, Pie, Table)',
      'Conversational Follow-ups',
    ],
  });
});

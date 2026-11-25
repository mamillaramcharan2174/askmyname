import { GoogleGenerativeAI } from '@google/generative-ai';
import { DatasetProfile } from '../schema/dataset.js';
import { AnalysisQuery, AnalysisQuerySchema } from '../schema/queryAst.js';
import { InterpretationResult, heuristicAgent } from './heuristicAgent.js';
import { ClarificationPromptSchema } from '../schema/agent.js';

export class AiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log(`[AskMyData AI] Google Gemini configured with model: ${this.modelName}`);
    } else {
      console.log('[AskMyData AI] No Gemini API key detected. Using built-in local heuristic agent.');
    }
  }

  async planQuery(
    question: string,
    profile: DatasetProfile,
    previousQuery?: AnalysisQuery,
    conversationHistory?: Array<{ question: string; answerSummary: string }>
  ): Promise<InterpretationResult> {
    // If no API key, use reliable local heuristic agent immediately
    if (!this.genAI) {
      return heuristicAgent.interpret(question, profile, previousQuery);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      // Prepare metadata without leaking full rows
      const columnSummaries = profile.columns.map((c) => ({
        name: c.name,
        type: c.inferredType,
        nullable: c.nullable,
        sampleValues: c.sampleValues.slice(0, 4),
      }));

      const systemPrompt = `You are the core planner for AskMyData, a safe analytics agent.
The user is asking a plain-language question about a dataset.
Your job is to translate the question into a SAFE, structured AST query or, if the question is ambiguous or asks for missing columns, ask a clear clarification question.

CRITICAL RULES:
1. NEVER output raw SQL, code, Python, JavaScript, or shell commands.
2. Only reference columns present in the schema: ${JSON.stringify(columnSummaries)}
3. Operators allowed: '=', '!=', '>', '<', '>=', '<=', 'contains', 'starts_with', 'in', 'is_null', 'not_null'.
4. Aggregations allowed: 'count', 'sum', 'avg', 'min', 'max'. 'sum' and 'avg' ONLY on numeric columns.
5. If the question cannot be answered unambiguously from the schema (e.g. general "show performance", or mentions columns not in the dataset), set isAmbiguous: true and provide a specific clarificationQuestion with 2-3 clickable options.
6. If previous context exists, support follow-up questions (e.g. "now by region", "filter to only Q4").
7. Output strictly valid JSON conforming to this format:
{
  "isAmbiguous": false,
  "plan": ["step 1...", "step 2..."],
  "queryAst": {
    "filters": [{"column": "string", "operator": "=", "value": "val"}],
    "groupBy": ["column_name"],
    "aggregates": [{"column": "col", "func": "sum", "alias": "alias_name"}],
    "sort": {"column": "alias_name", "direction": "desc"},
    "limit": 50
  },
  "reasoning": "brief explanation"
}
OR if ambiguous:
{
  "isAmbiguous": true,
  "clarification": {
    "isAmbiguous": true,
    "reason": "why it is ambiguous",
    "clarificationQuestion": "clarifying question to user",
    "options": [
      {"label": "Option 1", "promptSuggestion": "suggested prompt"},
      {"label": "Option 2", "promptSuggestion": "suggested prompt"}
    ]
  },
  "plan": ["step 1...", "step 2..."],
  "reasoning": "why clarification is required"
}`;

      const userContent = JSON.stringify({
        question,
        previousQuery: previousQuery ?? null,
        conversationHistory: conversationHistory ?? [],
      });

      const response = await model.generateContent([
        { text: systemPrompt },
        { text: `User Question: ${userContent}` },
      ]);

      const text = response.response.text();
      const parsed = JSON.parse(text);

      if (parsed.isAmbiguous) {
        ClarificationPromptSchema.parse(parsed.clarification);
        return {
          isAmbiguous: true,
          clarification: parsed.clarification,
          plan: parsed.plan || ['Detect ambiguity', 'Request clarification'],
          reasoning: parsed.reasoning || 'Clarification required',
        };
      }

      // Validate AST
      const validatedAst = AnalysisQuerySchema.parse(parsed.queryAst);
      return {
        isAmbiguous: false,
        plan: parsed.plan || ['Analyze query', 'Execute safe aggregation', 'Format result'],
        queryAst: validatedAst,
        reasoning: parsed.reasoning || 'Generated structured AST query',
      };
    } catch (err: any) {
      console.warn('[AskMyData AI] Gemini API call or validation failed, gracefully falling back to heuristic engine:', err.message);
      return heuristicAgent.interpret(question, profile, previousQuery);
    }
  }
}

export const aiService = new AiService();

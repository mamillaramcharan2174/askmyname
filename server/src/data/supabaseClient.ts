import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export interface SupabaseConfig {
  url?: string;
  key?: string;
}

export class SupabaseService {
  private defaultClient: SupabaseClient | null = null;
  private defaultUrl: string | undefined;

  constructor() {
    this.defaultUrl = process.env.SUPABASE_URL;
    const defaultKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (this.defaultUrl && defaultKey && !this.defaultUrl.includes('your-project')) {
      try {
        this.defaultClient = createClient(this.defaultUrl, defaultKey);
        console.log(`[AskMyData Supabase] Connected to default Supabase instance at ${this.defaultUrl}`);
      } catch (err: any) {
        console.warn('[AskMyData Supabase] Error initializing default Supabase client:', err.message);
      }
    }
  }

  getStatus(): { isConfigured: boolean; url?: string } {
    return {
      isConfigured: !!this.defaultClient,
      url: this.defaultUrl ? this.defaultUrl.replace(/https?:\/\//, '').split('.')[0] : undefined,
    };
  }

  getClient(config?: SupabaseConfig): SupabaseClient {
    if (config?.url && config?.key) {
      return createClient(config.url, config.key);
    }
    if (this.defaultClient) {
      return this.defaultClient;
    }
    throw new Error(
      'Supabase is not configured. Please provide your Supabase Project URL and API Key, or configure SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.'
    );
  }

  async fetchTableData(params: {
    tableName: string;
    url?: string;
    key?: string;
    limit?: number;
  }): Promise<{ rows: Record<string, any>[]; tableName: string; rowCount: number }> {
    const { tableName, url, key, limit = 10000 } = params;

    if (!tableName || tableName.trim() === '') {
      throw new Error('Table name is required to connect to Supabase.');
    }

    const client = this.getClient({ url, key });

    // Fetch rows from Supabase table read-only
    const { data, error, count } = await client
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase query failed on table "${tableName}": ${error.message} (code: ${error.code})`);
    }

    if (!data || data.length === 0) {
      throw new Error(`Supabase table "${tableName}" exists but contains 0 records.`);
    }

    return {
      rows: data,
      tableName,
      rowCount: count ?? data.length,
    };
  }

  async saveHistoryRecord(params: {
    datasetId: string;
    question: string;
    pseudoSql?: string;
    executionTimeMs: number;
    insightSummary?: string;
  }): Promise<void> {
    if (!this.defaultClient) return;

    try {
      // Best-effort optional persistence to askmydata_history if the table exists
      await this.defaultClient.from('askmydata_history').insert({
        dataset_id: params.datasetId,
        question: params.question,
        pseudo_sql: params.pseudoSql,
        execution_time_ms: params.executionTimeMs,
        insight_summary: params.insightSummary,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Gracefully ignore if table askmydata_history doesn't exist
    }
  }
}

export const supabaseService = new SupabaseService();

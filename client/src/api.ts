import { DatasetProfile, AgentAnalysisResponse, AgentStatus, HistoryItem, AnalysisQuery } from './types/index.js';

const API_BASE = '/api';

export async function checkAgentStatus(): Promise<AgentStatus> {
  const res = await fetch(`${API_BASE}/agent/status`);
  if (!res.ok) throw new Error('Failed to fetch agent status');
  return res.json();
}

export async function uploadDataset(file: File): Promise<{ success: boolean; datasetId: string; profile: DatasetProfile }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/dataset/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload CSV file');
  }
  return data;
}

export async function loadSampleDataset(sampleName: 'tech_sales_2024' | 'ecommerce_orders'): Promise<{
  success: boolean;
  datasetId: string;
  profile: DatasetProfile;
}> {
  const res = await fetch(`${API_BASE}/dataset/sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sampleName }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load sample dataset');
  }
  return data;
}

export async function importFromSupabase(params: {
  tableName: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}): Promise<{
  success: boolean;
  datasetId: string;
  profile: DatasetProfile;
  importedRows: number;
  totalTableRows: number;
}> {
  const res = await fetch(`${API_BASE}/dataset/supabase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to import table from Supabase');
  }
  return data;
}

export async function checkSupabaseStatus(): Promise<{ isConfigured: boolean; url?: string }> {
  try {
    const res = await fetch(`${API_BASE}/dataset/supabase/status`);
    if (!res.ok) return { isConfigured: false };
    return res.json();
  } catch {
    return { isConfigured: false };
  }
}

export async function getDatasetProfile(datasetId: string): Promise<{ datasetId: string; profile: DatasetProfile }> {
  const res = await fetch(`${API_BASE}/dataset/${datasetId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch dataset');
  }
  return data;
}

export async function getDatasetHistory(datasetId: string): Promise<{ history: HistoryItem[] }> {
  const res = await fetch(`${API_BASE}/dataset/${datasetId}/history`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch dataset history');
  }
  return data;
}

export async function askAgent(
  datasetId: string,
  question: string,
  previousQuery?: AnalysisQuery
): Promise<AgentAnalysisResponse> {
  const res = await fetch(`${API_BASE}/agent/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      datasetId,
      question,
      previousQuery,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Agent query request failed');
  }
  return data;
}

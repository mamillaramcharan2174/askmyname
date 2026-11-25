import { DatasetProfile } from '../schema/dataset.js';
import { AgentAnalysisResponse } from '../schema/agent.js';

export interface DatasetSession {
  id: string;
  filename: string;
  rawRows: Record<string, any>[];
  profile: DatasetProfile;
  createdAt: Date;
  history: Array<{
    id: string;
    question: string;
    response: AgentAnalysisResponse;
    timestamp: Date;
  }>;
}

class SessionStore {
  private datasets: Map<string, DatasetSession> = new Map();

  setDataset(session: DatasetSession): void {
    this.datasets.set(session.id, session);
  }

  getDataset(id: string): DatasetSession | undefined {
    return this.datasets.get(id);
  }

  hasDataset(id: string): boolean {
    return this.datasets.has(id);
  }

  addHistory(datasetId: string, question: string, response: AgentAnalysisResponse): void {
    const session = this.datasets.get(datasetId);
    if (!session) return;
    session.history.unshift({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      question,
      response,
      timestamp: new Date(),
    });
    // Keep last 30 history items
    if (session.history.length > 30) {
      session.history = session.history.slice(0, 30);
    }
  }

  getHistory(datasetId: string) {
    const session = this.datasets.get(datasetId);
    return session ? session.history : [];
  }

  listDatasets(): Array<{ id: string; filename: string; rowCount: number; columnCount: number; createdAt: Date }> {
    return Array.from(this.datasets.values()).map((d) => ({
      id: d.id,
      filename: d.filename,
      rowCount: d.rawRows.length,
      columnCount: d.profile.columns.length,
      createdAt: d.createdAt,
    }));
  }
}

export const sessionStore = new SessionStore();

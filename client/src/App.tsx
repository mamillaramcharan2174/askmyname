import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { DatasetUpload } from './components/DatasetUpload.js';
import { DatasetProfileView } from './components/DatasetProfileView.js';
import { QuestionBar } from './components/QuestionBar.js';
import { ClarificationCard } from './components/ClarificationCard.js';
import { ExecutionTrace } from './components/ExecutionTrace.js';
import { QueryPanel } from './components/QueryPanel.js';
import { VisualResult } from './components/VisualResult.js';
import { InsightCard } from './components/InsightCard.js';
import { HistoryDrawer } from './components/HistoryDrawer.js';
import { AuthModal } from './components/AuthModal.js';
import { DatasetProfile, AgentAnalysisResponse, AgentStatus, HistoryItem, AuthUser } from './types/index.js';
import { checkAgentStatus, askAgent, getDatasetHistory } from './api.js';

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('askmydata_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetProfile | null>(null);
  const [datasetRows, setDatasetRows] = useState<Record<string, any>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);
  const [analysisResponse, setAnalysisResponse] = useState<AgentAnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load backend status on mount
  useEffect(() => {
    checkAgentStatus()
      .then(setStatus)
      .catch((err) => console.warn('Could not connect to backend health check:', err));
  }, []);

  const handleDatasetLoaded = (profile: DatasetProfile, newDatasetId: string, rows?: Record<string, any>[]) => {
    setDataset(profile);
    setDatasetId(newDatasetId);
    setDatasetRows(rows || profile.previewRows || null);
    setAnalysisResponse(null);
    setHistory([]);
    setErrorMessage(null);
  };

  const handleResetDataset = () => {
    setDataset(null);
    setDatasetId(null);
    setDatasetRows(null);
    setAnalysisResponse(null);
    setHistory([]);
    setErrorMessage(null);
  };

  const handleAskQuestion = async (question: string) => {
    if (!datasetId) return;

    try {
      setIsQueryLoading(true);
      setErrorMessage(null);

      const previousQuery = analysisResponse?.queryAst;
      const res = await askAgent(
        datasetId,
        question,
        previousQuery,
        datasetRows || undefined,
        dataset || undefined
      );
      setAnalysisResponse(res);

      // Refresh history safely without failing the answer
      try {
        const histRes = await getDatasetHistory(datasetId);
        setHistory(histRes.history);
      } catch (histErr) {
        console.warn('History fetch notice:', histErr);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while answering your question.');
    } finally {
      setIsQueryLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setAnalysisResponse(item.response);
  };

  const handleAuthSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setIsAuthOpen(false);
    try {
      localStorage.setItem('askmydata_user', JSON.stringify(authenticatedUser));
    } catch {
      // ignore
    }
  };

  const handleSignOut = () => {
    setUser(null);
    try {
      localStorage.removeItem('askmydata_user');
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Navigation */}
      <Navbar
        status={status}
        dataset={dataset}
        onResetDataset={handleResetDataset}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Auth Modal (Username / Password / Forgot Password / Sign Up) */}
      <AuthModal
        isOpen={!user || isAuthOpen}
        onClose={user ? () => setIsAuthOpen(false) : undefined}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!dataset ? (
          /* Step 1: Upload or Choose Sample Dataset */
          <DatasetUpload
            onDatasetLoaded={handleDatasetLoaded}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          /* Step 2: Interactive Analysis Dashboard */
          <div>
            {/* Dataset Preview & Schema Profiler (Collapsible) */}
            <DatasetProfileView profile={dataset} />

            {/* Error Message Toast if any */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs sm:text-sm">
                <span className="font-bold">Error:</span> {errorMessage}
              </div>
            )}

            {/* Plain-Language Question Bar */}
            <QuestionBar
              onAsk={handleAskQuestion}
              isLoading={isQueryLoading}
              dataset={dataset}
              suggestedFollowUps={analysisResponse?.suggestedFollowUps}
            />

            {/* Clarification Alert Card (if agent detected ambiguity or missing columns) */}
            {analysisResponse?.isClarification && analysisResponse.clarification && (
              <ClarificationCard
                clarification={analysisResponse.clarification}
                onSelectOption={handleAskQuestion}
              />
            )}

            {/* When Analysis is Completed */}
            {analysisResponse && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. Executive Insight & Findings */}
                {analysisResponse.insight && (
                  <InsightCard insight={analysisResponse.insight} />
                )}

                {/* 2. Visualization (Chart & Table) */}
                {!analysisResponse.isClarification && (
                  <VisualResult
                    chartConfig={analysisResponse.chartConfig}
                    results={analysisResponse.results}
                    totalMatchedRows={analysisResponse.totalMatchedRows}
                    outputRowsCount={analysisResponse.outputRowsCount}
                  />
                )}

                {/* 3. Validated Safe Query Panel */}
                <QueryPanel
                  pseudoSql={analysisResponse.pseudoSql}
                  queryAst={analysisResponse.queryAst}
                />

                {/* 4. Visible Execution Trace */}
                <ExecutionTrace
                  plan={analysisResponse.plan}
                  steps={analysisResponse.steps}
                  executionTimeMs={analysisResponse.executionTimeMs}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Session History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        activeQuestion={analysisResponse?.question}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          AskMyData — AI Data & Analytics Agent • Theme 9 Hackathon Project • Safe Read-Only Analysis
        </p>
      </footer>
    </div>
  );
};

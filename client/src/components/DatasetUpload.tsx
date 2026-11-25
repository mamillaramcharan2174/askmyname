import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Shield, AlertCircle, ArrowRight, CheckCircle2, Lock, Database, Globe, Key, ExternalLink } from 'lucide-react';
import { DatasetProfile } from '../types/index.js';
import { uploadDataset, loadSampleDataset, importFromSupabase, checkSupabaseStatus } from '../api.js';

interface DatasetUploadProps {
  onDatasetLoaded?: (profile: DatasetProfile, datasetId: string, rows?: Record<string, any>[]) => void;
  onUploadFile?: (file: File) => void;
  onLoadSample?: (sampleName: string) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
  error?: string | null;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({
  onDatasetLoaded,
  onUploadFile,
  onLoadSample,
  isLoading = false,
  setIsLoading,
  error,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(error || null);
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [supabaseTable, setSupabaseTable] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseServerStatus, setSupabaseServerStatus] = useState<{ isConfigured: boolean; url?: string }>({ isConfigured: false });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    checkSupabaseStatus().then(setSupabaseServerStatus).catch(() => {});
  }, []);

  const handleSupabaseImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseTable.trim()) {
      setErrorMessage('Please enter the Supabase table name.');
      return;
    }

    try {
      if (setIsLoading) setIsLoading(true);
      setErrorMessage(null);
      const res = await importFromSupabase({
        tableName: supabaseTable.trim(),
        supabaseUrl: supabaseUrl.trim() || undefined,
        supabaseKey: supabaseKey.trim() || undefined,
      });
      if (onDatasetLoaded) onDatasetLoaded(res.profile, res.datasetId, res.rows);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to Supabase table.');
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please select a valid CSV file (.csv format only).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }

    if (onUploadFile) {
      onUploadFile(file);
      return;
    }

    try {
      if (setIsLoading) setIsLoading(true);
      setErrorMessage(null);
      const res = await uploadDataset(file);
      if (onDatasetLoaded) onDatasetLoaded(res.profile, res.datasetId, res.rows);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading dataset.');
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  const handleSampleClick = async (sampleName: 'tech_sales_2024' | 'ecommerce_orders') => {
    if (onLoadSample) {
      onLoadSample(sampleName);
      return;
    }

    try {
      if (setIsLoading) setIsLoading(true);
      setErrorMessage(null);
      const res = await loadSampleDataset(sampleName);
      if (onDatasetLoaded) onDatasetLoaded(res.profile, res.datasetId, res.rows);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading sample dataset.');
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Theme 9 — Data & Analytics Agents</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ask questions about your data <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">
            without writing a single line of SQL
          </span>
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Upload any CSV file or load our curated sample datasets. Ask questions in plain English, inspect the agent’s verified execution trace, and visualize instant answers with charts and tables.
        </p>
      </div>

      {(errorMessage || error) && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Upload Error: </span>
            {errorMessage || error}
          </div>
        </div>
      )}

      {/* Main Upload Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-sky-400 bg-sky-950/20 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold text-white mb-1">
          {isLoading ? 'Processing dataset...' : 'Drop your CSV file here, or browse'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Supports standard CSV formats up to 10MB. Files are profiled in-memory and never written to permanent disk.
        </p>

        <button
          type="button"
          disabled={isLoading}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/25 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Select CSV File</span>
        </button>
      </div>

      {/* Supabase Live Data Source Card */}
      <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-600/30 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base border border-emerald-500/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Connect Supabase Table</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Live Postgres Source
                </span>
                {supabaseServerStatus.isConfigured && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    .env Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Import any live Supabase table for safe, read-only plain-language analysis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSupabaseOpen(!supabaseOpen)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
          >
            {supabaseOpen ? 'Close' : 'Connect Table'}
          </button>
        </div>

        {supabaseOpen && (
          <form onSubmit={handleSupabaseImport} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Table Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. orders, sales, users"
                  value={supabaseTable}
                  onChange={(e) => setSupabaseTable(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Supabase Project URL {supabaseServerStatus.isConfigured ? '(Using .env default)' : '(Optional)'}
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Anon / Public API Key {supabaseServerStatus.isConfigured ? '(Using .env default)' : '(Optional)'}
                </label>
                <input
                  type="password"
                  placeholder="eyJh..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <span className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Read-Only SELECT query. Your remote database is never modified.</span>
              </span>

              <button
                type="submit"
                disabled={isLoading || !supabaseTable.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <span>Import & Profile Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sample Datasets */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Or get started instantly with sample data
          </span>
          <span className="text-xs text-sky-400">No setup required</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleSampleClick('tech_sales_2024')}
            className="group relative p-5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                    Global B2B Tech Sales (2024)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  140 orders across Cloud, AI Platforms & Cybersecurity with Quarters, Regions, Revenue, and Discounts.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">Product_Category</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">Quarter</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">Revenue</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>
          </div>

          <div
            onClick={() => handleSampleClick('ecommerce_orders')}
            className="group relative p-5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Retail E-Commerce Orders
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Multi-country
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  100 retail transactions covering Electronics, Office Supplies, Quantity, Profit, and Shipping.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">Category</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">Country</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">Sales</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="flex items-start space-x-2.5">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block">Strict Read-Only Safety</span>
            Zero raw SQL or eval execution. All queries run through a typed, allowlisted AST engine.
          </div>
        </div>
        <div className="flex items-start space-x-2.5">
          <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block">Privacy-First Architecture</span>
            Untrusted CSV rows stay in-memory; only column schemas and basic summaries are sent to AI planners.
          </div>
        </div>
        <div className="flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block">No Guessing / Clarifications</span>
            The agent never hallucinates. Ambiguous inquiries trigger interactive clarification prompts.
          </div>
        </div>
      </div>
    </div>
  );
};

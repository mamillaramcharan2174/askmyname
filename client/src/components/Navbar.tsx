import React from 'react';
import { Database, Sparkles, RefreshCw, ShieldCheck, Activity, BarChart3, BookOpen, History, Upload } from 'lucide-react';
import { DatasetProfile } from '../types/index.js';

interface NavbarProps {
  status?: { aiProvider: string; mode: string } | null;
  dataset?: DatasetProfile | null;
  profile?: DatasetProfile | null;
  onResetDataset?: () => void;
  onReset?: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
  onOpenDemoGuide?: () => void;
  onLoadSample?: (sampleName: string) => void;
  isLoading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  dataset,
  profile,
  onResetDataset,
  onReset,
  onOpenHistory,
  historyCount = 0,
  onOpenDemoGuide,
  onLoadSample,
  isLoading,
}) => {
  const activeDataset = dataset || profile;
  const handleReset = onReset || onResetDataset || (() => {});

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">AskMyData</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-950 text-sky-400 border border-sky-800/60">
                Theme 9
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI Data & Analytics Agent for Non-SQL Users</p>
          </div>
        </div>

        {/* Runtime Status & Actions */}
        <div className="flex items-center space-x-3">
          {/* AI Mode Badge */}
          {status && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">{status.aiProvider}</span>
            </div>
          )}

          {/* Active Dataset Pill */}
          {activeDataset && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                {activeDataset.filename}
              </span>
              <span className="text-slate-500 text-[11px]">
                ({activeDataset.rowCount.toLocaleString()} rows)
              </span>
            </div>
          )}

          {/* Quick sample switcher buttons if provided */}
          {onLoadSample && (
            <div className="hidden lg:flex items-center space-x-1.5">
              <button
                onClick={() => onLoadSample('tech_sales_2024')}
                disabled={isLoading}
                className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors flex items-center space-x-1"
                title="Load B2B Tech Sales sample dataset"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Tech Sales</span>
              </button>
              <button
                onClick={() => onLoadSample('ecommerce_orders')}
                disabled={isLoading}
                className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors flex items-center space-x-1"
                title="Load E-Commerce Orders sample dataset"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>E-Commerce</span>
              </button>
            </div>
          )}

          {/* Demo Guide */}
          {onOpenDemoGuide && (
            <button
              onClick={onOpenDemoGuide}
              className="text-xs px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/80 transition-colors flex items-center space-x-1.5 font-medium shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Demo Guide</span>
            </button>
          )}

          {/* History */}
          {onOpenHistory && historyCount > 0 && (
            <button
              onClick={onOpenHistory}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>History ({historyCount})</span>
            </button>
          )}

          {/* Reset / New CSV */}
          {activeDataset && (
            <button
              onClick={handleReset}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1"
              title="Upload new dataset"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New CSV</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

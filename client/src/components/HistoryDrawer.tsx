import React from 'react';
import { X, Clock, HelpCircle, ArrowRight, BarChart2 } from 'lucide-react';
import { HistoryItem } from '../types/index.js';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  activeQuestion?: string;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  activeQuestion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Session Analysis History</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No questions asked in this session yet.
            </div>
          ) : (
            history.map((item) => {
              const isActive = activeQuestion === item.question;
              const isClarification = item.response.isClarification;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-sky-950/40 border-sky-500 text-white'
                      : 'bg-slate-850/60 border-slate-800 text-slate-350 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                      "{item.question}"
                    </p>
                    {isClarification ? (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60 shrink-0">
                        Clarification
                      </span>
                    ) : (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 shrink-0 flex items-center space-x-1">
                        <BarChart2 className="w-2.5 h-2.5" />
                        <span>{item.response.chartConfig?.chartType || 'table'}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span className="font-mono">{item.response.executionTimeMs}ms</span>
                    <span className="flex items-center space-x-1 text-sky-400 font-medium">
                      <span>View analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Session history is preserved in-memory for this browser session.
        </div>
      </div>
    </div>
  );
};

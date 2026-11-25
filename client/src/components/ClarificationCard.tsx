import React from 'react';
import { HelpCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { ClarificationPrompt } from '../types/index.js';

interface ClarificationCardProps {
  clarification: ClarificationPrompt;
  onSelectOption: (promptSuggestion: string) => void;
  isLoading?: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  clarification,
  onSelectOption,
  isLoading = false,
}) => {
  return (
    <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border-2 border-amber-600/70 rounded-2xl p-6 mb-6 shadow-xl shadow-amber-950/20">
      <div className="flex items-start space-x-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Clarification Needed
            </span>
            <span className="text-xs text-slate-400">Agent Guardrail Activated</span>
          </div>

          <h3 className="text-lg font-bold text-white mt-1.5">
            {clarification.clarificationQuestion}
          </h3>

          <p className="text-xs text-amber-200/90 mt-1">
            <span className="font-semibold text-amber-300">Why the agent paused:</span> {clarification.reason}
          </p>

          <p className="text-xs text-slate-400 mt-2 mb-4">
            To provide accurate, verified results without silently guessing your intent, please choose one of these supported calculations:
          </p>

          {/* Clarification Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clarification.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onSelectOption(opt.promptSuggestion)}
                className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-amber-600/30 hover:border-amber-500 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {opt.label}
                  </h4>
                  {opt.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {opt.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-amber-400 font-medium pt-2 border-t border-slate-750">
                  <span className="truncate max-w-[200px] font-mono text-[11px] text-slate-400">
                    "{opt.promptSuggestion}"
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

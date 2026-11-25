import React, { useState } from 'react';
import { CheckCircle2, Clock, Wrench, ChevronDown, ChevronUp, Cpu, ListOrdered, AlertCircle } from 'lucide-react';
import { TraceStep } from '../types/index.js';

interface ExecutionTraceProps {
  plan: string[];
  steps: TraceStep[];
  executionTimeMs: number;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({
  plan,
  steps,
  executionTimeMs,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [isPlanOpen, setIsPlanOpen] = useState<boolean>(false);

  const getStatusIcon = (status: TraceStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'running':
        return <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getToolBadge = (tool: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      schema_profiler: { label: 'schema_profiler', color: 'bg-purple-950 text-purple-300 border-purple-800/60' },
      intent_planner: { label: 'intent_planner', color: 'bg-blue-950 text-blue-300 border-blue-800/60' },
      safe_data_engine: { label: 'safe_data_engine', color: 'bg-emerald-950 text-emerald-300 border-emerald-800/60' },
      chart_result_formatter: { label: 'chart_result_formatter', color: 'bg-amber-950 text-amber-300 border-amber-800/60' },
    };

    const target = badges[tool] || { label: tool, color: 'bg-slate-800 text-slate-300 border-slate-700' };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono border ${target.color}`}>
        <Wrench className="w-2.5 h-2.5" />
        <span>{target.label}</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 shadow-sm">
      <div className="px-5 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center space-x-2">
              <span>Agent Execution Trace</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">
                {steps.length} Steps
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{executionTimeMs}ms total</span>
          </span>

          <button
            onClick={() => setIsPlanOpen(!isPlanOpen)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{isPlanOpen ? 'Hide Plan' : 'View Plan'}</span>
          </button>
        </div>
      </div>

      {/* Plan Accordion */}
      {isPlanOpen && plan && plan.length > 0 && (
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 text-xs">
          <p className="font-semibold text-slate-300 mb-2">Agent Execution Strategy:</p>
          <ol className="space-y-1 list-decimal list-inside text-slate-400 font-mono text-[11px]">
            {plan.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="text-slate-200">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Step by Step Trace List */}
      <div className="p-4 space-y-2.5">
        {steps.map((step) => {
          const isExpanded = expandedStepId === step.id;
          return (
            <div
              key={step.id}
              className="border border-slate-800 rounded-lg bg-slate-850/50 overflow-hidden transition-colors hover:border-slate-700"
            >
              <div
                onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(step.status)}
                  <span className="text-xs font-semibold text-slate-200">{step.step}</span>
                  {getToolBadge(step.tool)}
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">{step.durationMs}ms</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Step Input / Output Details */}
              {isExpanded && (
                <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs space-y-3 font-mono text-[11px]">
                  {step.error && (
                    <div className="p-2.5 rounded bg-rose-950/50 border border-rose-900 text-rose-300">
                      <span className="font-bold">Error:</span> {step.error}
                    </div>
                  )}

                  {step.input && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        Tool Input:
                      </span>
                      <pre className="mt-1 p-2 rounded bg-slate-900 text-slate-300 overflow-x-auto border border-slate-800">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.output && (
                    <div>
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                        Tool Output / Observation:
                      </span>
                      <pre className="mt-1 p-2 rounded bg-slate-900 text-emerald-300 overflow-x-auto border border-slate-800">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

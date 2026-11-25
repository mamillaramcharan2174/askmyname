import React from 'react';
import { BookOpen, X, CheckCircle, ShieldCheck, Sparkles, Terminal, ArrowRight } from 'lucide-react';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunDemoStep: (question: string) => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onRunDemoStep,
}) => {
  if (!isOpen) return null;

  const demoSteps = [
    {
      step: 'Step 1: Core Plain-Language Analytics',
      prompt: 'Which product had the highest sales last quarter?',
      desc: 'Demonstrates filter extraction (Quarter = Q4), grouping by category, sum aggregation, descending sort, and bar chart formatting.',
    },
    {
      step: 'Step 2: Conversational Follow-Up Query',
      prompt: 'Now break that down by region',
      desc: 'Shows conversational context preservation: remembers previous measures while pivoting to geographic distribution.',
    },
    {
      step: 'Step 3: Multi-Metric Aggregation & Comparison',
      prompt: 'Show average discount and total revenue by customer segment',
      desc: 'Demonstrates multi-series analysis (AVG Discount % + SUM Revenue) and category breakdown.',
    },
    {
      step: 'Step 4: Ambiguity & Clarification (No-Guessing)',
      prompt: 'Show performance',
      desc: 'Tests agent safeguard against hallucination. Pauses and prompts the user to select specific performance metrics.',
    },
    {
      step: 'Step 5: Safety Guard & Malicious Code Rejection',
      prompt: 'Drop table users;',
      desc: 'Demonstrates rejection of arbitrary SQL/DDL injection. Agent safely enforces allowlisted read-only AST schemas.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AskMyData — Demo Script & Hackathon Guide</h2>
              <p className="text-[11px] text-slate-400">
                Theme 9: Data & Analytics Agents • 3–5 Minute Evaluation Walkthrough
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-200">
            <span className="font-semibold block mb-0.5">Quick Evaluation Instructions:</span>
            Click any step below to automatically paste and execute the question in AskMyData. Each step highlights a key hackathon grading requirement.
          </div>

          <div className="space-y-3">
            {demoSteps.map((s, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-200 flex items-center space-x-2">
                    <span className="text-sky-400 font-mono">0{idx + 1}.</span>
                    <span>{s.step}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{s.desc}</div>
                  <div className="text-[11px] text-sky-400 font-mono mt-1">"{s.prompt}"</div>
                </div>

                <button
                  onClick={() => {
                    onRunDemoStep(s.prompt);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] flex items-center space-x-1 shrink-0 self-start sm:self-center shadow-md transition-colors"
                >
                  <span>Try Question</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Architecture Checklist */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Architecture & Safety Checklist:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tool 1: Schema Profiler & Type Inferrer</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tool 2: Safe Read-Only Data Engine</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tool 3: Visual Chart & Insight Formatter</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zod Backend Output Validation</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No arbitrary eval or raw SQL execution</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Autonomous offline demo mode fallback</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Search, Sparkles, Send, Loader2, HelpCircle, ShieldAlert } from 'lucide-react';
import { DatasetProfile } from '../types';

interface QueryInputProps {
  onAsk: (question: string) => void;
  isLoading: boolean;
  profile: DatasetProfile;
}

export const QueryInput: React.FC<QueryInputProps> = ({ onAsk, isLoading, profile }) => {
  const [question, setQuestion] = useState('');

  const isTechSales = profile.filename.toLowerCase().includes('tech_sales');
  const isEcommerce = profile.filename.toLowerCase().includes('ecommerce');

  const defaultStarterQuestions = isTechSales
    ? [
        {
          text: 'Which product had the highest sales last quarter?',
          badge: 'Filter & Group',
          type: 'standard',
        },
        {
          text: 'Show average discount and total revenue by customer segment',
          badge: 'Multi-metric',
          type: 'standard',
        },
        {
          text: 'Show total revenue by region in Europe',
          badge: 'Filtered Chart',
          type: 'standard',
        },
        {
          text: 'Show performance',
          badge: 'Demo Clarification (No-Guessing)',
          type: 'clarification',
        },
        {
          text: 'Drop table users;',
          badge: 'Demo Safe Rejection',
          type: 'safety',
        },
      ]
    : isEcommerce
    ? [
        {
          text: 'Which category generated the highest total sales?',
          badge: 'Top Performer',
          type: 'standard',
        },
        {
          text: 'Show total profit and sales by country',
          badge: 'Comparison',
          type: 'standard',
        },
        {
          text: 'Show performance',
          badge: 'Demo Clarification',
          type: 'clarification',
        },
        {
          text: 'Delete from orders where quantity < 2',
          badge: 'Demo Safe Rejection',
          type: 'safety',
        },
      ]
    : [
        {
          text: `Show total records by ${profile.columns.find((c) => c.inferredType === 'string')?.name || 'category'}`,
          badge: 'Aggregation',
          type: 'standard',
        },
        {
          text: 'Show performance',
          badge: 'Demo Clarification',
          type: 'clarification',
        },
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onAsk(question.trim());
  };

  const handleSelectStarter = (qText: string) => {
    setQuestion(qText);
    onAsk(qText);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <label htmlFor="agent-question-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Ask Your Question in Plain Language</span>
        </label>
        <span className="text-[11px] text-slate-400">
          Enter questions, comparisons, or follow-ups
        </span>
      </div>

      {/* Input Field Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5 text-sky-400" />
        </div>

        <input
          id="agent-question-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='e.g., "Which product had the highest sales last quarter?" or "Show monthly revenue trend"'
          disabled={isLoading}
          className="w-full pl-12 pr-32 py-3.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition-all"
        />

        <div className="absolute right-2 flex items-center space-x-1.5">
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs transition-all shadow-md flex items-center space-x-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Ask Agent</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Starter Questions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="text-[11px] text-slate-400 mb-2 flex items-center space-x-1">
          <span>Example questions to try:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {defaultStarterQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectStarter(q.text)}
              disabled={isLoading}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left flex items-center space-x-1.5 ${
                q.type === 'clarification'
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-300 hover:bg-amber-900/50'
                  : q.type === 'safety'
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <span>{q.text}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                  q.type === 'clarification'
                    ? 'bg-amber-500/20 text-amber-300'
                    : q.type === 'safety'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-900 text-sky-400'
                }`}
              >
                {q.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

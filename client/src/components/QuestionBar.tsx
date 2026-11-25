import React, { useState } from 'react';
import { Search, Sparkles, CornerDownLeft, HelpCircle } from 'lucide-react';
import { DatasetProfile } from '../types/index.js';

interface QuestionBarProps {
  onAsk: (question: string) => void;
  isLoading: boolean;
  dataset: DatasetProfile;
  suggestedFollowUps?: string[];
}

export const QuestionBar: React.FC<QuestionBarProps> = ({
  onAsk,
  isLoading,
  dataset,
  suggestedFollowUps = [],
}) => {
  const [question, setQuestion] = useState('');

  const isTechSales = dataset.filename.toLowerCase().includes('tech_sales');
  const isEcom = dataset.filename.toLowerCase().includes('ecommerce');

  // Starter prompts tailored to active dataset
  const samplePrompts = isTechSales
    ? [
        'Which product had the highest sales last quarter?',
        'Show total revenue by region',
        'What is the average customer satisfaction per customer segment?',
        'Show top 5 sales orders in North America',
        'Show performance summary', // Triggers clarification prompt demo!
      ]
    : isEcom
    ? [
        'Which category had the highest sales?',
        'Show total profit by country',
        'Which shipping mode had the highest average sales?',
        'Show top 5 orders by profit',
        'Show performance summary', // Triggers clarification prompt demo!
      ]
    : [
        `Show top 5 records by ${dataset.columns.find((c) => c.inferredType === 'number')?.name || 'value'}`,
        `Count total records by ${dataset.columns.find((c) => c.inferredType === 'string')?.name || 'category'}`,
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onAsk(question.trim());
  };

  const handlePromptClick = (prompt: string) => {
    setQuestion(prompt);
    onAsk(prompt);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-lg shadow-black/20">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-sky-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            placeholder='Ask any question in plain language (e.g. "Which product had the highest sales last quarter?")...'
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-12 pr-28 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 transition-all disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="absolute right-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-sky-600/20"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <span>Ask</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Follow-up suggestions if available */}
      {suggestedFollowUps && suggestedFollowUps.length > 0 && !isLoading && (
        <div className="mt-3 flex items-center flex-wrap gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-sky-400 font-medium flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suggested follow-ups:</span>
          </span>
          {suggestedFollowUps.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(prompt)}
              className="text-xs px-2.5 py-1 rounded-full bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-800/60 transition-all hover:scale-[1.02]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Suggested Starter Questions */}
      <div className="mt-3 flex items-center flex-wrap gap-2">
        <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Try asking:</span>
        </span>
        {samplePrompts.map((prompt, idx) => {
          const isAmbiguousPrompt = prompt.toLowerCase().includes('performance');
          return (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all text-left ${
                isAmbiguousPrompt
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
              }`}
            >
              {isAmbiguousPrompt && <span className="mr-1 text-amber-400 font-mono text-[10px]">[Clarification Demo]</span>}
              {prompt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

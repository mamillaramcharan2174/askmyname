import React, { useState } from 'react';
import { Code2, Copy, Check, ShieldCheck, Terminal } from 'lucide-react';
import { AnalysisQuery } from '../types';

interface QueryAstViewerProps {
  pseudoSql?: string;
  queryAst?: AnalysisQuery;
}

export const QueryAstViewer: React.FC<QueryAstViewerProps> = ({ pseudoSql, queryAst }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'ast'>('sql');

  if (!pseudoSql && !queryAst) return null;

  const contentToCopy = activeTab === 'sql' ? (pseudoSql || '') : JSON.stringify(queryAst, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200">
            Validated Query & Calculation
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Zero-Eval Safe Engine</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tabs */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeTab === 'sql'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pseudo-SQL
            </button>
            <button
              onClick={() => setActiveTab('ast')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeTab === 'ast'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON AST
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center space-x-1"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto">
        {activeTab === 'sql' ? (
          <pre className="text-sky-300 leading-relaxed">{pseudoSql}</pre>
        ) : (
          <pre className="text-emerald-300 leading-relaxed">{JSON.stringify(queryAst, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};

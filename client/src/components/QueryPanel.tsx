import React, { useState } from 'react';
import { Terminal, ShieldCheck, Copy, Check, Code } from 'lucide-react';
import { AnalysisQuery } from '../types/index.js';

interface QueryPanelProps {
  pseudoSql?: string;
  queryAst?: AnalysisQuery;
}

export const QueryPanel: React.FC<QueryPanelProps> = ({ pseudoSql, queryAst }) => {
  const [viewMode, setViewMode] = useState<'sql' | 'ast'>('sql');
  const [copied, setCopied] = useState<boolean>(false);

  const contentToCopy = viewMode === 'sql' ? (pseudoSql || '') : JSON.stringify(queryAst, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pseudoSql && !queryAst) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 shadow-sm">
      <div className="px-5 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center space-x-2">
              <span>Safe Query & Calculation</span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero-Eval Read-Only</span>
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('sql')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'sql'
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pseudo-SQL
            </button>
            <button
              onClick={() => setViewMode('ast')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'ast'
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Safe AST JSON
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Copy query"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-950 text-xs font-mono overflow-x-auto">
        {viewMode === 'sql' ? (
          <pre className="text-sky-300 leading-relaxed">
            {pseudoSql || '-- No query representation available'}
          </pre>
        ) : (
          <pre className="text-emerald-300 leading-relaxed">
            {JSON.stringify(queryAst, null, 2)}
          </pre>
        )}
      </div>

      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Execution Engine: Safe in-memory aggregator (allowlisted operators & aggregations)</span>
        <span className="text-slate-500 font-mono">Status: Read-Only Verified</span>
      </div>
    </div>
  );
};

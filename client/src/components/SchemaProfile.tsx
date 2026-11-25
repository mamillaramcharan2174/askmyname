import React, { useState } from 'react';
import {
  Columns,
  Hash,
  Type,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  HelpCircle,
} from 'lucide-react';
import { DatasetProfile, InferredType } from '../types';

interface SchemaProfileProps {
  profile: DatasetProfile;
}

export const SchemaProfile: React.FC<SchemaProfileProps> = ({ profile }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeBadge = (type: InferredType) => {
    switch (type) {
      case 'number':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Hash className="w-3 h-3" />
            <span>numeric</span>
          </span>
        );
      case 'string':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Type className="w-3 h-3" />
            <span>string</span>
          </span>
        );
      case 'date':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Calendar className="w-3 h-3" />
            <span>date</span>
          </span>
        );
      case 'boolean':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>boolean</span>
          </span>
        );
    }
  };

  const totalNulls = profile.columns.reduce((acc, c) => acc + c.nullCount, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Top Banner / Summary Stats */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>{profile.filename}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                In-Memory Session
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Profiled schema with strict type inference and column health verification
            </p>
          </div>
        </div>

        {/* Metric Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs">
            <span className="text-slate-400 mr-1.5">Rows:</span>
            <span className="font-semibold text-slate-200">
              {profile.rowCount.toLocaleString()}
            </span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs">
            <span className="text-slate-400 mr-1.5">Columns:</span>
            <span className="font-semibold text-slate-200">{profile.columnCount}</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs">
            <span className="text-slate-400 mr-1.5">Nulls:</span>
            <span className={`font-semibold ${totalNulls > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {totalNulls}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-sky-400 font-medium transition-colors flex items-center space-x-1"
          >
            <span>{isExpanded ? 'Hide Columns' : 'View Columns & Types'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Dataset Quality Warnings if any */}
      {profile.issues.length > 0 && (
        <div className="px-5 py-2.5 bg-amber-950/30 border-b border-amber-900/40 flex items-center space-x-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {profile.issues.length} data observation(s): {profile.issues.map((i) => i.message).join(' ')}
          </span>
        </div>
      )}

      {/* Expanded Column Details */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-slate-950/60 divide-y divide-slate-800/60">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.columns.map((col) => (
              <div
                key={col.name}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200 truncate font-mono" title={col.name}>
                    {col.name}
                  </span>
                  {getTypeBadge(col.inferredType)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>{col.uniqueCount} distinct values</span>
                  <span>{col.nullCount > 0 ? `${col.nullCount} nulls` : 'Zero nulls'}</span>
                </div>

                {/* Sample values preview */}
                <div className="flex flex-wrap gap-1">
                  {col.sampleValues.slice(0, 3).map((v, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60 truncate max-w-[120px]"
                      title={String(v)}
                    >
                      {String(v)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

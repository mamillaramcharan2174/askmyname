import React, { useState } from 'react';
import { Table, Layers, AlertTriangle, Info, ChevronDown, ChevronUp, Hash, Calendar, Type, CheckSquare } from 'lucide-react';
import { DatasetProfile, InferredType } from '../types/index.js';

interface DatasetProfileViewProps {
  profile: DatasetProfile;
}

export const DatasetProfileView: React.FC<DatasetProfileViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'schema'>('preview');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const getTypeBadge = (type: InferredType) => {
    switch (type) {
      case 'number':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950 text-sky-400 border border-sky-800/60">
            <Hash className="w-3 h-3" />
            <span>number</span>
          </span>
        );
      case 'date':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-950 text-violet-400 border border-violet-800/60">
            <Calendar className="w-3 h-3" />
            <span>date</span>
          </span>
        );
      case 'boolean':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            <CheckSquare className="w-3 h-3" />
            <span>boolean</span>
          </span>
        );
      case 'string':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/60">
            <Type className="w-3 h-3" />
            <span>string</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 shadow-sm">
      {/* Top Header & Accordion Toggle */}
      <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>{profile.filename}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                {profile.rowCount} rows • {profile.columnCount} columns
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {profile.issues.length > 0 && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs bg-amber-950/70 border border-amber-800/60 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile.issues.length} Quality Notice{profile.issues.length > 1 ? 's' : ''}</span>
            </span>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'preview'
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data Preview
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'schema'
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Schema Profiler ({profile.columns.length})
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            title={isExpanded ? 'Collapse preview' : 'Expand preview'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4">
          {/* Quality issues alert if any */}
          {profile.issues.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/30 border border-amber-900/60 text-xs text-amber-300 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-amber-200">Dataset Profiling Observations:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {profile.issues.map((issue, idx) => (
                    <li key={idx}>
                      {issue.column ? <span className="font-mono text-amber-300">[{issue.column}]</span> : null}{' '}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'preview' ? (
            /* Table Preview */
            <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                <thead className="bg-slate-850 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-slate-400 font-mono text-[11px] w-12 text-center">#</th>
                    {profile.columns.map((col) => (
                      <th key={col.name} className="px-3 py-2 font-semibold text-slate-300 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{col.name}</span>
                          {getTypeBadge(col.inferredType)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                  {profile.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500 text-center">{idx + 1}</td>
                      {profile.columns.map((col) => {
                        const val = row[col.name];
                        const isNull = val === undefined || val === null || val === '';
                        return (
                          <td key={col.name} className="px-3 py-1.5 whitespace-nowrap text-slate-300">
                            {isNull ? (
                              <span className="text-slate-600 italic">null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Schema Profiler Table */
            <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                <thead className="bg-slate-850 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-300">Column Name</th>
                    <th className="px-3 py-2 font-semibold text-slate-300">Inferred Type</th>
                    <th className="px-3 py-2 font-semibold text-slate-300">Missing / Nulls</th>
                    <th className="px-3 py-2 font-semibold text-slate-300">Unique Values</th>
                    <th className="px-3 py-2 font-semibold text-slate-300">Range (Min - Max)</th>
                    <th className="px-3 py-2 font-semibold text-slate-300">Sample Distinct Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                  {profile.columns.map((col) => {
                    const nullPct = Math.round((col.nullCount / profile.rowCount) * 100);
                    return (
                      <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-2 font-mono font-medium text-sky-400">{col.name}</td>
                        <td className="px-3 py-2">{getTypeBadge(col.inferredType)}</td>
                        <td className="px-3 py-2">
                          {col.nullCount === 0 ? (
                            <span className="text-emerald-400">0 (0%)</span>
                          ) : (
                            <span className={nullPct > 20 ? 'text-rose-400 font-semibold' : 'text-amber-400'}>
                              {col.nullCount} ({nullPct}%)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-300">{col.uniqueCount}</td>
                        <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                          {col.min !== undefined && col.max !== undefined
                            ? `${col.min} → ${col.max}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {col.sampleValues.slice(0, 3).map((v, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                              >
                                {String(v)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

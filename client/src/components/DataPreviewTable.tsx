import React, { useState } from 'react';
import { Table, Eye, EyeOff } from 'lucide-react';
import { DatasetProfile } from '../types';

interface DataPreviewTableProps {
  profile: DatasetProfile;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!profile.previewRows || profile.previewRows.length === 0) {
    return null;
  }

  const columns = profile.columns.map((c) => c.name);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Table className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200">
            Preview Dataset Rows (Sample of first {profile.previewRows.length} records)
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{isOpen ? 'Collapse Preview' : 'Show Rows'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-800 overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 sticky top-0 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-slate-500 w-12 text-center">#</th>
                {columns.map((col) => (
                  <th key={col} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {profile.previewRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-500 text-center text-[11px]">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col} className="py-2 px-3 text-slate-300 whitespace-nowrap text-[11px]">
                      {row[col] !== undefined && row[col] !== null ? String(row[col]) : <span className="text-slate-600 italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

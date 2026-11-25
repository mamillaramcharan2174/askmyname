import React, { useState } from 'react';
import { Table, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface ResultTableProps {
  data: Record<string, any>[];
  totalMatchedRows?: number;
}

export const ResultTable: React.FC<ResultTableProps> = ({ data, totalMatchedRows }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
        No records returned from this query.
      </div>
    );
  }

  const columns = Object.keys(data[0]);
  const totalPages = Math.ceil(data.length / pageSize);
  const currentRows = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDownloadCsv = () => {
    const headers = columns.join(',');
    const rows = data.map((r) =>
      columns
        .map((col) => {
          const val = r[col];
          const str = val !== null && val !== undefined ? String(val) : '';
          return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(',')
    );
    const csvString = [headers, ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `askmydata_query_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCellValue = (val: any, colName: string) => {
    if (val === null || val === undefined) return <span className="text-slate-600 italic">null</span>;
    if (typeof val === 'number') {
      const lower = colName.toLowerCase();
      if (lower.includes('rev') || lower.includes('sales') || lower.includes('price') || lower.includes('cost') || lower.includes('profit')) {
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (lower.includes('pct') || lower.includes('discount') || lower.includes('margin') || lower.includes('rate')) {
        return `${val}%`;
      }
      return val.toLocaleString('en-US');
    }
    return String(val);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Table className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200">
            Computed Results Table
          </span>
          <span className="text-[11px] text-slate-400">
            ({data.length} {data.length === 1 ? 'row' : 'rows'} displayed
            {totalMatchedRows !== undefined && totalMatchedRows !== data.length ? ` from ${totalMatchedRows} matched records` : ''})
          </span>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4 font-semibold text-slate-500 w-12 text-center">#</th>
              {columns.map((col) => (
                <th key={col} className="py-2.5 px-4 font-semibold whitespace-nowrap">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {currentRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-500 text-center text-[11px]">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                {columns.map((col) => (
                  <td key={col} className="py-2.5 px-4 text-slate-200 whitespace-nowrap text-[11px]">
                    {formatCellValue(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

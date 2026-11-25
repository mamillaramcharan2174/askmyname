import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, Table as TableIcon, Download, Layers } from 'lucide-react';
import { ChartConfig } from '../types/index.js';

interface VisualResultProps {
  chartConfig?: ChartConfig;
  results?: Record<string, any>[];
  totalMatchedRows?: number;
  outputRowsCount?: number;
}

const PALETTE = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];

export const VisualResult: React.FC<VisualResultProps> = ({
  chartConfig,
  results = [],
  totalMatchedRows,
  outputRowsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  if (!results || results.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 mb-6">
        <p className="text-sm">No records matched the specified query parameters.</p>
      </div>
    );
  }

  const columns = Object.keys(results[0] || {});
  const chartType = chartConfig?.chartType || 'bar';

  // Format cell values
  const formatCellValue = (val: any, colName: string) => {
    if (val === undefined || val === null) return '—';
    if (typeof val === 'number') {
      const lower = colName.toLowerCase();
      if (lower.includes('rev') || lower.includes('sales') || lower.includes('price') || lower.includes('cost') || lower.includes('profit')) {
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (lower.includes('pct') || lower.includes('margin') || lower.includes('discount') || lower.includes('percent')) {
        return `${val}%`;
      }
      return val.toLocaleString('en-US');
    }
    return String(val);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (results.length === 0) return;
    const header = columns.join(',');
    const rows = results.map((r) => columns.map((c) => JSON.stringify(r[c] ?? '')).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `askmydata_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-semibold text-white">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {typeof entry.value === 'number' ? entry.value.toLocaleString('en-US') : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!chartConfig || chartType === 'table') {
      return renderTable();
    }

    const xAxisKey = chartConfig.xAxisKey || columns[0];
    const yAxisKeys = chartConfig.yAxisKeys && chartConfig.yAxisKeys.length > 0
      ? chartConfig.yAxisKeys
      : [{ key: columns[1] || columns[0], label: columns[1] || columns[0], color: PALETTE[0] }];

    switch (chartType) {
      case 'pie': {
        const valueKey = yAxisKeys[0].key;
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Pie
                data={results}
                dataKey={valueKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={105}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {results.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'line': {
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={results} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.legend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              {yAxisKeys.map((item, idx) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color || PALETTE[idx % PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }

      case 'area': {
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={results} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.legend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              {yAxisKeys.map((item, idx) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color || PALETTE[idx % PALETTE.length]}
                  fill={item.color || PALETTE[idx % PALETTE.length]}
                  fillOpacity={0.25}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      }

      case 'bar':
      default: {
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={results} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} angle={-20} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.legend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              {yAxisKeys.map((item, idx) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color || PALETTE[idx % PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }
  };

  const renderTable = () => {
    return (
      <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
          <thead className="bg-slate-850 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-slate-400 font-mono text-[11px] w-12 text-center">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 font-semibold text-slate-300 whitespace-nowrap">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900">
            {results.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500 text-center">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-1.5 whitespace-nowrap text-slate-200">
                    {formatCellValue(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 shadow-sm">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>{chartConfig?.title || 'Analysis Results'}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {results.length} rows {totalMatchedRows ? `(matched ${totalMatchedRows})` : ''}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tab buttons */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'chart'
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Visual Chart</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'table'
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Table</span>
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1 text-xs"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {activeTab === 'chart' ? renderChart() : renderTable()}
      </div>
    </div>
  );
};

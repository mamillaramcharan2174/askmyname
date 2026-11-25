import React, { useState } from 'react';
import {
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
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AreaChart as AreaIcon } from 'lucide-react';
import { ChartConfig } from '../types';

interface ChartViewerProps {
  chartConfig: ChartConfig;
  data: Record<string, any>[];
}

const PIE_COLORS = [
  '#0284c7',
  '#0ea5e9',
  '#38bdf8',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
];

export const ChartViewer: React.FC<ChartViewerProps> = ({ chartConfig, data }) => {
  const [selectedType, setSelectedType] = useState<'bar' | 'line' | 'pie' | 'area'>(
    chartConfig.chartType === 'table' ? 'bar' : (chartConfig.chartType as any)
  );

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No chart data available for this query.
      </div>
    );
  }

  const { title, xAxisKey, yAxisKeys } = chartConfig;

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono">
          <p className="font-semibold text-slate-200 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => {
            const val = entry.value;
            const formatted = typeof val === 'number'
              ? val.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : String(val);
            return (
              <p key={index} className="flex items-center space-x-2 text-[11px]" style={{ color: entry.color }}>
                <span>{entry.name}:</span>
                <span className="font-bold">{formatted}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-400">
            Interactive visualization powered by Recharts
          </p>
        </div>

        {/* Chart type toggle */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 space-x-1">
          <button
            onClick={() => setSelectedType('bar')}
            className={`p-1.5 rounded transition-all ${
              selectedType === 'bar' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedType('line')}
            className={`p-1.5 rounded transition-all ${
              selectedType === 'line' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Line Chart"
          >
            <LineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedType('area')}
            className={`p-1.5 rounded transition-all ${
              selectedType === 'area' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Area Chart"
          >
            <AreaIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedType('pie')}
            className={`p-1.5 rounded transition-all ${
              selectedType === 'pie' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pie Chart"
          >
            <PieIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {selectedType === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={yAxisKeys[0]?.key || Object.keys(data[0])[1]}
                nameKey={xAxisKey || Object.keys(data[0])[0]}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={45}
                paddingAngle={3}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          ) : selectedType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={xAxisKey}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.legend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {yAxisKeys.map((y, idx) => (
                <Line
                  key={y.key}
                  type="monotone"
                  dataKey={y.key}
                  name={y.label}
                  stroke={y.color || PIE_COLORS[idx % PIE_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : selectedType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={xAxisKey}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.legend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {yAxisKeys.map((y, idx) => (
                <Area
                  key={y.key}
                  type="monotone"
                  dataKey={y.key}
                  name={y.label}
                  stroke={y.color || PIE_COLORS[idx % PIE_COLORS.length]}
                  fill={y.color || PIE_COLORS[idx % PIE_COLORS.length]}
                  fillOpacity={0.25}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={xAxisKey}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.legend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {yAxisKeys.map((y, idx) => (
                <Bar
                  key={y.key}
                  dataKey={y.key}
                  name={y.label}
                  fill={y.color || PIE_COLORS[idx % PIE_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import React from 'react';
import { Lightbulb, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { InsightSummary } from '../types/index.js';

interface InsightCardProps {
  insight?: InsightSummary;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  if (!insight) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 shadow-sm">
      <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center space-x-2.5">
        <div className="p-1.5 rounded-lg bg-amber-950 text-amber-400">
          <Lightbulb className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-white">Plain-Language Insights & Findings</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Executive Summary */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-sm leading-relaxed">
          <p className="font-medium text-white">{insight.summary}</p>
        </div>

        {/* Key Findings List */}
        {insight.keyFindings && insight.keyFindings.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Key Findings
            </h4>
            <ul className="space-y-1.5">
              {insight.keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: finding.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>'),
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Caveats & Assumptions */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {insight.dataCaveats && insight.dataCaveats.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800 text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Data Scope & Caveats</span>
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {insight.dataCaveats.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {insight.limitations && insight.limitations.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800 text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Analytical Limits</span>
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {insight.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

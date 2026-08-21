// src/components/RecommendationCard.jsx
import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, ChevronDown, ChevronUp, ArrowUpRight, ShieldAlert } from 'lucide-react';

const RecommendationCard = ({ recommendation, isLoading = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="fintech-card p-5 animate-pulse space-y-3">
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  const isHighUrgency = (recommendation.urgency || '').toLowerCase() === 'high';

  return (
    <div className="fintech-card p-5 flex flex-col justify-between space-y-4">
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
            {recommendation.category || 'Strategic Growth'}
          </span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
            isHighUrgency 
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}>
            {recommendation.urgency || 'Medium'} Urgency
          </span>
        </div>

        {/* Title & Financial Impact */}
        <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
          {recommendation.title}
        </h4>

        <div className="mt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Estimated Impact:</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {recommendation.impact}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Confidence:</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
              {recommendation.confidence || '92%'}
            </span>
          </div>
        </div>

        {/* Summary Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
          {recommendation.summary}
        </p>

        {/* Action Plan Dropdown */}
        {recommendation.action_plan && recommendation.action_plan.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{expanded ? 'Hide Action Steps' : 'View Action Steps'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expanded && (
              <ul className="mt-2.5 space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
                {recommendation.action_plan.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Footer Badge */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Status: <strong className="text-slate-800 dark:text-slate-200">{recommendation.status || 'Ready'}</strong></span>
        <span className="font-mono text-[10px] text-slate-400">{recommendation.id}</span>
      </div>
    </div>
  );
};

export default RecommendationCard;

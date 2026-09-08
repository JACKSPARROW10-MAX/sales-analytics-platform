// src/components/RecommendationCard.jsx
import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, ChevronDown, ChevronUp, ArrowUpRight, ShieldAlert } from 'lucide-react';

const RecommendationCard = ({ recommendation, isLoading = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="fintech-card p-5 animate-pulse space-y-3">
        <div className="h-4 w-3/4 bg-[#DAF1DE] dark:bg-[#163832] rounded"></div>
        <div className="h-12 bg-[#EDF8EF] dark:bg-[#0B2B26] rounded"></div>
      </div>
    );
  }

  const isHighUrgency = (recommendation.urgency || '').toLowerCase() === 'high';

  return (
    <div className="fintech-card p-5 flex flex-col justify-between space-y-4">
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#235347] dark:text-[#8EB69B] bg-[#DAF1DE] dark:bg-[#163832] px-2 py-0.5 rounded border border-[#8EB69B] dark:border-[#235347]">
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
        <h4 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] tracking-tight leading-snug">
          {recommendation.title}
        </h4>

        <div className="mt-3 flex items-center justify-between bg-[#EDF8EF] dark:bg-[#0B2B26] p-2.5 rounded-lg border border-[#c4dfc8] dark:border-[#235347]">
          <div>
            <span className="text-[10px] text-[#235347] dark:text-[#8EB69B] block font-semibold">Estimated Impact:</span>
            <span className="text-sm font-bold text-[#8EB69B] dark:text-[#8EB69B] font-mono tabular-nums">
              {recommendation.impact}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#235347] dark:text-[#8EB69B] block font-semibold">Confidence:</span>
            <span className="text-xs font-bold text-[#051F20] dark:text-[#DAF1DE] font-mono">
              {recommendation.confidence || '92%'}
            </span>
          </div>
        </div>

        {/* Summary Description */}
        <p className="text-xs text-[#235347] dark:text-[#8EB69B] mt-3 leading-relaxed">
          {recommendation.summary}
        </p>

        {/* Action Plan Dropdown */}
        {recommendation.action_plan && recommendation.action_plan.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold text-[#235347] dark:text-[#8EB69B] hover:text-[#163832] dark:hover:text-[#DAF1DE] flex items-center gap-1 cursor-pointer"
            >
              <span>{expanded ? 'Hide Action Steps' : 'View Action Steps'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expanded && (
              <ul className="mt-2.5 space-y-1.5 bg-[#EDF8EF] dark:bg-[#0B2B26] p-3 rounded-lg border border-[#c4dfc8] dark:border-[#235347] text-xs">
                {recommendation.action_plan.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[#051F20] dark:text-[#DAF1DE]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8EB69B] dark:text-[#8EB69B] shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Footer Badge */}
      <div className="pt-2 border-t border-[#DAF1DE] dark:border-[#235347] flex items-center justify-between text-[11px] text-[#235347] dark:text-[#8EB69B]">
        <span>Status: <strong className="text-[#051F20] dark:text-[#DAF1DE]">{recommendation.status || 'Ready'}</strong></span>
        <span className="font-mono text-[10px] text-[#8EB69B]">{recommendation.id}</span>
      </div>
    </div>
  );
};

export default RecommendationCard;

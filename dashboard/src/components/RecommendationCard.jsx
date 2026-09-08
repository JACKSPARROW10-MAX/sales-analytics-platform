// src/components/RecommendationCard.jsx
import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from './ui';

const RecommendationCard = ({ recommendation: r, isLoading = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="fintech-card p-5 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-12 w-full" />
      </div>
    );
  }

  const urgency = (r.urgency || 'Medium').toString();
  const isHigh = urgency.toLowerCase() === 'high';
  const drivers = r.drivers || r.reason_drivers || [];

  return (
    <div className="fintech-card p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="info"><Sparkles className="w-3 h-3" /> AI-generated</Badge>
        <Badge tone={isHigh ? 'danger' : 'warning'}>{urgency} urgency</Badge>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">
          {r.category || 'Strategy'}
        </p>
        <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] leading-snug mt-0.5">
          {r.title}
        </h4>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-3">
        <div>
          <p className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8]">Estimated impact</p>
          <p className="text-sm font-bold text-[#16A34A] dark:text-green-400 tabular-nums">{r.impact || '—'}</p>
        </div>
        {r.confidence && (
          <div className="text-right">
            <p className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8]">Confidence</p>
            <p className="text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">{r.confidence}</p>
          </div>
        )}
      </div>

      {r.summary && (
        <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
          <span className="font-semibold text-[#0F172A] dark:text-[#E2E8F0]">Why: </span>
          {r.summary}
        </p>
      )}

      {drivers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {drivers.slice(0, 4).map((d, i) => (
            <span key={i} className="text-[10px] font-medium text-[#475569] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#1E293B] px-2 py-0.5 rounded">
              {typeof d === 'string' ? d : d.name}
            </span>
          ))}
        </div>
      )}

      {Array.isArray(r.action_plan) && r.action_plan.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
          >
            {expanded ? 'Hide action steps' : 'View action steps'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-3 text-xs">
              {r.action_plan.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-[#0F172A] dark:text-[#E2E8F0]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="pt-2 mt-auto border-t border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
        <span>Status: <strong className="text-[#0F172A] dark:text-[#E2E8F0]">{r.status || 'Ready'}</strong></span>
        {r.id && <span className="font-mono text-[10px]">{r.id}</span>}
      </div>
    </div>
  );
};

export default RecommendationCard;

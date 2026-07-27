// src/components/RecommendationCard.jsx
import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Zap, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const RecommendationCard = ({ recommendation, isLoading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 w-40 bg-slate-800 rounded"></div>
          <div className="h-4 w-20 bg-slate-800 rounded"></div>
        </div>
        <div className="h-10 bg-slate-800/60 rounded-lg"></div>
        <div className="h-4 w-28 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const { title, explanation, impactTag, impactType, confidence, productName, shapDrivers } = recommendation;

  const typeConfig = {
    warning: {
      border: 'hover:border-amber-500/40',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: AlertCircle
    },
    positive: {
      border: 'hover:border-emerald-500/40',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: TrendingUp
    },
    critical: {
      border: 'hover:border-rose-500/40',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: Zap
    },
    info: {
      border: 'hover:border-indigo-500/40',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: Sparkles
    }
  };

  const currentType = typeConfig[impactType] || typeConfig.info;
  const TypeIcon = currentType.icon;

  return (
    <div className={`glass-card rounded-2xl p-5 border border-slate-800/80 transition-all duration-300 flex flex-col justify-between ${currentType.border}`}>
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
              <TypeIcon className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {productName}
            </span>
          </div>

          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentType.badgeBg}`}>
            {impactTag}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white tracking-tight mb-2 flex items-center justify-between">
          {title}
        </h3>

        {/* Natural Language GenAI Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
          {explanation}
        </p>
      </div>

      {/* Expandable SHAP Explainability Section */}
      <div className="pt-3 border-t border-slate-800/80 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            {confidence}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide SHAP Drivers' : 'Why? (SHAP Drivers)'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Feature Importance List */}
        {isExpanded && (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 animate-fadeIn">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Top Model Decision Drivers (SHAP Value Impact):
            </p>
            <div className="space-y-1.5 font-sans">
              {shapDrivers.map((driver, index) => {
                const isPos = driver.direction === 'positive';
                return (
                  <div key={index} className="flex items-center justify-between text-[11px] bg-slate-800/50 px-2.5 py-1 rounded-lg">
                    <span className="text-slate-300">{driver.name}</span>
                    <span className={`font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {driver.contribution}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default RecommendationCard;

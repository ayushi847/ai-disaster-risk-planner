import React from 'react';
import { RiskBadge, PriorityBadge, StatusBadge } from './Badges';

export function DecisionCard({ decision, onClick }) {
  // Determine border color dynamically based on risk level
  const borderColors = {
    CRITICAL: 'var(--status-rejected)',
    HIGH: 'var(--status-pending)',
    MEDIUM: '#f59e0b',
    LOW: 'var(--status-approved)',
  };

  const borderLeftColor = borderColors[decision.riskLevel] || 'var(--border-glass)';
  const glowHoverClass = `glow-card glow-card-${decision.riskLevel?.toLowerCase() || 'default'}`;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-5 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow ${glowHoverClass}`}
      style={{ borderLeft: `4px solid ${borderLeftColor}` }}
      onClick={() => onClick(decision.id)}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-base font-bold text-slate-800 tracking-tight leading-snug">
            {decision.villageName || `Village ${decision.villageId}`}
          </h3>
          <StatusBadge status={decision.status} />
        </div>

        {/* Location tag with SVG pin */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{decision.district}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
        <RiskBadge level={decision.riskLevel} />
        <PriorityBadge level={decision.priorityLevel} />
      </div>
    </div>
  );
}
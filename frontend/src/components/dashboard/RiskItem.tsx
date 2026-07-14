// src/components/dashboard/RiskItem.tsx
import React from 'react';
import { WarningCircle, Money, Clock } from '@phosphor-icons/react';

export type RiskItemProps = {
  icon?: React.ReactNode; // default icon
  title: string;
  description: string;
  severity: 'critical' | 'moderate' | 'info';
};

const severityMap = {
  critical: {
    borderClass: 'border-l-4 border-l-status-danger',
    badgeClass: 'border border-status-danger text-status-danger',
    bgClass: 'bg-[#FEE2E2] text-[#DC2626]',
  },
  moderate: {
    borderClass: 'border-l-4 border-l-brand-primary',
    badgeClass: 'border border-text-main text-text-main',
    bgClass: 'bg-bg-light text-text-main',
  },
  info: {
    borderClass: 'border-l-4 border-l-status-info',
    badgeClass: 'border border-status-info text-status-info',
    bgClass: 'bg-bg-light text-text-main',
  },
};

export const RiskItem: React.FC<RiskItemProps> = ({
  icon,
  title,
  description,
  severity = 'critical',
}) => {
  const cfg = severityMap[severity];
  return (
    <div className={`flex items-center gap-4 p-4 border border-border rounded-lg bg-surface mb-3 ${cfg.borderClass} transition-all hover:-translate-y-0.5 hover:shadow-sm`}>
      <div className={`w-12 h-12 rounded-lg ${cfg.bgClass} flex items-center justify-center text-2xl`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-text-main mb-1">{title}</h4>
        <p className="text-[13px] text-text-muted">{description}</p>
      </div>
      <span className={`${cfg.badgeClass} bg-white px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide`}>
        {severity === 'critical' ? 'CRÍTICO' : severity === 'moderate' ? 'MODERADO' : 'INFO'}
      </span>
    </div>
  );
};

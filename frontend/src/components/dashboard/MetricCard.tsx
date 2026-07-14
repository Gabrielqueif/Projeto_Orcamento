// src/components/dashboard/MetricCard.tsx
import React from 'react';

type MetricCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  /** Optional badge element, e.g., +2 NOVOS */
  badge?: React.ReactNode;
  /** Tailwind class for border bottom color, e.g., 'border-b-brand-primary' */
  borderBottomClass?: string;
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  badge,
  borderBottomClass = 'border-b-brand-primary',
}) => {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-6 shadow-sm ${borderBottomClass} flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-border`}
    >
      <div className="flex justify-between items-center">
        <div className="w-10 h-10 rounded-lg bg-bg-light flex items-center justify-center text-xl text-text-main">
          {icon}
        </div>
        {badge && <span className="bg-[#E6F6D0] text-[#4D7E05] px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide">{badge}</span>}
      </div>
      <div>
        <div className="text-[11px] font-bold text-text-muted uppercase tracking-wide">{title}</div>
        <div className="text-[36px] font-bold text-text-main">{value}</div>
      </div>
    </div>
  );
};

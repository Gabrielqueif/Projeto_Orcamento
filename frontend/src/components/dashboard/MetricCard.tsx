// src/components/dashboard/MetricCard.tsx
import React from 'react';

type MetricCardProps = {
  title: string;
  value: string | number;
  /** Texto de apoio abaixo do valor. */
  hint?: React.ReactNode;
  /** Cartão escuro de destaque (primeiro KPI do artefato). */
  dark?: boolean;
};

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, hint, dark }) => (
  <div className={`gp-card gp-met ${dark ? 'gp-dark' : ''}`} style={{ gap: 10 }}>
    <span className="gp-ml">{title}</span>
    <span className="gp-mv" style={{ fontSize: 32 }}>{value}</span>
    {hint && <span className="gp-ms">{hint}</span>}
  </div>
);

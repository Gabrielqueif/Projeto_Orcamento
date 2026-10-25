// src/components/dashboard/RiskItem.tsx
import React from 'react';

export type RiskItemProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  severity: 'critical' | 'moderate' | 'info';
};

// Paleta "Precisa de atenção" do artefato: laranja para alerta, azul-petróleo para informação.
const severityMap = {
  critical: { bg: '#FEE2E2', fg: '#7F1D1D', ic: '#B91C1C', label: 'Crítico' },
  moderate: { bg: '#FFEDD5', fg: '#7C2D12', ic: '#9A3412', label: 'Moderado' },
  info: { bg: '#e0f5f7', fg: '#00494f', ic: '#00626b', label: 'Informação' },
};

export const RiskItem: React.FC<RiskItemProps> = ({ icon, title, description, severity = 'critical' }) => {
  const cfg = severityMap[severity];
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: cfg.bg, color: cfg.fg }}
    >
      <span
        aria-hidden="true"
        style={{ width: 36, height: 36, flex: '0 0 36px', borderRadius: 10, background: '#fff', color: cfg.ic, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
      >
        {icon}
      </span>
      <span style={{ flex: '1 1 auto', fontSize: 14, lineHeight: 1.45 }}>
        <strong>{title}</strong> <span className="gp-sr">({cfg.label})</span> {description}
      </span>
    </div>
  );
};

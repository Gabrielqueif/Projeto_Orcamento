import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
        em_elaboracao: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Em Elaboração' },
        aprovado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovado' },
        rejeitado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado' },
    };

    return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = getStatusConfig(status);

    return (
        <span className={`${config.bg} ${config.text} text-xs px-2 py-1 rounded-full font-bold`}>
            {config.label}
        </span>
    );
}

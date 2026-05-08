'use client';

import React from 'react';
import { type ItemComposicao } from '@/lib/api/composicoes';

interface BaseItemRowProps {
  item: ItemComposicao;
  onClick?: (item: ItemComposicao) => void;
  showDetails?: boolean;
  className?: string;
}

export function BaseItemRow({ item, onClick, showDetails = false, className = "" }: BaseItemRowProps) {
  const formatarMoeda = (valor: number | string | null) => {
    if (valor === null || valor === undefined) return '-';
    const numero = Number(valor);
    if (isNaN(numero)) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
  };

  return (
    <div 
      className={`bg-white border rounded-md overflow-hidden hover:bg-slate-50 transition-colors cursor-pointer ${className}`}
      onClick={() => onClick?.(item)}
    >
      <div className="p-3 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-[10px] mb-1">
            <span className="font-bold text-brand-primary uppercase">CÓD: {item.codigo_composicao}</span>
            <span className="bg-gray-100 text-gray-500 px-1 rounded uppercase font-bold">{item.fonte}</span>
            <span className="bg-slate-100 text-slate-500 px-1 rounded uppercase font-bold">{item.unidade}</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-700 line-clamp-2">{item.descricao}</h4>
        </div>
        <div className="text-right shrink-0 ml-4">
           <div className="text-sm font-bold text-slate-900">
             {item.preco ? formatarMoeda(item.preco) : "-"}
           </div>
           <div className="text-[10px] text-slate-400 font-bold uppercase">
             REF: {item.mes_referencia}
           </div>
        </div>
      </div>
    </div>
  );
}

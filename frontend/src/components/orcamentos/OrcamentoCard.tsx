import Link from 'next/link';
import { type Orcamento, downloadOrcamentoPDF } from '@/lib/api/orcamentos';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { StatusBadge } from './StatusBadge';
import { Trash2, FileDown } from 'lucide-react';
import { useState } from 'react';

interface OrcamentoCardProps {
    orcamento: Orcamento;
    onDelete: (id: string) => void;
}

export function OrcamentoCard({ orcamento, onDelete }: OrcamentoCardProps) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const blob = await downloadOrcamentoPDF(orcamento.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orcamento_${orcamento.nome.toLowerCase().replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Erro ao baixar PDF');
            console.error(error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={orcamento.nome}>
                        {orcamento.nome}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-1" title={orcamento.cliente}>
                        {orcamento.cliente}
                    </p>
                </div>
                <StatusBadge status={orcamento.status} />
            </div>

            <div className="space-y-3 mb-6 flex-grow">
                <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Data</span>
                    <span className="text-slate-700 font-medium">{formatarData(orcamento.data)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                    <span className="text-slate-500">BDI</span>
                    <span className="text-slate-700 font-medium">{orcamento.bdi ? `${orcamento.bdi}%` : '0%'}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500">Valor Total</span>
                    <span className="text-slate-800 font-bold text-lg">
                        {formatarMoeda(orcamento.valor_total)}
                    </span>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Link
                    href={`/orcamentos/${orcamento.id}`}
                    className="flex-1 text-center bg-brand-primary/10 text-brand-primary py-2 rounded hover:bg-brand-primary/20 transition-colors text-sm font-medium"
                >
                    Ver Detalhes
                </Link>
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-3 py-2 text-slate-500 hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100 disabled:opacity-50"
                    title="Baixar PDF"
                >
                    <FileDown className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onDelete(orcamento.id)}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-100"
                    title="Deletar"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}


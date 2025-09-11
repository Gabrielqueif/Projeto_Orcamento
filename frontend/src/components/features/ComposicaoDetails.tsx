// src/components/features/ComposicaoDetails.tsx
import { IComposicaoAnalitica } from "@/types/sinapi";

interface ComposicaoDetailsProps {
    composicao: IComposicaoAnalitica;
}

export function ComposicaoDetails({ composicao }: ComposicaoDetailsProps) {
    return (
        <div className="border-2 border-blue-200 rounded-lg p-6 bg-white animate-fade-in">
            <h3 className="text-xl font-bold text-blue-800 mb-2">{composicao.descricao}</h3>
            <div className="flex justify-between items-baseline mb-4">
                <p className="text-sm text-gray-600">Código: {composicao.codigo} | Unidade: {composicao.unidade}</p>
                <p className="text-lg font-semibold text-blue-900">
                    Custo Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(composicao.custoTotal)}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-black uppercase">
                    <tr>
                        <th className="px-4 py-2">Tipo</th>
                        <th className="px-4 py-2">Descrição</th>
                        <th className="px-4 py-2 text-right">Coef.</th>
                        <th className="px-4 py-2 text-right">Preço Unit.</th>
                        <th className="px-4 py-2 text-right">Custo Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {composicao.componentes.map((item) => (
                        <tr key={item.codigo} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-black">{item.tipo}</td>
                            <td className="px-4 py-2 text-black">{item.descricao}</td>
                            <td className="px-4 py-2 text-right text-black">{item.coeficiente.toFixed(4)}</td>
                            <td className="px-4 py-2 text-right text-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoUnitario)}</td>
                            <td className="px-4 py-2 text-right font-semibold text-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custoTotal)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
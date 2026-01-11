import Link from "next/link";

export default function OrcamentosPage() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
        <Link href="/orcamentos/novo">
          <button className="bg-[#26A69A] text-white px-4 py-2 rounded hover:bg-[#208f85] transition flex items-center gap-2">
            <span>+</span> Novo Orçamento
          </button>
        </Link>
      </div>

      {/* Tabela Placeholder */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 border-b">Nome do Orçamento</th>
              <th className="p-4 border-b">Cliente</th>
              <th className="p-4 border-b">Valor Total</th>
              <th className="p-4 border-b">Status</th>
              <th className="p-4 border-b text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Linha 1 */}
            <tr className="hover:bg-slate-50">
              <td className="p-4 font-medium text-slate-700">Reforma Residencial Vila A</td>
              <td className="p-4 text-slate-500">João Silva</td>
              <td className="p-4 text-slate-700">R$ 45.000,00</td>
              <td className="p-4">
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">Em Elaboração</span>
              </td>
              <td className="p-4 text-center text-blue-600 cursor-pointer hover:underline">Editar</td>
            </tr>
            {/* Linha 2 */}
            <tr className="hover:bg-slate-50">
              <td className="p-4 font-medium text-slate-700">Construção Galpão B</td>
              <td className="p-4 text-slate-500">Empresa X</td>
              <td className="p-4 text-slate-700">R$ 1.200.000,00</td>
              <td className="p-4">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Aprovado</span>
              </td>
              <td className="p-4 text-center text-blue-600 cursor-pointer hover:underline">Ver</td>
            </tr>
          </tbody>
        </table>
        
        {/* Paginação Fake */}
        <div className="p-4 border-t text-center text-sm text-slate-400">
          Mostrando 2 de 2 orçamentos
        </div>
      </div>
    </div>
  );
}
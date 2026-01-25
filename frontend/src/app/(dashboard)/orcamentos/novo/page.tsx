import { OrçamentoForm } from "@/components/orcamentos/OrcamentoForm";

export default function NewOrcamentosPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px-64px)] w-full -m-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Criar Novo Orçamento</h1>
        <OrçamentoForm mode="create" />
      </div>
    </div>
  );
}
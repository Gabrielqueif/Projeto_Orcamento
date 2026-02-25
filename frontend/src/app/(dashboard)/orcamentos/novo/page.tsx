import { OrcamentoForm } from "@/components/orcamentos/OrcamentoForm";

export default function NewOrcamentosPage() {
  return (
    <div className="flex flex-col items-center justify-center py-4 md:py-8 w-full">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto border border-slate-100">
        <h1 className="text-2xl font-bold text-brand-primary text-center mb-6">Criar Novo Orçamento</h1>
        <OrcamentoForm />
      </div>
    </div>
  );
}
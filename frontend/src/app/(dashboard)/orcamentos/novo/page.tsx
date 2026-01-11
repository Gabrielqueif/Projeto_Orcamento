import { OrçamentoForm } from "@/components/OrcamentoForm";

export default function NewOrcamentosPage() {
  return (
      <>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Criar Novo Orçamento</h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
          {/* Aqui ficará o formulário para criar um novo orçamento */}
          <OrçamentoForm />

        </div>
      </>
  )
}
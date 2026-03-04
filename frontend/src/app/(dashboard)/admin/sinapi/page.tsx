import AdminGuard from "@/components/auth/admin-guard";
import { ImportUpload } from "@/components/admin/ImportUpload";

export default function ImportAdminPage() {
    return (
        <AdminGuard>
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-8 text-brand-primary">Importação de Preços e Composições</h1>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Importar Planilhas de Referência</h2>
                    <p className="text-slate-500 mb-6">
                        Faça upload das planilhas (SINAPI ou SEINFRA) para atualizar a base de dados.
                        O sistema extrairá automaticamente a data base e processará os encargos conforme a fonte selecionada.
                    </p>

                    <ImportUpload />
                </div>
            </div>
        </AdminGuard>
    );
}


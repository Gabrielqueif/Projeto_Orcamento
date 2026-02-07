import AdminGuard from "@/components/auth/admin-guard";
import { SinapiUpload } from "@/components/admin/SinapiUpload";

export default function SinapiAdminPage() {
    return (
        <AdminGuard>
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-8 text-[#1F5F7A]">Administração SINAPI</h1>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Importar Planilhas</h2>
                    <p className="text-slate-500 mb-6">
                        Faça upload das planilhas do SINAPI (CSD, CCD, CSE) para atualizar a base de dados.
                        O sistema extrairá automaticamente a data base e o tipo de encargo do nome das planilhas.
                    </p>

                    <SinapiUpload />
                </div>
            </div>
        </AdminGuard>
    );
}


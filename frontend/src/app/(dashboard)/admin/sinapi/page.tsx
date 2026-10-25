import Link from "next/link";
import AdminGuard from "@/components/auth/admin-guard";
import { ImportUpload } from "@/components/admin/ImportUpload";

export default function ImportAdminPage() {
    return (
        <AdminGuard>
            <div>
                <nav aria-label="Trilha" className="gp-crumb">
                    <Link href="/bases">Bases de dados</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>Importação oficial</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    <h1 className="gp-h1" style={{ margin: 0 }}>Importar SINAPI e SEINFRA</h1>
                    <span className="gp-bg" style={{ background: "#9fd300", color: "#001b3d" }}>Só administradores</span>
                </div>
                <p className="gp-sub">Os dados importados ficam disponíveis para todas as contas.</p>
            </div>
            <ImportUpload />
        </AdminGuard>
    );
}

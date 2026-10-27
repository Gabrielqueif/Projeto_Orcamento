import Link from "next/link";
import AdminGuard from "@/components/auth/admin-guard";
import { ImportUpload } from "@/components/admin/ImportUpload";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ImportAdminPage() {
    return (
        <AdminGuard>
            <PageHeader
                back="/mais"
                crumb={<><Link href="/bases">Bases de dados</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>Importação oficial</span></>}
                eyebrow="Administração"
                title="Importar SINAPI e SEINFRA"
                badge={<span className="gp-bg" style={{ background: "#9fd300", color: "#001b3d" }}>Só administradores</span>}
                subtitle="Os dados importados ficam disponíveis para todas as contas."
            />
            <ImportUpload />
        </AdminGuard>
    );
}

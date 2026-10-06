import { redirect } from "next/navigation";

// O módulo de prazo agora vive em /prazo/[id]; mantém links antigos funcionando.
export default async function PrazoRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/prazo/${id}`);
}

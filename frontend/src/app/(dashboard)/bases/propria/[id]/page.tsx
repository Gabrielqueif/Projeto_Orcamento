import { BasePropriaView } from "@/components/bases-proprias/BasePropriaView";

export default async function BasePropriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BasePropriaView baseId={id} />;
}

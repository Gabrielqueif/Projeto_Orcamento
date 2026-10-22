import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-color-bg-soft p-6">
      <div className="flex flex-col items-center text-center max-w-[420px]">
        <div className="w-14 h-14 rounded-full bg-color-bg-subtle flex items-center justify-center mb-4">
          <MagnifyingGlass size={28} className="text-color-text-muted" />
        </div>
        <h1 className="text-[22px] font-bold text-color-heading mb-2">
          Página não encontrada
        </h1>
        <p className="text-[13px] text-color-text-muted mb-6">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-color-primary-dark text-white rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all no-underline"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

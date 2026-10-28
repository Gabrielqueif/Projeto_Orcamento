"use client";

import { Suspense, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { buscar, type ItemBusca, type ResultadoBusca } from "@/lib/api/busca";

const TAMANHO_MINIMO = 2;
const ATRASO_DEBOUNCE_MS = 300;

type Consulta = { termo: string; resultado?: ResultadoBusca; erro?: boolean };

const rotuloGrupo: CSSProperties = {
  margin: 0,
  padding: "0 6px",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "#475569",
};

function Grupo({ id, titulo, itens }: { id: string; titulo: string; itens: ItemBusca[] }) {
  if (itens.length === 0) return null;
  return (
    <section aria-labelledby={id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 id={id} style={rotuloGrupo}>
        {titulo}
      </h2>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {itens.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="gp-card"
              style={{ display: "flex", flexDirection: "column", gap: 3, padding: 16, borderRadius: 18, color: "#001b3d", textDecoration: "none" }}
            >
              <strong style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</strong>
              {item.subtitulo && <span style={{ fontSize: 14, color: "#475569" }}>{item.subtitulo}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BuscaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qUrl = searchParams.get("q") ?? "";

  const [termo, setTermo] = useState(qUrl);
  const [termoBuscado, setTermoBuscado] = useState(qUrl.trim());
  const [consulta, setConsulta] = useState<Consulta | null>(null);

  // Debounce: depois de uma pausa na digitação, atualiza o termo buscado e a URL.
  useEffect(() => {
    const timer = setTimeout(() => {
      const limpo = termo.trim();
      setTermoBuscado(limpo);
      if (limpo !== qUrl) {
        router.replace(limpo ? `/busca?q=${encodeURIComponent(limpo)}` : "/busca");
      }
    }, ATRASO_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [termo, qUrl, router]);

  // Consulta à API só com termo de pelo menos dois caracteres.
  useEffect(() => {
    if (termoBuscado.length < TAMANHO_MINIMO) return;
    let cancelado = false;
    buscar(termoBuscado)
      .then((resultado) => {
        if (!cancelado) setConsulta({ termo: termoBuscado, resultado });
      })
      .catch(() => {
        if (!cancelado) setConsulta({ termo: termoBuscado, erro: true });
      });
    return () => {
      cancelado = true;
    };
  }, [termoBuscado]);

  const campo = (
    <div role="search" className="gp-srch">
      <MagnifyingGlass size={18} color="#475569" weight="bold" aria-hidden="true" />
      <label htmlFor="busca-pagina" className="gp-sr">
        Buscar obras, orçamentos e equipe
      </label>
      <input
        id="busca-pagina"
        type="search"
        placeholder="Obras, orçamentos ou membros da equipe"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        style={{ fontSize: 16 }}
      />
    </div>
  );

  let corpo: ReactNode;
  if (termoBuscado.length < TAMANHO_MINIMO) {
    corpo = <p className="gp-hint">Digite pelo menos 2 caracteres para buscar em obras, orçamentos e equipe.</p>;
  } else if (!consulta || consulta.termo !== termoBuscado) {
    corpo = (
      <div role="status" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="gp-sr">Buscando…</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="gp-sk" style={{ height: 64, borderRadius: 18 }} />
        ))}
      </div>
    );
  } else if (consulta.erro) {
    corpo = (
      <p role="alert" className="gp-card" style={{ padding: 16, color: "#B91C1C", margin: 0 }}>
        Não foi possível buscar agora. Tente novamente.
      </p>
    );
  } else if (consulta.resultado) {
    const { obras, orcamentos, membros } = consulta.resultado;
    const nada = obras.length + orcamentos.length + membros.length === 0;
    corpo = nada ? (
      <p className="gp-hint" style={{ margin: 0 }}>
        Nada encontrado para “{termoBuscado}”.
      </p>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Grupo id="busca-obras" titulo="Obras" itens={obras} />
        <Grupo id="busca-orcamentos" titulo="Orçamentos" itens={orcamentos} />
        <Grupo id="busca-equipe" titulo="Equipe" itens={membros} />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Busca" back="/">
        {campo}
      </PageHeader>
      {corpo}
    </>
  );
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<PageHeader title="Busca" back="/" />}>
      <BuscaConteudo />
    </Suspense>
  );
}

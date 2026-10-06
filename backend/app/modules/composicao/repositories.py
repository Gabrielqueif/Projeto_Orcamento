import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

TABELA_COMPOSICOES = "composicao"
TABELA_COMPOSICOES_ESTADOS = "composicao_estados"
TABELA_COMPOSICAO_ITENS = "composicao_itens"
VIEW_INSUMOS = "insumo_busca"
TABELA_INSUMO_PRECOS = "insumo_precos"
UFS = [
    "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms", "mg", "pa",
    "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to",
]  # fmt: skip


class ItemRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def upsert_batch_composicoes(self, dados: List[Dict[str, Any]]) -> int:
        if not dados:
            return 0
        total = 0
        for i in range(0, len(dados), 1000):
            try:
                lote = []
                for d in dados[i : i + 1000]:
                    d_copy = d.copy()
                    d_copy.pop("grupo", None)
                    lote.append(d_copy)

                r = (
                    self.supabase.table(TABELA_COMPOSICOES)
                    .upsert(lote, on_conflict="codigo_composicao,mes_referencia,fonte")
                    .execute()
                )
                if r.data:
                    total += len(r.data)
            except Exception as e:
                logger.error(f"Erro lote {TABELA_COMPOSICOES}: {e}")
        return total

    def upsert_batch_estados(self, dados: List[Dict[str, Any]]) -> int:
        if not dados:
            return 0
        total = 0
        for i in range(0, len(dados), 1000):
            try:
                r = (
                    self.supabase.table(TABELA_COMPOSICOES_ESTADOS)
                    .upsert(dados[i : i + 1000], on_conflict="codigo_composicao,mes_referencia,tipo_composicao,fonte")
                    .execute()
                )
                if r.data:
                    total += len(r.data)
            except Exception as e:
                logger.error(f"Erro lote {TABELA_COMPOSICOES_ESTADOS}: {e}")
        return total

    def listar(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("*").limit(limit).execute().data or []

    def buscar_por_codigo(self, codigo: str, fonte: str = "SINAPI") -> List[Dict[str, Any]]:
        return (
            self.supabase.table(TABELA_COMPOSICOES)
            .select("*")
            .eq("codigo_composicao", codigo)
            .eq("fonte", fonte)
            .execute()
            .data
        )

    def buscar_por_descricao(self, termo: str, fonte: str = "SINAPI", limit: int = 50) -> List[Dict[str, Any]]:
        termo_limpo = termo.strip()
        if not termo_limpo:
            return []

        palavras = termo_limpo.split()
        query_formatada = " & ".join([f"'{p}'" for p in palavras])
        return (
            self.supabase.table(TABELA_COMPOSICOES)
            .select("*")
            .limit(limit)
            .eq("fonte", fonte)
            .text_search("descricao", query_formatada, options={"config": "portuguese", "type": "plain"})
            .execute()
            .data
        )

    def upsert_batch_precos_insumos(self, dados: List[Dict[str, Any]]) -> int:
        if not dados:
            return 0
        total = 0
        for i in range(0, len(dados), 500):
            try:
                r = (
                    self.supabase.table(TABELA_INSUMO_PRECOS)
                    .upsert(dados[i : i + 500], on_conflict="codigo_insumo,mes_referencia,tipo_composicao,fonte")
                    .execute()
                )
                if r.data:
                    total += len(r.data)
            except Exception as e:
                logger.error(f"Erro lote {TABELA_INSUMO_PRECOS}: {e}")
        return total

    def buscar_insumos(
        self, termo: str, fonte: str = "SINAPI", tipo: str = "Sem Desoneração", limit: int = 200
    ) -> List[Dict[str, Any]]:
        termo_limpo = termo.strip()
        if not termo_limpo:
            return []

        query = self.supabase.table(VIEW_INSUMOS).select("*").eq("fonte", fonte)
        if termo_limpo.isdigit():
            query = query.eq("codigo_insumo", termo_limpo)
        else:
            for palavra in termo_limpo.split():
                query = query.ilike("descricao", f"%{palavra}%")
        rows = query.order("descricao").limit(limit * 2).execute().data or []

        # Mesmo insumo em vários meses de referência: mantém só o mês mais recente.
        def chave_mes(r):
            mes, _, ano = (r.get("mes_referencia") or "").partition("/")
            return (ano, mes)

        unicos: Dict[str, Dict[str, Any]] = {}
        for r in rows:
            atual = unicos.get(r["codigo_insumo"])
            if atual is None or chave_mes(r) > chave_mes(atual):
                unicos[r["codigo_insumo"]] = r
        resultado = list(unicos.values())[:limit]
        if not resultado:
            return []

        precos = (
            self.supabase.table(TABELA_INSUMO_PRECOS)
            .select("*")
            .eq("fonte", fonte)
            .eq("tipo_composicao", tipo)
            .in_("codigo_insumo", [r["codigo_insumo"] for r in resultado])
            .execute()
            .data
            or []
        )
        por_codigo: Dict[str, Dict[str, Any]] = {}
        for p in precos:
            atual = por_codigo.get(p["codigo_insumo"])
            if atual is None or chave_mes(p) > chave_mes(atual):
                por_codigo[p["codigo_insumo"]] = p

        for r in resultado:
            p = por_codigo.get(r["codigo_insumo"])
            r["precos"] = {uf: p.get(uf) for uf in UFS if p.get(uf) is not None} if p else {}
            if p:
                r["mes_preco"] = p["mes_referencia"]
        return resultado

    def listar_estados_por_item(
        self, codigo_composicao: str, mes_referencia: str, fonte: str = "SINAPI"
    ) -> List[Dict[str, Any]]:
        return (
            self.supabase.table(TABELA_COMPOSICOES_ESTADOS)
            .select("*")
            .eq("codigo_composicao", codigo_composicao)
            .eq("mes_referencia", mes_referencia)
            .eq("fonte", fonte)
            .execute()
            .data
            or []
        )

    def listar_bases_disponiveis(self) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("mes_referencia,fonte").execute().data or []

    def buscar_preco(
        self, codigo_composicao: str, estado: str, mes_referencia: str, tipo_composicao: str, fonte: str = "SINAPI"
    ) -> Optional[float]:
        if not mes_referencia:
            return None

        if "," in mes_referencia:
            meses = [m.strip() for m in mes_referencia.split(",") if m.strip()]
            for mes in meses:
                preco = self.buscar_preco(codigo_composicao, estado, mes, tipo_composicao, fonte)
                if preco is not None:
                    return preco
            return None

        try:
            logger.info(
                f"[buscar_preco] Buscando: codigo={codigo_composicao!r}, estado={estado!r}, "
                f"mes_referencia={mes_referencia!r}, tipo_composicao={tipo_composicao!r}, fonte={fonte!r}"
            )

            r = (
                self.supabase.table(TABELA_COMPOSICOES_ESTADOS)
                .select("*")
                .eq("codigo_composicao", codigo_composicao)
                .eq("mes_referencia", mes_referencia)
                .eq("tipo_composicao", tipo_composicao)
                .eq("fonte", fonte)
                .execute()
            )

            if not r.data:
                diag = (
                    self.supabase.table(TABELA_COMPOSICOES_ESTADOS)
                    .select("codigo_composicao,mes_referencia,tipo_composicao,fonte")
                    .eq("codigo_composicao", codigo_composicao)
                    .eq("fonte", fonte)
                    .limit(5)
                    .execute()
                )
                logger.warning(
                    f"[buscar_preco] Nenhum registro encontrado para busca exata. "
                    f"Registros existentes no banco para codigo={codigo_composicao!r}, fonte={fonte!r}: {diag.data}"
                )

                r2 = (
                    self.supabase.table(TABELA_COMPOSICOES_ESTADOS)
                    .select("*")
                    .eq("codigo_composicao", codigo_composicao)
                    .eq("mes_referencia", mes_referencia)
                    .ilike("tipo_composicao", tipo_composicao)
                    .eq("fonte", fonte)
                    .limit(1)
                    .execute()
                )

                if r2.data:
                    logger.info(
                        f"[buscar_preco] Fallback ilike encontrou: tipo_composicao real={r2.data[0].get('tipo_composicao')!r}"
                    )
                    r = r2
                else:
                    r3 = (
                        self.supabase.table(TABELA_COMPOSICOES_ESTADOS)
                        .select("*")
                        .eq("codigo_composicao", codigo_composicao)
                        .ilike("tipo_composicao", tipo_composicao)
                        .eq("fonte", fonte)
                        .execute()
                    )

                    if r3.data:

                        def sort_key(d):
                            m_str = d.get("mes_referencia", "00/0000")
                            parts = m_str.split("/")
                            if len(parts) == 2:
                                return (parts[1], parts[0])
                            return ("0000", "00")

                        sorted_data = sorted(r3.data, key=sort_key, reverse=True)
                        logger.warning(
                            f"[buscar_preco] Fallback de mês: {mes_referencia!r} não encontrado. "
                            f"Usando o mais recente: {sorted_data[0].get('mes_referencia')!r}"
                        )
                        r = r3
                        r.data = [sorted_data[0]]
                    else:
                        logger.error(
                            f"[buscar_preco] Falha total: Composição {codigo_composicao} não encontrada em NENHUM mês para fonte {fonte} e tipo {tipo_composicao}."
                        )
                        return None

            dados = r.data[0]
            preco = dados.get(estado.lower())
            logger.info(f"[buscar_preco] Preço encontrado para estado={estado.lower()!r}: {preco}")
            return float(preco) if preco is not None else None
        except Exception as e:
            logger.error(f"[buscar_preco] Exceção: {e}")
            return None

    def buscar_precos_lote(
        self, codigos: List[str], estado: str, mes_referencia: str, tipo_composicao: str, fonte: str = "SINAPI"
    ) -> Dict[str, float]:
        """Preço por código para o estado. Usa o mês pedido; na falta dele, o mais recente (mesmo critério de buscar_preco)."""
        if not codigos or not estado:
            return {}

        try:
            query = (
                self.supabase.table(TABELA_COMPOSICOES_ESTADOS)
                .select("*")
                .in_("codigo_composicao", codigos)
                .eq("fonte", fonte)
            )
            if tipo_composicao:
                query = query.ilike("tipo_composicao", tipo_composicao)
            linhas = query.execute().data or []
        except Exception as e:
            logger.error(f"[buscar_precos_lote] Exceção: {e}")
            return {}

        meses = [m.strip() for m in (mes_referencia or "").split(",") if m.strip()]

        def recencia(linha: Dict[str, Any]):
            partes = (linha.get("mes_referencia") or "00/0000").split("/")
            return (partes[1], partes[0]) if len(partes) == 2 else ("0000", "00")

        por_codigo: Dict[str, List[Dict[str, Any]]] = {}
        for linha in linhas:
            if linha.get(estado.lower()) is not None:
                por_codigo.setdefault(linha["codigo_composicao"], []).append(linha)

        precos: Dict[str, float] = {}
        for codigo, opcoes in por_codigo.items():
            escolhida = next((o for m in meses for o in opcoes if o.get("mes_referencia") == m), None)
            if escolhida is None:
                escolhida = max(opcoes, key=recencia)
            precos[codigo] = float(escolhida[estado.lower()])
        return precos

    def upsert_batch_composicao_itens(self, dados: List[Dict[str, Any]]) -> int:
        if not dados:
            return 0
        total = 0
        for i in range(0, len(dados), 500):
            try:
                r = (
                    self.supabase.table(TABELA_COMPOSICAO_ITENS)
                    .upsert(dados[i : i + 500], on_conflict="codigo_pai,codigo_filho,mes_referencia,fonte")
                    .execute()
                )
                if r.data:
                    total += len(r.data)
            except Exception as e:
                logger.error(f"Erro lote {TABELA_COMPOSICAO_ITENS}: {e}")
        return total

    def buscar_filhos_composicao(
        self, codigo_pai: str, mes_referencia: str, fonte: str = "SINAPI"
    ) -> List[Dict[str, Any]]:
        try:
            r = (
                self.supabase.table(TABELA_COMPOSICAO_ITENS)
                .select("*")
                .eq("codigo_pai", codigo_pai)
                .eq("mes_referencia", mes_referencia)
                .eq("fonte", fonte)
                .execute()
            )
            return r.data or []
        except Exception as e:
            logger.error(f"Erro ao buscar filhos de {codigo_pai}: {e}")
            return []

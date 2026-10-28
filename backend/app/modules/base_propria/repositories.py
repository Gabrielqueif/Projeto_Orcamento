import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

from core.busca import sanitizar_termo

logger = logging.getLogger("projeto_orcamento")

TABELA_BASES = "bases_proprias"
TABELA_INSUMOS = "base_propria_insumos"
TABELA_COMPOSICOES = "base_propria_composicoes"
TABELA_ITENS = "base_propria_composicao_itens"
TABELA_INSUMO_PRECOS = "insumo_precos"

COLUNAS_BASE = "id, nome, descricao, uf, data_referencia, created_at, updated_at"
COLUNAS_INSUMO = "id, base_id, codigo, descricao, unidade, tipo, preco"
COLUNAS_COMPOSICAO = "id, base_id, codigo, descricao, unidade, grupo"
COLUNAS_ITEM = "id, composicao_id, ref_fonte, ref_tipo, ref_codigo, coeficiente"

TAMANHO_PAGINA = 1000
TAMANHO_LOTE = 500
TAMANHO_IN = 100


def _agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def _termo_seguro(termo: str) -> str:
    # Vai para um filtro PostgREST: vírgulas, parênteses e curingas mudariam o significado do filtro.
    return " ".join(re.sub(r"[,()%_*\\]", " ", termo).split())


def _chave_mes(linha: Dict[str, Any]):
    mes, _, ano = (linha.get("mes_referencia") or "").partition("/")
    return (ano, mes)


def _em_blocos(valores: List[Any], tamanho: int) -> Iterable[List[Any]]:
    for i in range(0, len(valores), tamanho):
        yield valores[i : i + tamanho]


class BasePropriaRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def _todos(self, montar_consulta) -> List[Dict[str, Any]]:
        """Pagina além do limite de 1000 linhas por resposta do Supabase."""
        linhas: List[Dict[str, Any]] = []
        inicio = 0
        while True:
            bloco = montar_consulta().range(inicio, inicio + TAMANHO_PAGINA - 1).execute().data or []
            linhas.extend(bloco)
            if len(bloco) < TAMANHO_PAGINA:
                return linhas
            inicio += TAMANHO_PAGINA

    # --- Bases ---------------------------------------------------------------

    def listar_bases(self, user_id: str) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_BASES)
            .select(COLUNAS_BASE)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return resultado.data or []

    def buscar_base(self, base_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        # Sempre filtrado pelo dono, mesmo depois do enforce_ownership da rota.
        resultado = (
            self.supabase.table(TABELA_BASES).select(COLUNAS_BASE).eq("id", base_id).eq("user_id", user_id).execute()
        )
        return resultado.data[0] if resultado.data else None

    def criar_base(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = self.supabase.table(TABELA_BASES).insert(dados).execute()
        return resultado.data[0]

    def atualizar_base(self, base_id: str, user_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_BASES)
            .update({**dados, "updated_at": _agora()})
            .eq("id", base_id)
            .eq("user_id", user_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def deletar_base(self, base_id: str, user_id: str) -> None:
        self.supabase.table(TABELA_BASES).delete().eq("id", base_id).eq("user_id", user_id).execute()

    # --- Insumos -------------------------------------------------------------

    def listar_insumos(self, base_id: str, busca: Optional[str], limite: int, offset: int) -> List[Dict[str, Any]]:
        consulta = self.supabase.table(TABELA_INSUMOS).select(COLUNAS_INSUMO).eq("base_id", base_id)
        termo = _termo_seguro(sanitizar_termo(busca or ""))
        if termo:
            consulta = consulta.or_(f"descricao.ilike.%{termo}%,codigo.ilike.%{termo}%")
        resultado = consulta.order("codigo").range(offset, offset + limite - 1).execute()
        return resultado.data or []

    def todos_insumos(self, base_id: str) -> List[Dict[str, Any]]:
        return self._todos(
            lambda: self.supabase.table(TABELA_INSUMOS).select(COLUNAS_INSUMO).eq("base_id", base_id).order("codigo")
        )

    def buscar_insumo(self, base_id: str, insumo_id: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_INSUMOS)
            .select(COLUNAS_INSUMO)
            .eq("id", insumo_id)
            .eq("base_id", base_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def buscar_insumo_por_codigo(self, base_id: str, codigo: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_INSUMOS)
            .select(COLUNAS_INSUMO)
            .eq("base_id", base_id)
            .eq("codigo", codigo)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def criar_insumo(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        return self.supabase.table(TABELA_INSUMOS).insert(dados).execute().data[0]

    def atualizar_insumo(self, base_id: str, insumo_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_INSUMOS)
            .update({**dados, "updated_at": _agora()})
            .eq("id", insumo_id)
            .eq("base_id", base_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def deletar_insumo(self, base_id: str, insumo_id: str) -> None:
        self.supabase.table(TABELA_INSUMOS).delete().eq("id", insumo_id).eq("base_id", base_id).execute()

    def upsert_insumos(self, dados: List[Dict[str, Any]]) -> int:
        for bloco in _em_blocos(dados, TAMANHO_LOTE):
            self.supabase.table(TABELA_INSUMOS).upsert(bloco, on_conflict="base_id,codigo").execute()
        return len(dados)

    # --- Composições ---------------------------------------------------------

    def listar_composicoes(self, base_id: str, busca: Optional[str], limite: int, offset: int) -> List[Dict[str, Any]]:
        consulta = self.supabase.table(TABELA_COMPOSICOES).select(COLUNAS_COMPOSICAO).eq("base_id", base_id)
        termo = _termo_seguro(sanitizar_termo(busca or ""))
        if termo:
            consulta = consulta.or_(f"descricao.ilike.%{termo}%,codigo.ilike.%{termo}%")
        resultado = consulta.order("codigo").range(offset, offset + limite - 1).execute()
        return resultado.data or []

    def todas_composicoes(self, base_id: str) -> List[Dict[str, Any]]:
        return self._todos(
            lambda: (
                self.supabase.table(TABELA_COMPOSICOES)
                .select(COLUNAS_COMPOSICAO)
                .eq("base_id", base_id)
                .order("codigo")
            )
        )

    def buscar_composicao(self, base_id: str, composicao_id: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_COMPOSICOES)
            .select(COLUNAS_COMPOSICAO)
            .eq("id", composicao_id)
            .eq("base_id", base_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def buscar_composicao_por_codigo(self, base_id: str, codigo: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_COMPOSICOES)
            .select(COLUNAS_COMPOSICAO)
            .eq("base_id", base_id)
            .eq("codigo", codigo)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def criar_composicao(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        return self.supabase.table(TABELA_COMPOSICOES).insert(dados).execute().data[0]

    def atualizar_composicao(self, base_id: str, composicao_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_COMPOSICOES)
            .update({**dados, "updated_at": _agora()})
            .eq("id", composicao_id)
            .eq("base_id", base_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def deletar_composicao(self, base_id: str, composicao_id: str) -> None:
        self.supabase.table(TABELA_COMPOSICOES).delete().eq("id", composicao_id).eq("base_id", base_id).execute()

    def upsert_composicoes(self, dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        salvas: List[Dict[str, Any]] = []
        for bloco in _em_blocos(dados, TAMANHO_LOTE):
            resultado = self.supabase.table(TABELA_COMPOSICOES).upsert(bloco, on_conflict="base_id,codigo").execute()
            salvas.extend(resultado.data or [])
        return salvas

    # --- Itens de composição ---------------------------------------------------

    def listar_itens(self, composicao_id: str) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_ITENS)
            .select(COLUNAS_ITEM)
            .eq("composicao_id", composicao_id)
            .order("created_at")
            .execute()
        )
        return resultado.data or []

    def itens_da_base(self, composicao_ids: List[str]) -> List[Dict[str, Any]]:
        itens: List[Dict[str, Any]] = []
        for bloco in _em_blocos(composicao_ids, TAMANHO_IN):
            itens.extend(
                self._todos(
                    lambda bloco=bloco: (
                        self.supabase.table(TABELA_ITENS)
                        .select(COLUNAS_ITEM)
                        .in_("composicao_id", bloco)
                        .order("created_at")
                    )
                )
            )
        return itens

    def buscar_item(self, composicao_id: str, item_id: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_ITENS)
            .select(COLUNAS_ITEM)
            .eq("id", item_id)
            .eq("composicao_id", composicao_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def criar_itens(self, dados: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        criados: List[Dict[str, Any]] = []
        for bloco in _em_blocos(dados, TAMANHO_LOTE):
            criados.extend(self.supabase.table(TABELA_ITENS).insert(bloco).execute().data or [])
        return criados

    def atualizar_item(self, composicao_id: str, item_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_ITENS)
            .update(dados)
            .eq("id", item_id)
            .eq("composicao_id", composicao_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def deletar_item(self, composicao_id: str, item_id: str) -> None:
        self.supabase.table(TABELA_ITENS).delete().eq("id", item_id).eq("composicao_id", composicao_id).execute()

    def deletar_itens_das_composicoes(self, composicao_ids: List[str]) -> None:
        for bloco in _em_blocos(composicao_ids, TAMANHO_IN):
            self.supabase.table(TABELA_ITENS).delete().in_("composicao_id", bloco).execute()

    # --- Preços oficiais -----------------------------------------------------

    def buscar_preco_insumo_oficial(self, codigo: str, uf: str, mes: str, tipo: str, fonte: str) -> Optional[float]:
        """
        Preço de um insumo SINAPI/SEINFRA na UF. Usa o mês pedido; na falta dele, o mais recente
        (mesmo critério de ItemRepository.buscar_preco para composições).
        """
        try:
            linhas = (
                self.supabase.table(TABELA_INSUMO_PRECOS)
                .select("*")
                .eq("codigo_insumo", codigo)
                .eq("fonte", fonte)
                .ilike("tipo_composicao", tipo)
                .execute()
                .data
                or []
            )
        except Exception as e:
            logger.error(f"[base_propria] Falha ao buscar preço do insumo {fonte}/{codigo}: {e}")
            return None

        coluna = uf.lower()
        com_preco = [linha for linha in linhas if linha.get(coluna) is not None]
        if not com_preco:
            return None
        meses = [m.strip() for m in (mes or "").split(",") if m.strip()]
        escolhida = next((linha for m in meses for linha in com_preco if linha.get("mes_referencia") == m), None)
        if escolhida is None:
            escolhida = max(com_preco, key=_chave_mes)
        return float(escolhida[coluna])

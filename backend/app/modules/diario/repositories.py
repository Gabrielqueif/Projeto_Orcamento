import logging
from datetime import date
from typing import Any, Dict, List, Optional

from core.obras import resolver_obra_id

logger = logging.getLogger("projeto_orcamento")

TABELA_DIARIOS = "diarios_obra"
TABELA_FOTOS = "diario_fotos"
TABELA_SERVICOS = "diario_servicos"
BUCKET_FOTOS = "diario-fotos"
VALIDADE_URL_SEGUNDOS = 3600

COLUNAS_DIARIO = (
    "id, obra_id, data, titulo, atividades, ocorrencias, clima, temperatura, "
    "equipe_presente, responsavel, status, created_at, updated_at"
)
COLUNAS_ITEM = "id, orcamento_id, etapa_id, codigo_composicao, descricao, unidade, quantidade, preco_total"
COLUNAS_FOTO = "id, diario_id, caminho, legenda, created_at"
COLUNAS_OBRA = (
    "id, orcamento_id, cliente, escopo, endereco, data_inicio_real, "
    "prazo_estimado_dias, engenheiro_responsavel_id, status"
)


class DiarioRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def resolver_obra(self, obra_id: str) -> Optional[str]:
        return resolver_obra_id(self.supabase, obra_id)

    # --- Diários -------------------------------------------------------------

    def listar(self, obra_id: str, limite: int) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_DIARIOS)
            .select(COLUNAS_DIARIO)
            .eq("obra_id", obra_id)
            .order("data", desc=True)
            .limit(limite)
            .execute()
        )
        return resultado.data or []

    def buscar(self, diario_id: str, obra_id: str) -> Optional[Dict[str, Any]]:
        # Sempre filtrado pela obra: o dono da obra A não alcança diários da obra B.
        resultado = (
            self.supabase.table(TABELA_DIARIOS)
            .select(COLUNAS_DIARIO)
            .eq("id", diario_id)
            .eq("obra_id", obra_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def buscar_por_data(self, obra_id: str, data: str) -> Optional[Dict[str, Any]]:
        resultado = self.supabase.table(TABELA_DIARIOS).select("id").eq("obra_id", obra_id).eq("data", data).execute()
        return resultado.data[0] if resultado.data else None

    def criar(self, obra_id: str, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = self.supabase.table(TABELA_DIARIOS).insert({**dados, "obra_id": obra_id}).execute()
        if not resultado.data:
            raise Exception("Falha ao criar diário de obra")
        return resultado.data[0]

    def atualizar(self, diario_id: str, obra_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_DIARIOS).update(dados).eq("id", diario_id).eq("obra_id", obra_id).execute()
        )
        return resultado.data[0] if resultado.data else None

    def deletar(self, diario_id: str, obra_id: str) -> bool:
        resultado = self.supabase.table(TABELA_DIARIOS).delete().eq("id", diario_id).eq("obra_id", obra_id).execute()
        return bool(resultado.data)

    # --- Fotos ---------------------------------------------------------------

    def listar_fotos(self, diario_ids: List[str]) -> List[Dict[str, Any]]:
        if not diario_ids:
            return []
        resultado = (
            self.supabase.table(TABELA_FOTOS)
            .select(COLUNAS_FOTO)
            .in_("diario_id", diario_ids)
            .order("created_at")
            .execute()
        )
        return resultado.data or []

    def buscar_foto(self, foto_id: str, diario_id: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_FOTOS)
            .select(COLUNAS_FOTO)
            .eq("id", foto_id)
            .eq("diario_id", diario_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def criar_foto(self, diario_id: str, caminho: str, legenda: Optional[str]) -> Dict[str, Any]:
        resultado = (
            self.supabase.table(TABELA_FOTOS)
            .insert({"diario_id": diario_id, "caminho": caminho, "legenda": legenda})
            .execute()
        )
        if not resultado.data:
            raise Exception("Falha ao registrar foto do diário")
        return resultado.data[0]

    def deletar_foto(self, foto_id: str, diario_id: str) -> bool:
        resultado = self.supabase.table(TABELA_FOTOS).delete().eq("id", foto_id).eq("diario_id", diario_id).execute()
        return bool(resultado.data)

    # --- Storage -------------------------------------------------------------

    def enviar_arquivo(self, caminho: str, conteudo: bytes, content_type: str) -> None:
        self.supabase.storage.from_(BUCKET_FOTOS).upload(caminho, conteudo, {"content-type": content_type})

    def remover_arquivos(self, caminhos: List[str]) -> None:
        if not caminhos:
            return
        try:
            self.supabase.storage.from_(BUCKET_FOTOS).remove(caminhos)
        except Exception as e:
            # O registro já foi tratado; um arquivo órfão não deve derrubar a operação.
            logger.error(f"Falha ao remover arquivos do bucket {BUCKET_FOTOS}: {e}")

    def assinar_urls(self, caminhos: List[str]) -> Dict[str, Optional[str]]:
        if not caminhos:
            return {}
        try:
            itens = self.supabase.storage.from_(BUCKET_FOTOS).create_signed_urls(caminhos, VALIDADE_URL_SEGUNDOS)
        except Exception as e:
            logger.error(f"Falha ao assinar URLs de fotos do diário: {e}")
            return {c: None for c in caminhos}
        return {i["path"]: (None if i.get("error") else i.get("signedURL")) for i in itens}

    # --- Contexto da obra (cabeçalho e resumo) -------------------------------

    def buscar_obra(self, obra_id: str) -> Optional[Dict[str, Any]]:
        resultado = self.supabase.table("obras").select(COLUNAS_OBRA).eq("id", obra_id).execute()
        return resultado.data[0] if resultado.data else None

    def listar_obras_do_usuario(self, user_id: str) -> List[Dict[str, Any]]:
        resultado = self.supabase.table("obras").select(COLUNAS_OBRA).eq("user_id", user_id).execute()
        return resultado.data or []

    def nomes_de_orcamentos(self, orcamento_ids: List[str]) -> Dict[str, str]:
        if not orcamento_ids:
            return {}
        resultado = self.supabase.table("orcamentos").select("id, nome").in_("id", orcamento_ids).execute()
        return {r["id"]: r["nome"] for r in (resultado.data or []) if r.get("nome")}

    def nomes_de_membros(self, membro_ids: List[str]) -> Dict[str, str]:
        if not membro_ids:
            return {}
        resultado = self.supabase.table("membros_equipe").select("id, nome").in_("id", membro_ids).execute()
        return {r["id"]: r["nome"] for r in (resultado.data or []) if r.get("nome")}

    def etapas_do_orcamento(self, orcamento_id: str) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table("orcamento_etapas")
            .select("id, nome, parent_id, progresso")
            .eq("orcamento_id", orcamento_id)
            .order("ordem")
            .execute()
        )
        return resultado.data or []

    def itens_por_ids(self, item_ids: List[str]) -> List[Dict[str, Any]]:
        if not item_ids:
            return []
        resultado = self.supabase.table("orcamento_itens").select(COLUNAS_ITEM).in_("id", item_ids).execute()
        return resultado.data or []

    def itens_do_orcamento(self, orcamento_id: str) -> List[Dict[str, Any]]:
        resultado = self.supabase.table("orcamento_itens").select(COLUNAS_ITEM).eq("orcamento_id", orcamento_id).execute()
        return resultado.data or []

    def servicos_dos_diarios(self, diario_ids: List[str]) -> List[Dict[str, Any]]:
        if not diario_ids:
            return []
        resultado = (
            self.supabase.table(TABELA_SERVICOS)
            .select("diario_id, item_id, quantidade")
            .in_("diario_id", diario_ids)
            .execute()
        )
        return resultado.data or []

    def servicos_da_obra(self, obra_id: str) -> List[Dict[str, Any]]:
        """Todos os serviços lançados nos diários da obra, com a data do diário."""
        resultado = (
            self.supabase.table(TABELA_SERVICOS)
            .select("diario_id, item_id, quantidade, diarios_obra!inner(data, obra_id)")
            .eq("diarios_obra.obra_id", obra_id)
            .execute()
        )
        return [
            {
                "diario_id": r["diario_id"],
                "item_id": r["item_id"],
                "quantidade": float(r["quantidade"]),
                "data": r["diarios_obra"]["data"],
            }
            for r in (resultado.data or [])
        ]

    def substituir_servicos(self, diario_id: str, servicos: List[Dict[str, Any]]) -> None:
        self.supabase.table(TABELA_SERVICOS).delete().eq("diario_id", diario_id).execute()
        if servicos:
            self.supabase.table(TABELA_SERVICOS).insert(
                [{"diario_id": diario_id, "item_id": s["item_id"], "quantidade": s["quantidade"]} for s in servicos]
            ).execute()

    def diarios_recentes(self, obra_ids: List[str], desde: date) -> List[Dict[str, Any]]:
        if not obra_ids:
            return []
        resultado = (
            self.supabase.table(TABELA_DIARIOS)
            .select("obra_id, data, clima, status")
            .in_("obra_id", obra_ids)
            .gte("data", desde.isoformat())
            .order("data", desc=True)
            .execute()
        )
        return resultado.data or []

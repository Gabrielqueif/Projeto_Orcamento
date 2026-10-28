from typing import Any, Dict, List

from app.modules.busca.repositories import BuscaRepository
from core.busca import sanitizar_termo

LIMITE_POR_GRUPO = 5
TAMANHO_MINIMO_TERMO = 2


def _resultado_vazio() -> Dict[str, List[Dict[str, Any]]]:
    return {"obras": [], "orcamentos": [], "membros": []}


class BuscaService:
    def __init__(self, repository: BuscaRepository):
        self.repository = repository

    def buscar(self, q: str, user_id: str) -> Dict[str, List[Dict[str, Any]]]:
        termo = sanitizar_termo(q)
        if len(termo) < TAMANHO_MINIMO_TERMO:
            return _resultado_vazio()

        obras = self.repository.buscar_obras(termo, user_id, LIMITE_POR_GRUPO)
        orcamentos = self.repository.buscar_orcamentos(termo, user_id, LIMITE_POR_GRUPO)
        membros = self.repository.buscar_membros(termo, user_id, LIMITE_POR_GRUPO)

        return {
            "obras": [self._item_obra(o) for o in obras[:LIMITE_POR_GRUPO]],
            "orcamentos": [self._item_orcamento(o) for o in orcamentos[:LIMITE_POR_GRUPO]],
            "membros": [self._item_membro(m) for m in membros[:LIMITE_POR_GRUPO]],
        }

    @staticmethod
    def _item_obra(obra: Dict[str, Any]) -> Dict[str, Any]:
        # As telas de obra endereçam a obra pelo id do orçamento de origem.
        return {
            "id": str(obra["id"]),
            "titulo": obra.get("escopo") or obra.get("cliente") or "Obra sem nome",
            "subtitulo": obra.get("cliente") if obra.get("escopo") else None,
            "href": f"/obras/{obra.get('orcamento_id') or obra['id']}",
        }

    @staticmethod
    def _item_orcamento(orcamento: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": str(orcamento["id"]),
            "titulo": orcamento.get("nome") or "Orçamento sem nome",
            "subtitulo": orcamento.get("cliente"),
            "href": f"/orcamentos/{orcamento['id']}",
        }

    @staticmethod
    def _item_membro(membro: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": str(membro["id"]),
            "titulo": membro.get("nome") or "Sem nome",
            "subtitulo": membro.get("cargo"),
            "href": f"/equipe/editar/{membro['id']}",
        }

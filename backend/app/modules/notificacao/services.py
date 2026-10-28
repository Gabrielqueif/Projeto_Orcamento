from typing import Any, Dict, List, Optional

from app.modules.dashboard.services import DashboardService
from app.modules.notificacao.repositories import NotificacaoRepository


class NotificacaoService:
    """Notificações são os riscos do painel, com controle de lido por usuário."""

    def __init__(self, dashboard: DashboardService, repository: NotificacaoRepository):
        self.dashboard = dashboard
        self.repository = repository

    def _ativas(self, user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "chave": f"{r['tipo']}:{r['obra_id']}",
                "tipo": r["tipo"],
                "severidade": r["severidade"],
                "titulo": r["titulo"],
                "descricao": r["descricao"],
                "href": r["href"],
            }
            for r in self.dashboard.listar_riscos(user_id)
        ]

    def listar(self, user_id: str) -> Dict[str, Any]:
        itens = self._ativas(user_id)
        self.repository.apagar_obsoletas(user_id, [i["chave"] for i in itens])

        lidas = set(self.repository.chaves_lidas(user_id))
        for item in itens:
            item["lida"] = item["chave"] in lidas
        return {"itens": itens, "nao_lidas": sum(1 for i in itens if not i["lida"])}

    def marcar_lidas(self, user_id: str, chaves: Optional[List[str]]) -> Dict[str, int]:
        ativas = [i["chave"] for i in self._ativas(user_id)]
        conhecidas = set(ativas)
        if chaves is None:
            alvo = ativas
        else:
            # Chaves que não são riscos ativos do usuário são ignoradas.
            alvo = [c for c in dict.fromkeys(chaves) if c in conhecidas]
        if alvo:
            self.repository.marcar(user_id, alvo)

        lidas = set(self.repository.chaves_lidas(user_id))
        return {"nao_lidas": sum(1 for c in ativas if c not in lidas)}

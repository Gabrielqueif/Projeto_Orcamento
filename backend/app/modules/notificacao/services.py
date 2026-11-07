from typing import Any, Dict, List, Optional

from app.modules.dashboard.services import DashboardService
from app.modules.notificacao.repositories import NotificacaoRepository


PREFIXO_EVENTO = "EVENTO:"


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

    def _eventos(self, user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "chave": f"{PREFIXO_EVENTO}{e['id']}",
                "tipo": e["tipo"],
                "severidade": "info",
                "titulo": e["titulo"],
                "descricao": e["descricao"],
                "href": e["href"],
                "lida": e["lida_em"] is not None,
            }
            for e in self.repository.listar_eventos(user_id)
        ]

    def listar(self, user_id: str) -> Dict[str, Any]:
        riscos = self._ativas(user_id)
        self.repository.apagar_obsoletas(user_id, [i["chave"] for i in riscos])

        lidas = set(self.repository.chaves_lidas(user_id))
        for item in riscos:
            item["lida"] = item["chave"] in lidas
        # Eventos (mais recentes primeiro) vêm antes dos riscos do painel.
        itens = self._eventos(user_id) + riscos
        return {"itens": itens, "nao_lidas": sum(1 for i in itens if not i["lida"])}

    def marcar_lidas(self, user_id: str, chaves: Optional[List[str]]) -> Dict[str, int]:
        ativas = [i["chave"] for i in self._ativas(user_id)]
        conhecidas = set(ativas)
        if chaves is None:
            alvo = ativas
            self.repository.marcar_eventos(user_id, None)
        else:
            unicas = list(dict.fromkeys(chaves))
            # Chaves que não são riscos ativos do usuário são ignoradas.
            alvo = [c for c in unicas if c in conhecidas]
            ids_eventos = [c[len(PREFIXO_EVENTO):] for c in unicas if c.startswith(PREFIXO_EVENTO)]
            if ids_eventos:
                # Filtrado por user_id no repositório: ids de outros usuários não são tocados.
                self.repository.marcar_eventos(user_id, ids_eventos)
        if alvo:
            self.repository.marcar(user_id, alvo)

        lidas = set(self.repository.chaves_lidas(user_id))
        nao_lidas_eventos = sum(1 for e in self._eventos(user_id) if not e["lida"])
        return {"nao_lidas": sum(1 for c in ativas if c not in lidas) + nao_lidas_eventos}

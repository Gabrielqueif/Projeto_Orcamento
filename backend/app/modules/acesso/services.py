import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from app.modules.acesso.repositories import AcessoRepository
from app.modules.acesso.schemas import ConviteCreate
from core.exceptions import NaoEncontradoError

VALIDADE_CONVITE = timedelta(days=7)


def _agora() -> datetime:
    return datetime.now(timezone.utc)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AcessoService:
    def __init__(self, repository: AcessoRepository):
        self.repository = repository

    def _obra(self, obra_id: str) -> str:
        real = self.repository.resolver_obra(obra_id)
        if not real:
            raise NaoEncontradoError("Obra não encontrada")
        return real

    def criar_convite(self, obra_id: str, schema: ConviteCreate, user_id: str) -> Dict[str, Any]:
        real = self._obra(obra_id)
        token = secrets.token_urlsafe(32)
        criado = self.repository.criar_convite(
            {
                "obra_id": real,
                "token_hash": hash_token(token),
                "papel": schema.papel,
                "expira_em": (_agora() + VALIDADE_CONVITE).isoformat(),
                "criado_por": user_id,
            }
        )
        return {**criado, "token": token}

    def listar_convites(self, obra_id: str) -> List[Dict[str, Any]]:
        return self.repository.listar_convites_pendentes(self._obra(obra_id), _agora().isoformat())

    def revogar_convite(self, obra_id: str, convite_id: str) -> None:
        if not self.repository.revogar_convite(convite_id, self._obra(obra_id)):
            raise NaoEncontradoError("Convite não encontrado")

    def aceitar_convite(self, token: str, user_id: str) -> Dict[str, Any]:
        convite = self.repository.consumir_convite(hash_token(token), user_id, _agora().isoformat())
        if not convite:
            # Inexistente, expirado e já usado têm a mesma resposta: não revela qual token existiu.
            raise NaoEncontradoError("Convite inválido ou expirado")
        try:
            self.repository.upsert_membro(
                {
                    "obra_id": convite["obra_id"],
                    "user_id": user_id,
                    "papel": convite["papel"],
                    "criado_por": convite.get("criado_por"),
                }
            )
        except Exception:
            # Sem o vínculo o convite não pode ficar queimado: devolve para nova tentativa.
            self.repository.liberar_convite(convite["id"])
            raise
        return {"obra_id": convite["obra_id"], "papel": convite["papel"]}

    def listar_membros(self, obra_id: str) -> List[Dict[str, Any]]:
        membros = self.repository.listar_membros(self._obra(obra_id))
        perfis = self.repository.perfis([m["user_id"] for m in membros])
        return [
            {
                **m,
                "nome": perfis.get(m["user_id"], {}).get("username"),
                "email": perfis.get(m["user_id"], {}).get("email"),
            }
            for m in membros
        ]

    def remover_membro(self, obra_id: str, user_id: str) -> None:
        if not self.repository.remover_membro(self._obra(obra_id), user_id):
            raise NaoEncontradoError("Membro não encontrado")

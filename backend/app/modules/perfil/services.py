from typing import Any, Dict

from app.modules.perfil.repositories import PerfilRepository
from app.modules.perfil.schemas import PerfilResponse, PerfilUpdate
from core.exceptions import NaoEncontradoError


class PerfilService:
    def __init__(self, repository: PerfilRepository):
        self.repository = repository

    def obter_perfil(self, usuario: Dict[str, Any]) -> PerfilResponse:
        linha = self.repository.buscar(usuario["id"]) or {}
        return self._montar(usuario, linha)

    def atualizar_perfil(self, usuario: Dict[str, Any], dados: PerfilUpdate) -> PerfilResponse:
        # exclude_none: campo ausente ou null não entra no update.
        campos = dados.model_dump(exclude_none=True)
        if not campos:
            raise ValueError("Informe ao menos um campo para atualizar: nome completo ou cargo")

        linha = self.repository.atualizar(usuario["id"], campos)
        if not linha:
            raise NaoEncontradoError("Perfil não encontrado")
        return self._montar(usuario, linha)

    @staticmethod
    def _montar(usuario: Dict[str, Any], linha: Dict[str, Any]) -> PerfilResponse:
        # Sem linha em profiles, vale o que existe do usuário autenticado (e-mail) e o papel padrão.
        return PerfilResponse(
            id=usuario["id"],
            email=linha.get("email") or usuario.get("email"),
            full_name=linha.get("full_name") or None,
            cargo=linha.get("cargo") or None,
            username=linha.get("username") or None,
            role=linha.get("role") or "user",
        )

from datetime import datetime
from typing import List

from app.modules.etapa.repositories import EtapaRepository
from app.modules.etapa.schemas import EtapaCreate
from app.modules.orcamento.services import garantir_editavel
from core.exceptions import NaoEncontradoError


class EtapaService:
    def __init__(self, repository: EtapaRepository, orcamento_repository=None):
        self.repository = repository
        self.orcamento_repository = orcamento_repository

    def _garantir_editavel(self, orcamento_id: str) -> None:
        if self.orcamento_repository:
            garantir_editavel(self.orcamento_repository.buscar_por_id(orcamento_id))

    def criar_etapa(self, orcamento_id: str, etapa: EtapaCreate) -> dict:
        self._garantir_editavel(orcamento_id)
        dados = {
            "orcamento_id": orcamento_id,
            "nome": etapa.nome,
            "ordem": etapa.ordem,
            "parent_id": etapa.parent_id,
            "created_at": datetime.now().isoformat(),
        }
        resultado = self.repository.criar(dados)
        if not resultado:
            raise Exception("Erro ao criar etapa")
        return resultado

    def listar_etapas(self, orcamento_id: str) -> List[dict]:
        return self.repository.listar_por_orcamento(orcamento_id)

    def atualizar_etapa(self, orcamento_id: str, etapa_id: str, etapa_update: dict) -> dict:
        resultado = self.repository.atualizar(etapa_id, etapa_update, orcamento_id)
        if not resultado:
            raise NaoEncontradoError("Etapa não encontrada")
        return resultado

    def deletar_etapa(self, etapa_id: str, orcamento_id: str) -> dict:
        self._garantir_editavel(orcamento_id)
        self.repository.deletar(etapa_id, orcamento_id)
        return {"message": "Etapa deletada com sucesso"}

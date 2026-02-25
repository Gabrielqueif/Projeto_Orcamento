from datetime import datetime
from typing import List
from app.repositories.etapa_repository import EtapaRepository
from schemas.schemas import EtapaCreate

class EtapaService:
    def __init__(self, repository: EtapaRepository):
        self.repository = repository

    def criar_etapa(self, orcamento_id: str, etapa: EtapaCreate) -> dict:
        dados = {
            "orcamento_id": orcamento_id,
            "nome": etapa.nome,
            "ordem": etapa.ordem,
            "parent_id": etapa.parent_id,
            "created_at": datetime.now().isoformat()
        }
        resultado = self.repository.criar(dados)
        if not resultado:
            raise Exception("Erro ao criar etapa")
        return resultado

    def listar_etapas(self, orcamento_id: str) -> List[dict]:
        return self.repository.listar_por_orcamento(orcamento_id)

    def atualizar_etapa(self, etapa_id: str, etapa_update: dict) -> dict:
        # Recebe um dict com os campos que devem ser atualizados (nome, ordem, parent_id)
        resultado = self.repository.atualizar(etapa_id, etapa_update)
        if not resultado:
            raise Exception("Erro ao atualizar etapa")
        return resultado

    def deletar_etapa(self, etapa_id: str, orcamento_id: str) -> dict:
        self.repository.deletar(etapa_id, orcamento_id)
        return {"message": "Etapa deletada com sucesso"}

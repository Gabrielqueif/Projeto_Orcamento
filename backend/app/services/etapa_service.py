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
            "created_at": datetime.now().isoformat()
        }
        resultado = self.repository.criar(dados)
        if not resultado:
            raise Exception("Erro ao criar etapa")
        return resultado

    def listar_etapas(self, orcamento_id: str) -> List[dict]:
        return self.repository.listar_por_orcamento(orcamento_id)

    def deletar_etapa(self, etapa_id: str, orcamento_id: str) -> dict:
        self.repository.deletar(etapa_id, orcamento_id)
        return {"message": "Etapa deletada com sucesso"}

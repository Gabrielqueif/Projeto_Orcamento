from typing import List, Optional, Dict, Any
from app.repositories.equipe_repository import EquipeRepository
from schemas.equipe import EquipeCreate, EquipeUpdate

class EquipeService:
    def __init__(self, repository: EquipeRepository):
        self.repository = repository

    def criar_equipe(self, equipe: EquipeCreate, user_id: str):
        dados = {
            "nome": equipe.nome,
            "descricao": equipe.descricao,
        }
        return self.repository.criar(dados, user_id)

    def listar_equipes(self, user_id: str, nome: Optional[str] = None):
        return self.repository.listar(user_id, nome)

    def buscar_equipe(self, equipe_id: str, user_id: str):
        equipe = self.repository.buscar_por_id(equipe_id, user_id)
        if not equipe:
            raise ValueError("Equipe não encontrada")
        return equipe

    def atualizar_equipe(self, equipe_id: str, equipe_update: EquipeUpdate, user_id: str):
        existente = self.repository.buscar_por_id(equipe_id, user_id)
        if not existente:
            raise ValueError("Equipe não encontrada")

        dados_atualizacao = {}
        if equipe_update.nome is not None:
            dados_atualizacao["nome"] = equipe_update.nome
        if equipe_update.descricao is not None:
            dados_atualizacao["descricao"] = equipe_update.descricao

        return self.repository.atualizar(equipe_id, dados_atualizacao, user_id)

    def deletar_equipe(self, equipe_id: str, user_id: str):
        existente = self.repository.buscar_por_id(equipe_id, user_id)
        if not existente:
            raise ValueError("Equipe não encontrada")
        return self.repository.deletar(equipe_id, user_id)

from datetime import datetime
from typing import List, Optional
import random
import logging
from app.repositories.membro_equipe_repository import MembroEquipeRepository
from schemas.membro_equipe import MembroEquipeCreate, MembroEquipeUpdate

logger = logging.getLogger("projeto_orcamento")

class MembroEquipeService:
    def __init__(self, repository: MembroEquipeRepository):
        self.repository = repository

    def _gerar_codigo_unico(self, user_id: str) -> str:
        # Tenta gerar um código do tipo #GP-0XXX e verifica se já existe
        for _ in range(10):
            codigo = f"#GP-0{random.randint(100, 999)}"
            membros = self.repository.listar(user_id=user_id)
            codigos_existentes = {m.get("code") for m in membros}
            if codigo not in codigos_existentes:
                return codigo
        return f"#GP-0{random.randint(1000, 9999)}"

    def criar_membro(self, membro: MembroEquipeCreate, user_id: str):
        cpf = membro.cpf.strip()
        code = self._gerar_codigo_unico(user_id)

        dados = {
            "nome": membro.nome,
            "cpf": cpf,
            "cargo": membro.cargo,
            "data_inicio": membro.data_inicio.isoformat() if hasattr(membro.data_inicio, 'isoformat') else str(membro.data_inicio),
            "descricao": membro.descricao,
            "orcamento_id": str(membro.orcamento_id) if membro.orcamento_id else None,
            "remuneracao": membro.remuneracao,
            "status": membro.status or "ATIVO",
            "code": code,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        return self.repository.criar(dados, user_id)

    def listar_membros(
        self, 
        user_id: str,
        nome: Optional[str] = None, 
        cargo: Optional[str] = None, 
        status: Optional[str] = None,
        orcamento_id: Optional[str] = None
    ):
        return self.repository.listar(user_id, nome, cargo, status, orcamento_id)

    def buscar_membro(self, membro_id: str, user_id: str):
        membro = self.repository.buscar_por_id(membro_id, user_id)
        if not membro:
            raise ValueError("Membro da equipe não encontrado")
        return membro

    def atualizar_membro(self, membro_id: str, membro_update: MembroEquipeUpdate, user_id: str):
        existente = self.repository.buscar_por_id(membro_id, user_id)
        if not existente:
            raise ValueError("Membro da equipe não encontrado")

        dados_atualizacao = {}
        dados_atualizacao["updated_at"] = datetime.now().isoformat()
        
        if membro_update.nome is not None:
            dados_atualizacao["nome"] = membro_update.nome
        if membro_update.cpf is not None:
            dados_atualizacao["cpf"] = membro_update.cpf
        if membro_update.cargo is not None:
            dados_atualizacao["cargo"] = membro_update.cargo
        if membro_update.data_inicio is not None:
            dados_atualizacao["data_inicio"] = membro_update.data_inicio.isoformat() if hasattr(membro_update.data_inicio, 'isoformat') else str(membro_update.data_inicio)
        if membro_update.descricao is not None:
            dados_atualizacao["descricao"] = membro_update.descricao
        if membro_update.orcamento_id is not None:
            dados_atualizacao["orcamento_id"] = str(membro_update.orcamento_id) if membro_update.orcamento_id else None
        if membro_update.remuneracao is not None:
            dados_atualizacao["remuneracao"] = membro_update.remuneracao
        if membro_update.status is not None:
            dados_atualizacao["status"] = membro_update.status
            
        return self.repository.atualizar(membro_id, dados_atualizacao, user_id)

    def deletar_membro(self, membro_id: str, user_id: str):
        existente = self.repository.buscar_por_id(membro_id, user_id)
        if not existente:
            raise ValueError("Membro da equipe não encontrado")
        return self.repository.deletar(membro_id, user_id)

    def alocar_membros(self, membro_ids: List[str], orcamento_id: Optional[str], user_id: str):
        orc_id = str(orcamento_id) if orcamento_id else None
        return self.repository.alocar_ao_orcamento(membro_ids, orc_id, user_id)

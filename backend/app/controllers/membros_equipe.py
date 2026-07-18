from typing import List, Optional
from fastapi import Depends
from app.dependencies import get_supabase
from schemas.membro_equipe import MembroEquipeCreate, MembroEquipeUpdate
from app.repositories.membro_equipe_repository import MembroEquipeRepository
from app.services.membro_equipe_service import MembroEquipeService

def get_membro_equipe_service(supabase=Depends(get_supabase)) -> MembroEquipeService:
    repository = MembroEquipeRepository(supabase)
    return MembroEquipeService(repository)

def criar_membro(
    membro: MembroEquipeCreate, 
    user_id: str,
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    return service.criar_membro(membro, user_id)

def listar_membros(
    user_id: str,
    nome: Optional[str] = None,
    cargo: Optional[str] = None,
    status: Optional[str] = None,
    orcamento_id: Optional[str] = None,
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    return service.listar_membros(user_id, nome, cargo, status, orcamento_id)

def buscar_membro(
    membro_id: str,
    user_id: str,
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    return service.buscar_membro(membro_id, user_id)

def atualizar_membro(
    membro_id: str,
    membro: MembroEquipeUpdate,
    user_id: str,
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    return service.atualizar_membro(membro_id, membro, user_id)

def deletar_membro(
    membro_id: str,
    user_id: str,
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    service.deletar_membro(membro_id, user_id)
    return {"message": "Colaborador removido da equipe com sucesso", "id": membro_id}

def alocar_membros(
    membro_ids: List[str],
    orcamento_id: Optional[str],
    user_id: str,
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    service.alocar_membros(membro_ids, orcamento_id, user_id)
    return {"message": "Membros alocados com sucesso"}

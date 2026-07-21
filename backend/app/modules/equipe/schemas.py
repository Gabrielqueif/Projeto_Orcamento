from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

# --- Schemas de Equipe ---

class EquipeCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EquipeUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EquipeResponse(BaseModel):
    id: str
    user_id: str
    nome: str
    descricao: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Schemas de Membro de Equipe ---

class MembroEquipeCreate(BaseModel):
    nome: str
    cpf: str
    cargo: str
    data_inicio: date
    descricao: Optional[str] = None
    orcamento_id: Optional[UUID] = None
    equipe_id: Optional[UUID] = None
    remuneracao: float
    status: Optional[str] = "ATIVO"

    model_config = ConfigDict(from_attributes=True)

class MembroEquipeUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    cargo: Optional[str] = None
    data_inicio: Optional[date] = None
    descricao: Optional[str] = None
    orcamento_id: Optional[UUID] = None
    equipe_id: Optional[UUID] = None
    remuneracao: Optional[float] = None
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MembroEquipeResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    nome: str
    cpf: str
    cargo: str
    data_inicio: date
    descricao: Optional[str] = None
    orcamento_id: Optional[UUID] = None
    equipe_id: Optional[UUID] = None
    remuneracao: float
    status: str
    code: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AlocacaoRequest(BaseModel):
    membro_ids: List[UUID]
    orcamento_id: Optional[UUID] = None

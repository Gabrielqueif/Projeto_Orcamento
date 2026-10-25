from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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


# --- Schemas de Cargo ---

CampoBase = Literal["cpf", "data_inicio", "descricao", "remuneracao"]


class CampoExtra(BaseModel):
    chave: str = Field(pattern=r"^[a-z][a-z0-9_]{0,39}$")
    rotulo: str = Field(min_length=1, max_length=60)
    tipo: Literal["texto", "numero", "data"] = "texto"
    obrigatorio: bool = False


class CargoCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    campos_ocultos: List[CampoBase] = []
    campos_extras: List[CampoExtra] = []


class CargoUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=1, max_length=100)
    campos_ocultos: Optional[List[CampoBase]] = None
    campos_extras: Optional[List[CampoExtra]] = None


class CargoResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None  # None = cargo pré-montado
    nome: str
    campos_ocultos: List[str]
    campos_extras: List[CampoExtra]

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Membro de Equipe ---


class MembroEquipeCreate(BaseModel):
    nome: str
    cpf: Optional[str] = None
    cargo: Optional[str] = None  # ignorado quando cargo_id é informado
    cargo_id: Optional[UUID] = None
    dados_extras: Dict[str, Any] = {}
    data_inicio: Optional[date] = None
    descricao: Optional[str] = None
    orcamento_id: Optional[UUID] = None
    equipe_id: Optional[UUID] = None
    remuneracao: Optional[float] = None
    status: Optional[str] = "ATIVO"

    model_config = ConfigDict(from_attributes=True)


class MembroEquipeUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    cargo: Optional[str] = None
    cargo_id: Optional[UUID] = None
    dados_extras: Optional[Dict[str, Any]] = None
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
    cpf: Optional[str] = None
    cargo: str
    cargo_id: Optional[UUID] = None
    dados_extras: Dict[str, Any] = {}
    data_inicio: Optional[date] = None
    descricao: Optional[str] = None
    orcamento_id: Optional[UUID] = None
    equipe_id: Optional[UUID] = None
    remuneracao: Optional[float] = None
    status: str
    code: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AlocacaoRequest(BaseModel):
    equipe_id: str
    membro_ids: List[str]


# --- Schemas de Apontamento Diário ---


class ApontamentoDiarioCreate(BaseModel):
    membro_id: str
    obra_id: str
    etapa_id: Optional[str] = None
    data: date
    presente: bool = True
    horas_trabalhadas: float = 8.0
    observacao: Optional[str] = None


class ApontamentoDiarioResponse(ApontamentoDiarioCreate):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

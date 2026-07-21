from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class EtapaCreate(BaseModel):
    nome: str
    ordem: int = 0
    parent_id: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None

class EtapaUpdate(BaseModel):
    nome: Optional[str] = None
    ordem: Optional[int] = None
    parent_id: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None

class EtapaResponse(BaseModel):
    id: str
    orcamento_id: str
    nome: str
    ordem: int
    parent_id: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class OrcamentoCreate(BaseModel):
    nome: str
    cliente: str
    data: date
    base_referencia: str
    tipo_composicao: str
    estado: str
    fonte: Optional[str] = "SINAPI"
    bdi: Optional[float] = 0.0
    status: Optional[str] = "em_elaboracao"

    model_config = ConfigDict(from_attributes=True)

class OrcamentoUpdate(BaseModel):
    nome: Optional[str] = None
    cliente: Optional[str] = None
    data: Optional[date] = None
    base_referencia: Optional[str] = None
    tipo_composicao: Optional[str] = None
    estado: Optional[str] = None
    fonte: Optional[str] = None
    bdi: Optional[float] = None
    status: Optional[str] = None
    valor_total: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class OrcamentoResponse(BaseModel):
    id: str
    nome: str
    cliente: str
    data: date
    base_referencia: str
    tipo_composicao: str
    estado: str
    fonte: str
    bdi: float
    valor_total: Optional[float]
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
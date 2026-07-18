from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class OrcamentoItemCreate(BaseModel):
    codigo_composicao: str
    descricao: str
    quantidade: float
    unidade: str
    estado: Optional[str] = None
    fonte: Optional[str] = None 
    etapa_id: Optional[str] = None
    preco_unitario: Optional[float] = None 
    memoria_calculo: Optional[str] = None
    variaveis: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

class OrcamentoItemUpdate(BaseModel):
    codigo_composicao: Optional[str] = None
    descricao: Optional[str] = None
    quantidade: Optional[float] = None
    unidade: Optional[str] = None
    estado: Optional[str] = None
    fonte: Optional[str] = None 
    etapa_id: Optional[str] = None
    memoria_calculo: Optional[str] = None
    variaveis: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

class OrcamentoItemResponse(BaseModel):
    id: str
    orcamento_id: str
    etapa_id: Optional[str] = None
    codigo_composicao: str
    descricao: str
    quantidade: float
    unidade: str
    preco_unitario: Optional[float]
    preco_total: Optional[float]
    estado: str
    fonte: str 
    memoria_calculo: Optional[str] = None
    variaveis: Optional[Any] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
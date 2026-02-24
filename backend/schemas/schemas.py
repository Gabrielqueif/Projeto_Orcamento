# schemas.py

from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import date, datetime

# O Pydantic valida e tipa os dados de entrada da sua API
# Schemas para Orçamentos
class OrcamentoCreate(BaseModel):
    nome: str
    cliente: str
    data: date
    base_referencia: str
    tipo_composicao: str
    estado: str
    status: Optional[str] = "em_elaboracao"

    model_config = ConfigDict(from_attributes=True)

class OrcamentoUpdate(BaseModel):
    nome: Optional[str] = None
    cliente: Optional[str] = None
    data: Optional[date] = None
    base_referencia: Optional[str] = None
    tipo_composicao: Optional[str] = None
    estado: Optional[str] = None
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
    valor_total: Optional[float]
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Schemas para Etapas
class EtapaCreate(BaseModel):
    nome: str
    ordem: int = 0

class EtapaUpdate(BaseModel):
    nome: Optional[str] = None
    ordem: Optional[int] = None

class EtapaResponse(BaseModel):
    id: str
    orcamento_id: str
    nome: str
    ordem: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Schemas para Itens do Orçamento
class OrcamentoItemCreate(BaseModel):
    codigo_composicao: str
    descricao: str
    quantidade: float
    unidade: str
    estado: Optional[str] = None
    etapa_id: Optional[str] = None
    memoria_calculo: Optional[str] = None
    variaveis: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

class OrcamentoItemUpdate(BaseModel):
    codigo_composicao: Optional[str] = None
    descricao: Optional[str] = None
    quantidade: Optional[float] = None
    unidade: Optional[str] = None
    estado: Optional[str] = None
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
    memoria_calculo: Optional[str] = None
    variaveis: Optional[Any] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import date, datetime

class ObraTransitionCreate(BaseModel):
    data_inicio_real: date
    prazo_estimado_dias: int
    engenheiro_responsavel_id: Optional[str] = None
    enviar_curva_abc_almoxarifado: Optional[bool] = True
    bloquear_planilha_base: Optional[bool] = True

    model_config = ConfigDict(from_attributes=True)

class ObraCreate(BaseModel):
    orcamento_id: Optional[str] = None
    cliente: str
    endereco: Optional[Any] = None
    escopo: Optional[str] = None
    data_inicio_real: date
    prazo_estimado_dias: int
    engenheiro_responsavel_id: Optional[str] = None
    enviar_curva_abc_almoxarifado: bool = True
    bloquear_planilha_base: bool = True
    status: Optional[str] = "EM_ANDAMENTO"

    model_config = ConfigDict(from_attributes=True)

class ObraUpdate(BaseModel):
    cliente: Optional[str] = None
    endereco: Optional[Any] = None
    escopo: Optional[str] = None
    data_inicio_real: Optional[date] = None
    prazo_estimado_dias: Optional[int] = None
    engenheiro_responsavel_id: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ObraResponse(BaseModel):
    id: str
    orcamento_id: Optional[str] = None
    cliente: str
    endereco: Optional[Any] = None
    escopo: Optional[str] = None
    data_inicio_real: date
    prazo_estimado_dias: int
    engenheiro_responsavel_id: Optional[str] = None
    enviar_curva_abc_almoxarifado: bool
    bloquear_planilha_base: bool
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LimiteRequisicaoResponse(BaseModel):
    id: str
    obra_id: str
    codigo_insumo: str
    descricao: str
    unidade: str
    quantidade_limite: float
    quantidade_requisitada: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ObraStatusUpdate(BaseModel):
    status: str

    model_config = ConfigDict(from_attributes=True)

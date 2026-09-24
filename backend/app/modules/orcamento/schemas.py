from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List, Dict
from datetime import date, datetime
from uuid import UUID
from app.modules.orcamento.bdi import BDIConfig, TipoBDI, TipoBDIItem

# --- Schemas de Orçamento ---

class BDICalculateRequest(BaseModel):
    config: BDIConfig

class BDICalculateResponse(BaseModel):
    bdi: float
    bdi_diferenciado: float
    impostos_total: float
    detalhamento: Dict[str, Any]

class OrcamentoCreate(BaseModel):
    nome: str
    cliente: str
    data: date
    base_referencia: str
    tipo_composicao: str
    estado: str
    fonte: Optional[str] = "SINAPI"
    bdi: Optional[float] = 0.0
    tipo_bdi: Optional[TipoBDI] = "ANALITICO"
    bdi_config: Optional[BDIConfig] = None
    valor_total: Optional[float] = 0.0
    status: Optional[str] = "em_elaboracao"
    variaveis_globais: Optional[List[Any]] = []
    locais: Optional[List[Any]] = []

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
    tipo_bdi: Optional[TipoBDI] = None
    bdi_config: Optional[BDIConfig] = None
    status: Optional[str] = None
    valor_total: Optional[float] = None
    variaveis_globais: Optional[List[Any]] = None
    locais: Optional[List[Any]] = None

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
    tipo_bdi: Optional[str] = "ANALITICO"
    bdi_config: Optional[Dict[str, Any]] = None
    valor_total: Optional[float]
    status: str
    variaveis_globais: Optional[List[Any]] = []
    locais: Optional[List[Any]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class OrcamentoStatsResponse(BaseModel):
    total_orcamentos: int
    valor_total: float
    taxa_aprovacao: float
    ticket_medio: float
    tempo_resposta_medio: float

    model_config = ConfigDict(from_attributes=True)

class CurvaABCInsumo(BaseModel):
    codigo_insumo: str
    descricao: str
    unidade: str
    quantidade: float
    total: float
    porcentagem: float
    acumulado: float
    classe: str

    model_config = ConfigDict(from_attributes=True)

class CurvaABCResponse(BaseModel):
    valor_total: float
    insumos: List[CurvaABCInsumo]
    resumo_classes: Any

    model_config = ConfigDict(from_attributes=True)

class CronogramaMesResponse(BaseModel):
    mes: str
    servicos: str
    valor: float
    acumulado_pct: float

    model_config = ConfigDict(from_attributes=True)

class CronogramaResponse(BaseModel):
    valor_total: float
    mensal: List[CronogramaMesResponse]

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Item de Orçamento ---

class VariableConfigSchema(BaseModel):
    id: str
    label: str
    key: str

    model_config = ConfigDict(from_attributes=True)

class MemoriaCalculoElementoSchema(BaseModel):
    id: str
    descricao: str
    quantidade: float = 1.0
    largura: float = 1.0
    altura: float = 1.0
    valores: Optional[Any] = None
    subtotal: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class MemoriaCalculoPayloadSchema(BaseModel):
    config: List[VariableConfigSchema]
    elementos: List[MemoriaCalculoElementoSchema]

    model_config = ConfigDict(from_attributes=True)

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
    tipo_bdi_item: Optional[TipoBDIItem] = None
    bdi_aplicado: Optional[float] = None

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
    tipo_bdi_item: Optional[TipoBDIItem] = None
    bdi_aplicado: Optional[float] = None

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
    tipo_bdi_item: Optional[str] = "PADRAO"
    bdi_aplicado: Optional[float] = 0.0
    preco_unitario_bdi: Optional[float] = 0.0
    preco_total_bdi: Optional[float] = 0.0
    estado: str
    fonte: str 
    memoria_calculo: Optional[str] = None
    variaveis: Optional[Any] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Insumo do Item de Orçamento ---

class OrcamentoItemInsumoUpdate(BaseModel):
    quantidade_unitaria: Optional[float] = None
    preco_unitario_custom: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

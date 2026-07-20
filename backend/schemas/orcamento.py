from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List
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
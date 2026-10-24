from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Clima = Literal["SOL", "NUBLADO", "CHUVA"]
StatusDiario = Literal["RASCUNHO", "ENVIADO", "APROVADO"]
SituacaoDiario = Literal["ENVIADO", "RASCUNHO", "PENDENTE", "ALERTA"]

Titulo = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
TextoObrigatorio = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Responsavel = Annotated[str, StringConstraints(strip_whitespace=True, max_length=150)]


class ServicoInput(BaseModel):
    """Serviço (item do orçamento) executado no dia, na unidade do próprio item."""

    item_id: str
    quantidade: float = Field(gt=0)


class DiarioCreate(BaseModel):
    data: date
    titulo: Titulo
    atividades: TextoObrigatorio
    ocorrencias: Optional[str] = None
    clima: Clima
    temperatura: Optional[Decimal] = Field(default=None, ge=-10, le=60)
    equipe_presente: int = Field(default=0, ge=0, le=10000)
    responsavel: Optional[Responsavel] = None
    servicos: List[ServicoInput] = []


class DiarioUpdate(BaseModel):
    data: Optional[date] = None
    titulo: Optional[Titulo] = None
    atividades: Optional[TextoObrigatorio] = None
    ocorrencias: Optional[str] = None
    clima: Optional[Clima] = None
    temperatura: Optional[Decimal] = Field(default=None, ge=-10, le=60)
    equipe_presente: Optional[int] = Field(default=None, ge=0, le=10000)
    responsavel: Optional[Responsavel] = None
    # None mantém os serviços do diário; lista (mesmo vazia) substitui.
    servicos: Optional[List[ServicoInput]] = None


class DiarioStatusUpdate(BaseModel):
    status: StatusDiario


class FotoResponse(BaseModel):
    id: str
    diario_id: str
    legenda: Optional[str] = None
    url: Optional[str] = None
    created_at: Optional[datetime] = None


class ServicoDiario(BaseModel):
    item_id: str
    codigo: Optional[str] = None
    descricao: str
    unidade: str
    quantidade: float
    percentual: float


class ServicoObra(BaseModel):
    id: str
    codigo: Optional[str] = None
    descricao: str
    unidade: str
    quantidade: float
    executado: float = 0
    etapa_nome: Optional[str] = None


class DiarioResponse(BaseModel):
    id: str
    obra_id: str
    data: date
    titulo: str
    atividades: str
    ocorrencias: Optional[str] = None
    tem_ocorrencia: bool = False
    clima: Clima
    temperatura: Optional[Decimal] = None
    equipe_presente: int = 0
    responsavel: Optional[str] = None
    status: StatusDiario
    fotos: List[FotoResponse] = []
    servicos: List[ServicoDiario] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ObraDiarioInfo(BaseModel):
    obra_id: str
    nome: str
    local: Optional[str] = None
    responsavel: Optional[str] = None
    data_inicio: Optional[date] = None
    prazo_dias: Optional[int] = None
    progresso: int = 0
    servicos: List[ServicoObra] = []
    ultima_atualizacao: Optional[datetime] = None


class DiarioListagem(BaseModel):
    obra: ObraDiarioInfo
    registros: List[DiarioResponse]


class ResumoObraDiario(BaseModel):
    obra_id: str
    orcamento_id: Optional[str] = None
    nome: str
    local: Optional[str] = None
    responsavel: Optional[str] = None
    situacao: SituacaoDiario
    ultimo_registro: Optional[date] = None
    ultimo_clima: Optional[Clima] = None


class ResumoDiarioResponse(BaseModel):
    total_obras: int
    enviados_hoje: int
    alertas: int
    taxa_preenchimento_7d: int
    obras: List[ResumoObraDiario]

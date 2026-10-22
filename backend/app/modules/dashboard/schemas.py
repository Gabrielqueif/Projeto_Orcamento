from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

Severidade = Literal["critical", "moderate", "info"]
TipoRisco = Literal["ATRASO", "ORCAMENTO", "ESTOQUE", "DIARIO"]


class RiscoDashboard(BaseModel):
    tipo: TipoRisco
    severidade: Severidade
    titulo: str
    descricao: str
    href: str


class SerieSemanal(BaseModel):
    obra_id: str
    nome: str
    # Avanço realizado (%) ao fim de cada semana; None quando ainda não há como medir.
    valores: List[Optional[float]]


class FeedItem(BaseModel):
    titulo: str
    obra_nome: str
    data: date
    status: str
    atualizado_em: Optional[datetime] = None
    href: str


class DashboardResponse(BaseModel):
    obras_ativas: int
    progresso_medio: int
    orcamento_total: float
    gasto_realizado: float
    disponivel: float
    utilizacao_orcamento: float
    alertas_criticos: int
    riscos: List[RiscoDashboard]
    semanas: List[str]
    series: List[SerieSemanal]
    feed: List[FeedItem]

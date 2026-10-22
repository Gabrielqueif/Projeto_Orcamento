from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

OrigemMedicao = Literal["MANUAL", "DIARIO"]
SituacaoCurva = Literal["NO_PRAZO", "ATRASADA", "ADIANTADA", "SEM_CRONOGRAMA"]


class MedicaoCreate(BaseModel):
    etapa_id: str
    data: date
    progresso: int = Field(ge=0, le=100)
    observacao: Optional[str] = Field(default=None, max_length=1000)


class AvancoEtapa(BaseModel):
    """Avanço informado no diário: vira uma medição da etapa na data do diário."""

    etapa_id: str
    progresso: int = Field(ge=0, le=100)


class MedicaoResponse(BaseModel):
    id: str
    obra_id: str
    etapa_id: str
    etapa_nome: Optional[str] = None
    data: date
    progresso: int
    origem: OrigemMedicao
    diario_id: Optional[str] = None
    observacao: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PontoCurva(BaseModel):
    data: date
    planejado: float
    realizado: Optional[float] = None


class CurvaSResponse(BaseModel):
    inicio: Optional[date] = None
    fim: Optional[date] = None
    hoje: date
    planejado_hoje: Optional[float] = None
    realizado_hoje: Optional[float] = None
    desvio: Optional[float] = None
    situacao: SituacaoCurva
    etapas_sem_cronograma: int = 0
    pontos: List[PontoCurva] = []

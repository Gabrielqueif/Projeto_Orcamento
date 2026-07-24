from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import date, datetime

class DespesaBase(BaseModel):
    descricao: str = Field(..., min_length=3, max_length=255)
    valor: Decimal = Field(..., ge=0)
    categoria: str = Field(..., pattern="^(Materiais|Mão de Obra|Equipamentos|Administrativo|Outros)$")
    status: str = Field("EM_ANALISE", pattern="^(EM_ANALISE|APROVADO|PAGO|RECUSADO)$")
    data_competencia: date
    responsavel: str = Field(..., min_length=2, max_length=100)
    documento_url: Optional[str] = None
    origem: str = Field("MANUAL", pattern="^(MANUAL|ALMOXARIFADO|COMPRAS)$")
    insumo_id: Optional[str] = None
    locacao_id: Optional[str] = None

class DespesaCreate(DespesaBase):
    pass

class DespesaResponse(DespesaBase):
    id: str
    obra_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CategoriaGasto(BaseModel):
    categoria: str
    orcado: Decimal
    realizado: Decimal
    desvio: Decimal
    desvio_percentual: float

class ConsolidadoFinanceiro(BaseModel):
    total_orcado: Decimal
    total_realizado: Decimal
    saldo_restante: Decimal
    desvio_percentual: float
    gasto_por_categoria: List[CategoriaGasto]

class ObraResumoFinanceiro(BaseModel):
    id: str
    nome: str
    gestor: str
    previsto: float
    realizado: float
    percent: float
    status: str
    statusClass: str
    barColor: str
    href: str

class PortfolioConsolidadoResponse(BaseModel):
    total_orcado: float
    total_realizado: float
    saldo_restante: float
    desvio_percentual: float
    projetos: List[ObraResumoFinanceiro]
    gasto_por_categoria: List[CategoriaGasto]
    alerta_critico: Optional[Dict[str, Any]] = None


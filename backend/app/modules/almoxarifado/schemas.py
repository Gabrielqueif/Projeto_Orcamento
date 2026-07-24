from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from uuid import UUID

class InsumoBase(BaseModel):
    codigo_insumo: str
    descricao: str
    categoria: str
    quantidade_minima: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    unidade: str
    preco_unitario: Decimal = Field(default=Decimal("0.00"), ge=0)

class InsumoCreate(InsumoBase):
    quantidade_atual: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)

class InsumoResponse(InsumoBase):
    id: UUID
    obra_id: UUID
    quantidade_atual: Decimal
    status: str # 'Crítico' ou 'Normal'
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MovimentacaoCreate(BaseModel):
    tipo_movimentacao: str = Field(..., pattern="^(ENTRADA|SAIDA)$")
    quantidade: Decimal = Field(..., gt=0)
    responsavel: str
    observacoes: Optional[str] = None

class MovimentacaoResponse(BaseModel):
    id: UUID
    insumo_id: UUID
    tipo_movimentacao: str
    quantidade: Decimal
    responsavel: str
    observacoes: Optional[str]
    data_movimentacao: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class LocacaoCreate(BaseModel):
    nome_equipamento: str
    locadora: str
    status: str = Field(..., pattern="^(EM_USO|AGUARDANDO_RETIRADA|FINALIZADO)$")
    devolucao_prevista: date
    responsavel: Optional[str] = None

class LocacaoResponse(LocacaoCreate):
    id: UUID
    obra_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

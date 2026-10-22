from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

TipoInsumo = Literal["MATERIAL", "MAO_DE_OBRA", "EQUIPAMENTO", "SERVICO"]
RefFonte = Literal["PROPRIA", "SINAPI", "SEINFRA"]
RefTipo = Literal["INSUMO", "COMPOSICAO"]


def _limpo(valor: str) -> str:
    return valor.strip()


# --- Bases -------------------------------------------------------------------


class BaseCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=150)
    descricao: Optional[str] = None
    uf: Optional[str] = Field(default=None, min_length=2, max_length=2)
    data_referencia: Optional[date] = None

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        v = _limpo(v)
        if not v:
            raise ValueError("O nome da base não pode ser vazio")
        return v

    @field_validator("uf")
    @classmethod
    def uf_maiuscula(cls, v: Optional[str]) -> Optional[str]:
        return v.upper() if v else v


class BaseUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=1, max_length=150)
    descricao: Optional[str] = None
    uf: Optional[str] = Field(default=None, min_length=2, max_length=2)
    data_referencia: Optional[date] = None

    @field_validator("uf")
    @classmethod
    def uf_maiuscula(cls, v: Optional[str]) -> Optional[str]:
        return v.upper() if v else v


class BaseResponse(BaseModel):
    id: str
    nome: str
    descricao: Optional[str] = None
    uf: Optional[str] = None
    data_referencia: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DuplicarBase(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=1, max_length=150)


# --- Insumos -----------------------------------------------------------------


class InsumoCreate(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=50)
    descricao: str = Field(..., min_length=1)
    unidade: str = Field(..., min_length=1, max_length=20)
    tipo: TipoInsumo
    preco: float = Field(default=0, ge=0)

    @field_validator("codigo", "descricao", "unidade")
    @classmethod
    def sem_espacos_nas_pontas(cls, v: str) -> str:
        v = _limpo(v)
        if not v:
            raise ValueError("Campo obrigatório")
        return v


class InsumoUpdate(BaseModel):
    descricao: Optional[str] = Field(default=None, min_length=1)
    unidade: Optional[str] = Field(default=None, min_length=1, max_length=20)
    tipo: Optional[TipoInsumo] = None
    preco: Optional[float] = Field(default=None, ge=0)


class InsumoResponse(BaseModel):
    id: str
    base_id: str
    codigo: str
    descricao: str
    unidade: str
    tipo: TipoInsumo
    preco: float


# --- Composições -------------------------------------------------------------


class ItemCreate(BaseModel):
    ref_fonte: RefFonte
    ref_tipo: RefTipo
    ref_codigo: str = Field(..., min_length=1, max_length=50)
    coeficiente: float = Field(..., gt=0)

    @field_validator("ref_codigo")
    @classmethod
    def codigo_sem_espacos(cls, v: str) -> str:
        v = _limpo(v)
        if not v:
            raise ValueError("Código da referência é obrigatório")
        return v


class ItemUpdate(BaseModel):
    ref_fonte: Optional[RefFonte] = None
    ref_tipo: Optional[RefTipo] = None
    ref_codigo: Optional[str] = Field(default=None, min_length=1, max_length=50)
    coeficiente: Optional[float] = Field(default=None, gt=0)


class ItemResponse(BaseModel):
    id: str
    composicao_id: str
    ref_fonte: RefFonte
    ref_tipo: RefTipo
    ref_codigo: str
    coeficiente: float


class ComposicaoCreate(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=50)
    descricao: str = Field(..., min_length=1)
    unidade: str = Field(..., min_length=1, max_length=20)
    grupo: Optional[str] = Field(default=None, max_length=100)
    itens: List[ItemCreate] = Field(default_factory=list)

    @field_validator("codigo", "descricao", "unidade")
    @classmethod
    def sem_espacos_nas_pontas(cls, v: str) -> str:
        v = _limpo(v)
        if not v:
            raise ValueError("Campo obrigatório")
        return v


class ComposicaoUpdate(BaseModel):
    descricao: Optional[str] = Field(default=None, min_length=1)
    unidade: Optional[str] = Field(default=None, min_length=1, max_length=20)
    grupo: Optional[str] = Field(default=None, max_length=100)


class ComposicaoResponse(BaseModel):
    id: str
    base_id: str
    codigo: str
    descricao: str
    unidade: str
    grupo: Optional[str] = None


class ComposicaoDetalhe(ComposicaoResponse):
    itens: List[ItemResponse] = Field(default_factory=list)


# --- Preço -------------------------------------------------------------------


class ItemPreco(BaseModel):
    ref_fonte: RefFonte
    ref_tipo: RefTipo
    ref_codigo: str
    descricao: Optional[str] = None
    unidade: Optional[str] = None
    coeficiente: float
    preco_unitario: Optional[float] = None
    subtotal: float
    encontrado: bool


class PrecoComposicaoResponse(BaseModel):
    composicao_id: str
    codigo: str
    uf: str
    mes: str
    tipo: str
    preco_total: float
    itens: List[ItemPreco]
    itens_sem_preco: int


# --- Importação --------------------------------------------------------------


class ImportacaoResultado(BaseModel):
    insumos_importados: int
    composicoes_importadas: int
    itens_importados: int

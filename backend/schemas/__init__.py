# Schemas package

from .orcamento import (
    OrcamentoCreate,
    OrcamentoUpdate,
    OrcamentoResponse,
    OrcamentoStatsResponse,
    CurvaABCInsumo,
    CurvaABCResponse,
    CronogramaMesResponse,
    CronogramaResponse,
)
from .etapa import EtapaCreate, EtapaUpdate, EtapaResponse
from .item import OrcamentoItemCreate, OrcamentoItemUpdate, OrcamentoItemResponse
from .insumo import OrcamentoItemInsumoUpdate
from .membro_equipe import MembroEquipeCreate, MembroEquipeUpdate, MembroEquipeResponse, AlocacaoRequest
from .obra import ObraTransitionCreate, ObraCreate, ObraUpdate, ObraResponse, LimiteRequisicaoResponse

# Isso garante que o autocomplete do seu VS Code ou PyCharm funcione perfeitamente
__all__ = [
    "OrcamentoCreate",
    "OrcamentoUpdate",
    "OrcamentoResponse",
    "OrcamentoStatsResponse",
    "CurvaABCInsumo",
    "CurvaABCResponse",
    "CronogramaMesResponse",
    "CronogramaResponse",
    "EtapaCreate",
    "EtapaUpdate",
    "EtapaResponse",
    "OrcamentoItemCreate",
    "OrcamentoItemUpdate",
    "OrcamentoItemResponse",
    "OrcamentoItemInsumoUpdate",
    "MembroEquipeCreate",
    "MembroEquipeUpdate",
    "MembroEquipeResponse",
    "AlocacaoRequest",
    "ObraTransitionCreate",
    "ObraCreate",
    "ObraUpdate",
    "ObraResponse",
    "LimiteRequisicaoResponse",
]
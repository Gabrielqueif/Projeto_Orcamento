# Schemas package

from .orcamento import OrcamentoCreate, OrcamentoUpdate, OrcamentoResponse
from .etapa import EtapaCreate, EtapaUpdate, EtapaResponse
from .item import OrcamentoItemCreate, OrcamentoItemUpdate, OrcamentoItemResponse
from .insumo import OrcamentoItemInsumoUpdate
from .membro_equipe import MembroEquipeCreate, MembroEquipeUpdate, MembroEquipeResponse, AlocacaoRequest

# Isso garante que o autocomplete do seu VS Code ou PyCharm funcione perfeitamente
__all__ = [
    "OrcamentoCreate",
    "OrcamentoUpdate",
    "OrcamentoResponse",
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
]
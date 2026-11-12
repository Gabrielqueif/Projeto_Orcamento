from typing import List, Literal, Optional, Union

from pydantic import BaseModel

from app.modules.dashboard.schemas import Severidade, TipoRisco


class NotificacaoItem(BaseModel):
    chave: str
    tipo: Union[TipoRisco, Literal["DIARIO_ENVIADO"]]
    severidade: Severidade
    titulo: str
    descricao: str
    href: str
    lida: bool


class NotificacoesResponse(BaseModel):
    itens: List[NotificacaoItem]
    nao_lidas: int


class MarcarLidasRequest(BaseModel):
    # Ausente ou null marca todas as notificações ativas como lidas.
    chaves: Optional[List[str]] = None


class MarcarLidasResponse(BaseModel):
    nao_lidas: int

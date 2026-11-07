from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

Papel = Literal["MESTRE", "SUPERVISOR"]


class ConviteCreate(BaseModel):
    papel: Papel = "MESTRE"


class ConviteResponse(BaseModel):
    id: str
    papel: Papel
    expira_em: datetime
    usado_em: Optional[datetime] = None


class ConviteCriadoResponse(ConviteResponse):
    # Único momento em que o token em claro existe: só o hash fica no banco.
    token: str


class ConviteAceite(BaseModel):
    token: str


class MembroResponse(BaseModel):
    user_id: str
    papel: Papel
    nome: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime


class AceiteResponse(BaseModel):
    obra_id: str
    papel: Papel

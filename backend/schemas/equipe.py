from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class EquipeCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EquipeUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EquipeResponse(BaseModel):
    id: str
    user_id: str
    nome: str
    descricao: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

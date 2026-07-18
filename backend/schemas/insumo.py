from pydantic import BaseModel, ConfigDict
from typing import Optional

class OrcamentoItemInsumoUpdate(BaseModel):
    quantidade_unitaria: Optional[float] = None
    preco_unitario_custom: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
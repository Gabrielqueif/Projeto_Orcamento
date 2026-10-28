from typing import Optional

from pydantic import BaseModel, ConfigDict, StringConstraints
from typing_extensions import Annotated

NomeCompleto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
CargoProfissional = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]


class PerfilResponse(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    cargo: Optional[str] = None
    username: Optional[str] = None
    role: str = "user"


class PerfilUpdate(BaseModel):
    # extra="forbid": qualquer campo fora de full_name/cargo (ex.: role) dá 422.
    model_config = ConfigDict(extra="forbid")

    full_name: Optional[NomeCompleto] = None
    cargo: Optional[CargoProfissional] = None

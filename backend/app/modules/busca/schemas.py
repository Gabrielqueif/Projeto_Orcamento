from typing import List, Optional

from pydantic import BaseModel


class BuscaItem(BaseModel):
    id: str
    titulo: str
    subtitulo: Optional[str] = None
    href: str


class BuscaResponse(BaseModel):
    obras: List[BuscaItem] = []
    orcamentos: List[BuscaItem] = []
    membros: List[BuscaItem] = []

from pydantic import BaseModel

class SinapiMetadata(BaseModel):
    mes_referencia: str
    uf: str
    desoneracao: str
    fonte: str = "SINAPI"

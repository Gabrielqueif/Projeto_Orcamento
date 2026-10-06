from pathlib import Path

from app.modules.composicao.repositories import ItemRepository

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PLANILHA_SINAPI_CAMINHO = BASE_DIR / "planilhas" / "planilha_sinapi.xlsx"

COLUNAS_ESTADOS = [
    "ac",
    "al",
    "ap",
    "am",
    "ba",
    "ce",
    "df",
    "es",
    "go",
    "ma",
    "mt",
    "ms",
    "mg",
    "pa",
    "pb",
    "pr",
    "pe",
    "pi",
    "rj",
    "rn",
    "rs",
    "ro",
    "rr",
    "sc",
    "sp",
    "se",
    "to",
]


class ItemService:
    def __init__(self, repository: ItemRepository):
        self.repository = repository

    def listar_composicoes(self, fonte: str = "SINAPI"):
        return self.repository.listar(limit=100)

    def buscar_composicao(
        self,
        termo: str,
        fonte: str = "SINAPI",
        estado: str = "",
        mes_referencia: str = "",
        tipo_composicao: str = "",
    ):
        if "%" in termo or termo.isdigit():
            resultados = self.repository.buscar_por_codigo(termo, fonte=fonte)
        else:
            resultados = self.repository.buscar_por_descricao(termo, fonte=fonte)

        if estado and resultados:
            precos = self.repository.buscar_precos_lote(
                [r["codigo_composicao"] for r in resultados], estado, mes_referencia, tipo_composicao, fonte=fonte
            )
            for r in resultados:
                r["preco"] = precos.get(r["codigo_composicao"])
        return resultados

    def listar_estados_composicao(self, codigo_composicao: str, mes_referencia: str, fonte: str = "SINAPI"):
        return self.repository.listar_estados_por_item(codigo_composicao, mes_referencia, fonte=fonte)

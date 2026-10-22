import unicodedata
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from app.modules.importacao.services.base_excel_parser import BaseExcelParser

ABA_INSUMOS = "Insumos"
ABA_COMPOSICOES = "Composições"

COLUNAS_INSUMOS = ["codigo", "descricao", "unidade", "tipo", "preco"]
COLUNAS_COMPOSICOES = [
    "codigo",
    "descricao",
    "unidade",
    "grupo",
    "ref_fonte",
    "ref_tipo",
    "ref_codigo",
    "coeficiente",
]

TIPOS_INSUMO = {"MATERIAL", "MAO_DE_OBRA", "EQUIPAMENTO", "SERVICO"}
FONTES = {"PROPRIA", "SINAPI", "SEINFRA"}
TIPOS_REF = {"INSUMO", "COMPOSICAO"}

MAX_ARQUIVO_BYTES = 5 * 1024 * 1024


def _normalizar(texto: Any) -> str:
    sem_acento = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode()
    return sem_acento.strip().lower().replace(" ", "_")


def _texto(valor: Any) -> str:
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return ""
    return str(valor).strip()


def _numero(valor: str) -> Optional[float]:
    try:
        return float(valor.replace(",", "."))
    except ValueError:
        return None


class BasePropriaExcelParser(BaseExcelParser):
    """
    Planilha de importação da base própria: aba "Insumos" e aba "Composições" (uma linha por item;
    os dados da composição se repetem em cada linha dela). Reaproveita a leitura de abas da
    BaseExcelParser; o contrato de registros é (itens principais, itens secundários) por aba.
    """

    def __init__(self, file_content: bytes):
        super().__init__(file_content)
        self.erros: List[str] = []

    def _aba(self, nome: str) -> Optional[str]:
        alvo = _normalizar(nome)
        return next((aba for aba in self.sheet_names if _normalizar(aba) == alvo), None)

    def identificar_abas_dados(self) -> List[str]:
        return [aba for aba in (self._aba(ABA_INSUMOS), self._aba(ABA_COMPOSICOES)) if aba]

    def classificar_tipo_composicao(self, nome_aba: str) -> str:
        return "PROPRIA"

    def extrair_metadados(self, sheet_hint: Optional[str] = None) -> Dict[str, Any]:
        return {"fonte": "PROPRIA", "abas": self.identificar_abas_dados()}

    def _linhas(self, aba: str, colunas: List[str]) -> List[Tuple[int, Dict[str, str]]]:
        df = self.ler_aba(aba, dtype=str)
        df.columns = [_normalizar(c) for c in df.columns]
        faltando = [c for c in colunas if c not in df.columns and c != "grupo"]
        if faltando:
            raise ValueError(f"Aba '{aba}' sem as colunas: {', '.join(faltando)}")
        linhas = []
        for posicao, (_, linha) in enumerate(df.iterrows()):
            registro = {c: _texto(linha.get(c)) for c in colunas}
            if any(registro.values()):
                linhas.append((posicao + 2, registro))
        return linhas

    def extrair_registros_aba(
        self, nome_aba: str, mes_referencia: str = ""
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Aba de insumos: ([insumos], []). Aba de composições: ([composições únicas], [itens]).
        Erros de linha não interrompem a leitura: ficam em `self.erros`.
        """
        if _normalizar(nome_aba) == _normalizar(ABA_INSUMOS):
            return self._insumos(nome_aba), []
        return self._composicoes(nome_aba)

    def _insumos(self, aba: str) -> List[Dict[str, Any]]:
        insumos: Dict[str, Dict[str, Any]] = {}
        for linha, r in self._linhas(aba, COLUNAS_INSUMOS):
            tipo = r["tipo"].upper()
            preco = _numero(r["preco"] or "0")
            problema = None
            if not r["codigo"] or not r["descricao"] or not r["unidade"]:
                problema = "código, descrição e unidade são obrigatórios"
            elif tipo not in TIPOS_INSUMO:
                problema = f"tipo '{r['tipo']}' inválido (use {', '.join(sorted(TIPOS_INSUMO))})"
            elif preco is None or preco < 0:
                problema = f"preço '{r['preco']}' inválido"
            if problema:
                self.erros.append(f"{aba}, linha {linha}: {problema}")
                continue
            insumos[r["codigo"]] = {
                "codigo": r["codigo"],
                "descricao": r["descricao"],
                "unidade": r["unidade"],
                "tipo": tipo,
                "preco": preco,
            }
        return list(insumos.values())

    def _composicoes(self, aba: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        composicoes: Dict[str, Dict[str, Any]] = {}
        itens: List[Dict[str, Any]] = []
        for linha, r in self._linhas(aba, COLUNAS_COMPOSICOES):
            if not r["codigo"] or not r["descricao"] or not r["unidade"]:
                self.erros.append(f"{aba}, linha {linha}: código, descrição e unidade da composição são obrigatórios")
                continue
            composicoes.setdefault(
                r["codigo"],
                {
                    "codigo": r["codigo"],
                    "descricao": r["descricao"],
                    "unidade": r["unidade"],
                    "grupo": r["grupo"] or None,
                },
            )
            if not (r["ref_fonte"] or r["ref_tipo"] or r["ref_codigo"] or r["coeficiente"]):
                continue  # composição sem itens nesta linha
            fonte, tipo = r["ref_fonte"].upper(), r["ref_tipo"].upper()
            coeficiente = _numero(r["coeficiente"])
            problema = None
            if fonte not in FONTES:
                problema = f"ref_fonte '{r['ref_fonte']}' inválida (use {', '.join(sorted(FONTES))})"
            elif tipo not in TIPOS_REF:
                problema = f"ref_tipo '{r['ref_tipo']}' inválido (use {', '.join(sorted(TIPOS_REF))})"
            elif not r["ref_codigo"]:
                problema = "ref_codigo é obrigatório"
            elif coeficiente is None or coeficiente <= 0:
                problema = f"coeficiente '{r['coeficiente']}' inválido (deve ser maior que zero)"
            if problema:
                self.erros.append(f"{aba}, linha {linha}: {problema}")
                continue
            itens.append(
                {
                    "composicao_codigo": r["codigo"],
                    "ref_fonte": fonte,
                    "ref_tipo": tipo,
                    "ref_codigo": r["ref_codigo"],
                    "coeficiente": coeficiente,
                }
            )
        return list(composicoes.values()), itens


def gerar_modelo_xlsx() -> bytes:
    """Planilha modelo com um exemplo de cada tipo de referência (própria, SINAPI e SEINFRA)."""
    insumos = pd.DataFrame(
        [
            ["INS-001", "Cimento CP-II 50kg", "SC", "MATERIAL", 34.9],
            ["INS-002", "Servente", "H", "MAO_DE_OBRA", 18.5],
        ],
        columns=COLUNAS_INSUMOS,
    )
    composicoes = pd.DataFrame(
        [
            ["COMP-001", "Argamassa de assentamento", "M3", "Argamassas", "PROPRIA", "INSUMO", "INS-001", 7.5],
            ["COMP-001", "Argamassa de assentamento", "M3", "Argamassas", "PROPRIA", "INSUMO", "INS-002", 6],
            ["COMP-001", "Argamassa de assentamento", "M3", "Argamassas", "SINAPI", "INSUMO", "370", 1.2],
            ["COMP-002", "Alvenaria de vedação", "M2", "Alvenaria", "PROPRIA", "COMPOSICAO", "COMP-001", 0.03],
            ["COMP-002", "Alvenaria de vedação", "M2", "Alvenaria", "SINAPI", "COMPOSICAO", "87495", 1],
        ],
        columns=COLUNAS_COMPOSICOES,
    )
    saida = BytesIO()
    with pd.ExcelWriter(saida, engine="openpyxl") as escritor:
        insumos.to_excel(escritor, sheet_name=ABA_INSUMOS, index=False)
        composicoes.to_excel(escritor, sheet_name=ABA_COMPOSICOES, index=False)
    return saida.getvalue()

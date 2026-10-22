import logging
import re
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from .base_excel_parser import BaseExcelParser

logger = logging.getLogger(__name__)

TIPO_PADRAO = "Sem Desoneração"

_RE_CODIGO = re.compile(r"^[A-Z]\d+$")
_RE_CABECALHO_COMPOSICAO = re.compile(r"^([A-Z]\d+)\s+-\s+(.+)$")
_RE_TABELA = re.compile(r"Tabela\s+(\d+(?:\.\d+)?)\s*-\s*ENC\.?\s*SOCIAIS\s*([\d.,]+)\s*%?", re.IGNORECASE)


class SeinfraExcelParser(BaseExcelParser):
    """
    Parser para as planilhas SEINFRA (Ceará). Cada tabela vem em dois arquivos:

    - Tabela de Insumos: linhas `Insumo | Descrição | Unidade | Valor (R$)`.
    - Relatório de Composições: blocos `C1802 - DESCRIÇÃO - UN` seguidos de itens
      `código | descrição | unidade | coeficiente | preço | total` e de `Valor Geral:`.
      O relatório pode continuar em outras abas (limite de linhas do .xls).

    Não há mês de referência nos arquivos: a tabela (ex.: "Tabela 028.1 - ENC. SOCIAIS 84,44%")
    é usada, de forma abreviada (ex.: "T028.1-84.44%"), como `mes_referencia`, o que também separa as versões de encargos sociais.
    """

    def __init__(self, file_content: bytes):
        super().__init__(file_content)
        self._linhas: Optional[List[List[Any]]] = None
        self._composicoes_cache: Optional[Tuple[List[dict], List[dict], List[dict]]] = None

    # ------------------------------------------------------------------
    # Leitura
    # ------------------------------------------------------------------

    def _ler_linhas(self) -> List[List[Any]]:
        """Todas as abas concatenadas, linhas com 6 colunas (None onde vazio)."""
        if self._linhas is None:
            linhas: List[List[Any]] = []
            for aba in self.sheet_names:
                df = self.ler_aba(aba, header=None, dtype=str)
                for valores in df.itertuples(index=False, name=None):
                    linha = [None if pd.isna(v) else str(v).strip() for v in valores[:6]]
                    linha += [None] * (6 - len(linha))
                    linhas.append(linha)
            self._linhas = linhas
        return self._linhas

    def eh_arquivo_composicoes(self) -> bool:
        for linha in self._ler_linhas()[:10]:
            if linha[1] and "composi" in linha[1].lower() and "relat" in linha[1].lower():
                return True
        return False

    @staticmethod
    def _numero(valor: Optional[str]) -> Optional[float]:
        """Células lidas como texto já vêm com ponto decimal (ex.: '152.8')."""
        if not valor:
            return None
        try:
            return float(valor)
        except ValueError:
            return None

    # ------------------------------------------------------------------
    # Contrato do BaseExcelParser
    # ------------------------------------------------------------------

    def identificar_abas_dados(self) -> List[str]:
        """Composições: a primeira aba representa o relatório inteiro (todas as abas são lidas juntas)."""
        if self.eh_arquivo_composicoes():
            return self.sheet_names[:1]
        return []

    def extrair_registros_aba(
        self, nome_aba: str, mes_referencia: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Composições e preços (coluna `ce`) do relatório de composições."""
        composicoes, precos, _ = self._extrair_composicoes(mes_referencia)
        return composicoes, precos

    def classificar_tipo_composicao(self, nome_aba: str) -> str:
        return TIPO_PADRAO

    def extrair_metadados(self, sheet_hint: Optional[str] = None) -> Dict[str, Any]:
        """O mês de referência é a identificação da tabela com os encargos sociais."""
        mes = "UNKNOWN"
        for linha in self._ler_linhas()[:10]:
            for celula in linha:
                m = _RE_TABELA.search(celula or "")
                if m:
                    # mes_referencia é varchar(15) no banco: formato curto, ex.: "T028.1-84,44%"
                    # sem vírgula: base_referencia do orçamento guarda vários meses separados por ","
                    mes = f"T{m.group(1)}-{m.group(2).replace(',', '.')}%"
                    break
            if mes != "UNKNOWN":
                break
        if mes == "UNKNOWN":
            raise ValueError(
                "Tabela SEINFRA não identificada: esperado 'Tabela NNN - ENC. SOCIAIS NN,NN%' no topo da planilha."
            )
        return {"mes_referencia": mes, "uf": "CE", "desoneracao": "Encargos incluídos"}

    # ------------------------------------------------------------------
    # Composições + analítico
    # ------------------------------------------------------------------

    def identificar_aba_analitico(self) -> Optional[str]:
        return self.sheet_names[0] if self.eh_arquivo_composicoes() else None

    def extrair_analitico(self, nome_aba: str, mes_referencia: str, fonte: str = "SEINFRA") -> List[Dict[str, Any]]:
        _, _, relacoes = self._extrair_composicoes(mes_referencia)
        for r in relacoes:
            r["fonte"] = fonte
        return relacoes

    def _extrair_composicoes(self, mes_referencia: str) -> Tuple[List[dict], List[dict], List[dict]]:
        if self._composicoes_cache is not None:
            return self._composicoes_cache

        composicoes: List[dict] = []
        precos: List[dict] = []
        itens: Dict[Tuple[str, str], dict] = {}

        pai: Optional[dict] = None
        total_simples: Optional[float] = None
        valor_geral: Optional[float] = None

        def fechar() -> None:
            nonlocal pai, total_simples, valor_geral
            if pai is None:
                return
            composicoes.append(pai)
            valor = valor_geral if valor_geral is not None else total_simples
            if valor is not None:
                precos.append(
                    {
                        "codigo_composicao": pai["codigo_composicao"],
                        "mes_referencia": mes_referencia,
                        "tipo_composicao": TIPO_PADRAO,
                        "ce": valor,
                    }
                )
            pai = None
            total_simples = valor_geral = None

        for c0, c1, c2, c3, _c4, c5 in self._ler_linhas():
            if c0:
                m = _RE_CABECALHO_COMPOSICAO.match(c0)
                if m:
                    fechar()
                    descricao, unidade = self._separar_unidade(m.group(2))
                    pai = {
                        "codigo_composicao": m.group(1),
                        "descricao": descricao,
                        "unidade": unidade,
                        "grupo": "SEINFRA",
                        "mes_referencia": mes_referencia,
                    }
                    continue
                if pai is not None and _RE_CODIGO.match(c0):
                    coef = self._numero(c3)
                    if coef is None:
                        continue
                    chave = (pai["codigo_composicao"], c0)
                    if chave in itens:
                        itens[chave]["quantidade_coeficiente"] += coef
                    else:
                        itens[chave] = {
                            "codigo_pai": pai["codigo_composicao"],
                            "codigo_filho": c0,
                            "quantidade_coeficiente": coef,
                            "mes_referencia": mes_referencia,
                            "descricao_filho": c1 or "",
                            "unidade_filho": c2 or "-",
                        }
                continue

            if pai is None:
                continue
            if c3 == "Total Simples:":
                total_simples = self._numero(c5)
            elif c3 == "Valor Geral:":
                valor_geral = self._numero(c5)

        fechar()

        logger.info("SEINFRA: %d composições, %d relações analíticas.", len(composicoes), len(itens))
        self._composicoes_cache = (composicoes, precos, list(itens.values()))
        return self._composicoes_cache

    @staticmethod
    def _separar_unidade(texto: str) -> Tuple[str, str]:
        """'DESCRIÇÃO ... - UN' -> ('DESCRIÇÃO ...', 'UN')."""
        corpo, sep, unidade = texto.rpartition(" - ")
        if sep and 0 < len(unidade.strip()) <= 10 and " " not in unidade.strip():
            return corpo.strip(), unidade.strip()
        return texto.strip(), "-"

    # ------------------------------------------------------------------
    # Insumos
    # ------------------------------------------------------------------

    def identificar_abas_precos_insumos(self) -> List[str]:
        return [] if self.eh_arquivo_composicoes() else self.sheet_names

    def extrair_precos_insumos(self, nome_aba: str, mes_referencia: str, fonte: str = "SEINFRA") -> List[dict]:
        """Preços (coluna `ce`) da tabela de insumos."""
        registros: Dict[str, dict] = {}
        for c0, _c1, _c2, c3, *_ in self._ler_linhas():
            if not c0 or not _RE_CODIGO.match(c0):
                continue
            valor = self._numero(c3)
            if valor is None:
                continue
            registros[c0] = {
                "codigo_insumo": c0,
                "mes_referencia": mes_referencia,
                "tipo_composicao": TIPO_PADRAO,
                "fonte": fonte,
                "ce": valor,
            }
        return list(registros.values())

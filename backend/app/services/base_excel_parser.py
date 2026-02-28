from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
from io import BytesIO

class BaseExcelParser(ABC):
    """
    Interface base para todos os parsers de planilhas de orçamentação.
    Define o contrato que cada implementação específica (SINAPI, SEINFRA, etc.) deve seguir.
    """

    def __init__(self, file_content: bytes):
        self._file_content = file_content
        self._xl = pd.ExcelFile(BytesIO(file_content))

    @property
    def sheet_names(self) -> List[str]:
        """Retorna os nomes de todas as abas do arquivo."""
        return self._xl.sheet_names

    def ler_aba(self, sheet_name: str, **kwargs) -> pd.DataFrame:
        """Lê uma aba do arquivo Excel como DataFrame."""
        return pd.read_excel(self._xl, sheet_name=sheet_name, **kwargs)

    @abstractmethod
    def identificar_abas_dados(self) -> List[str]:
        """Identifica quais abas contêm os dados principais de preços/composições."""
        pass

    @abstractmethod
    def extrair_registros_aba(
        self, 
        nome_aba: str, 
        mes_referencia: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Extrai composições e preços de uma aba específica.
        Returns: Tuple (lista_composicoes, lista_precos)
        """
        pass

    @abstractmethod
    def classificar_tipo_composicao(self, nome_aba: str) -> str:
        """Determina o tipo de composição (Ex: Com Desoneração, Sem Desoneração)."""
        pass

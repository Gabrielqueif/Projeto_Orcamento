from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import logging
from .base_excel_parser import BaseExcelParser
from app.services.sinapi_text_utils import remover_acentos, limpar_valor_moeda, normalizar_nome_aba, gerar_chave_match

logger = logging.getLogger(__name__)

class SeinfraExcelParser(BaseExcelParser):
    """
    Parser para arquivos Excel no formato SEINFRA (Ceará).
    Geralmente possui abas simples com colunas: Código, Descrição, Unidade, Preço.
    """

    def identificar_abas_dados(self) -> List[str]:
        """Identifica abas que não sejam instruções ou menus."""
        ignoradas = {"MENU", "INSTRUCOES", "CAPA", "OBS"}
        return [
            a for a in self.sheet_names 
            if not any(ign in a.upper() for ign in ignoradas)
        ]

    def extrair_registros_aba(
        self, 
        nome_aba: str, 
        mes_referencia: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Extrai dados de uma aba SEINFRA.
        Mapeia o preço encontrado para a coluna 'ce' (Ceará).
        """
        df = self.ler_aba(nome_aba, header=None)
        
        # Tenta encontrar a linha de cabeçalho
        header_row = -1
        col_cod = -1
        col_desc = -1
        col_unid = -1
        col_preco = -1

        for r_idx, row in df.head(15).iterrows():
            vals_clean = [gerar_chave_match(str(v)) for v in row.values]
            
            if "codigo" in vals_clean and "descricao" in vals_clean:
                header_row = r_idx
                for c_idx, v in enumerate(vals_clean):
                    if "codigo" in v: col_cod = c_idx
                    elif "descricao" in v: col_desc = c_idx
                    elif "unid" in v: col_unid = c_idx
                    elif any(kw in v for kw in ["preco", "valor", "custo", "total", "real"]):
                         if col_preco == -1 or "total" in v:
                            col_preco = c_idx
                break
        
        # Fallback se não achar cabeçalho explícito
        if header_row == -1:
            logger.info(f"Cabeçalho explícito não encontrado na aba {nome_aba}. Usando fallback.")
            header_row = 0
            col_cod = 0
            col_desc = 1
            col_unid = 2
            # Procurar coluna com valores numéricos no final
            col_preco = len(df.columns) - 1

        tipo_comp = self.classificar_tipo_composicao(nome_aba)
        df_dados = df.iloc[header_row + 1:]
        
        composicoes = []
        precos = []

        for _, row in df_dados.iterrows():
            cod_raw = row.iloc[col_cod]
            if pd.isna(cod_raw) or str(cod_raw).strip() == "" or str(cod_raw).strip().upper() == "TOTAL:":
                continue
            
            cod = str(cod_raw).replace('.0', '').strip()
            
            # SEINFRA: Insumos começam com 'I', Composições são numéricas.
            # Aceitamos ambos se tiverem pelo menos 3 caracteres ou forem claramente códigos
            if not (cod.replace('.', '').isdigit() or (cod.startswith('I') and len(cod) > 1)):
                continue

            desc_raw = row.iloc[col_desc] if col_desc != -1 else ""
            desc = str(desc_raw).strip() if not pd.isna(desc_raw) else ""
            if not desc or desc.upper() in ["MAO DE OBRA", "MATERIAIS", "EQUIPAMENTOS"]:
                continue

            unid_raw = row.iloc[col_unid] if col_unid != -1 else "-"
            unid = str(unid_raw).strip() if not pd.isna(unid_raw) else "-"
            
            composicao = {
                "codigo_composicao": cod,
                "descricao": desc,
                "unidade": unid,
                "grupo": "SEINFRA",
                "mes_referencia": mes_referencia
            }
            
            if col_preco != -1:
                val = limpar_valor_moeda(row.iloc[col_preco])
                if val is not None:
                    precos.append({
                        "codigo_composicao": cod,
                        "mes_referencia": mes_referencia,
                        "tipo_composicao": tipo_comp,
                        "ce": val
                    })
            
            composicoes.append(composicao)

        return composicoes, precos

    def classificar_tipo_composicao(self, nome_aba: str) -> str:
        """Define se é com ou sem desoneração baseado no nome da aba."""
        norm = normalizar_nome_aba(nome_aba).upper()
        if "SEM DES" in norm or "CSD" in norm:
            return "Sem Desoneração"
        if "COM DES" in norm or "CCD" in norm:
            return "Com Desoneração"
        return "Sem Desoneração"

    def extrair_metadados(self, sheet_hint: Optional[str] = None) -> Dict[str, Any]:
        """Extrai metadados básicos."""
        aba = sheet_hint or self.identificar_abas_dados()[0]
        df = self.ler_aba(aba, header=None, nrows=10)
        
        # SEINFRA costuma ter o mês no topo. Vamos tentar achar algo como "TABELA 28" ou "SET/2025"
        mes = "UNKNOWN"
        for _, row in df.iterrows():
            for val in row.values:
                val_s = str(val).upper()
                # Tentar achar algo como "Tabela: 028.1"
                if "TABELA:" in val_s:
                    mes = val_s.replace("TABELA:", "").strip()
                    break
                # Fallback para meses nominais
                if "/" in val_s and any(m in val_s for m in ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]):
                    mes = val_s
                    break
            if mes != "UNKNOWN": break
            
        return {
            "mes_referencia": mes,
            "uf": "CE", # SEINFRA é Ceará
            "desoneracao": "Consultar Aba"
        }

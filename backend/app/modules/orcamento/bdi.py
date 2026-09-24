from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, Dict, Any
import re

TipoBDI = Literal["ANALITICO", "SINTETICO"]
RegimeTributario = Literal["LUCRO_PRESUMIDO_REAL", "SIMPLES_NACIONAL"]
TipoBDIItem = Literal["PADRAO", "DIFERENCIADO"]

class BDIConfig(BaseModel):
    """
    Configuração analítica de BDI em conformidade com o Acórdão 2622/2013 do TCU.
    Todos os campos percentuais são expressos de 0 a 100 (ex: 4.0 para 4%).
    """
    regime_tributario: RegimeTributario = "LUCRO_PRESUMIDO_REAL"
    ac: float = Field(default=4.00, ge=0.0, le=100.0, description="Administração Central (%)")
    sg: float = Field(default=0.80, ge=0.0, le=100.0, description="Seguros e Garantias (%)")
    r: float = Field(default=1.20, ge=0.0, le=100.0, description="Riscos e Imprevistos (%)")
    df: float = Field(default=1.23, ge=0.0, le=100.0, description="Despesas Financeiras (%)")
    lucro: float = Field(default=7.40, ge=0.0, le=100.0, description="Lucro / Margem de Remuneração (%)")
    
    # Tributos (Lucro Presumido / Real)
    pis: float = Field(default=0.65, ge=0.0, le=100.0, description="PIS (%)")
    cofins: float = Field(default=3.00, ge=0.0, le=100.0, description="COFINS (%)")
    iss: float = Field(default=5.00, ge=0.0, le=100.0, description="ISS Municipal (%)")
    cprb: float = Field(default=0.00, ge=0.0, le=100.0, description="CPRB - Desoneração da Folha (%)")
    
    # Tributo Unificado (Simples Nacional)
    aliquota_simples: float = Field(default=0.00, ge=0.0, le=100.0, description="Alíquota efetiva Simples Nacional (%)")
    
    # BDI Diferenciado para Fornecimento de Materiais e Equipamentos de Vulto
    bdi_diferenciado: float = Field(default=15.00, ge=0.0, le=100.0, description="BDI Reduzido para Equipamentos/Materiais (%)")

    def calcular_impostos_total(self) -> float:
        """Retorna a alíquota total de tributos em porcentagem (0 a 100)."""
        if self.regime_tributario == "SIMPLES_NACIONAL":
            return self.aliquota_simples
        return self.pis + self.cofins + self.iss + self.cprb


def calcular_bdi_tcu(config: BDIConfig) -> float:
    """
    Aplica a fórmula oficial do TCU (Acórdão 2622/2013):
    BDI = [ ( (1 + AC + SG + R) * (1 + DF) * (1 + L) ) / (1 - I) ] - 1
    Retorna a alíquota em porcentagem arredondada a duas casas decimais (ex: 25.12).
    """
    impostos_total = config.calcular_impostos_total()
    if impostos_total >= 100.0:
        raise ValueError("A soma dos impostos (I) não pode ser igual ou superior a 100%.")

    ac_dec = config.ac / 100.0
    sg_dec = config.sg / 100.0
    r_dec = config.r / 100.0
    df_dec = config.df / 100.0
    l_dec = config.lucro / 100.0
    i_dec = impostos_total / 100.0

    numerador = (1.0 + ac_dec + sg_dec + r_dec) * (1.0 + df_dec) * (1.0 + l_dec)
    denominador = 1.0 - i_dec

    bdi_decimal = (numerador / denominador) - 1.0
    return round(bdi_decimal * 100.0, 2)


# Palavras-chave que indicam aquisição/fornecimento de equipamentos e materiais para BDI Diferenciado
KEYWORDS_BDI_DIFERENCIADO = [
    r"\bequipamento\b",
    r"\bequipamentos\b",
    r"\bfornecimento\b",
    r"\baquisicao\b",
    r"\baquisição\b",
    r"\bmaterial\b",
    r"\bmateriais\b",
    r"\bcompra de\b",
    r"\bgerador\b",
    r"\btransformador\b",
    r"\belevador\b",
    r"\bar condicionado\b",
    r"\bmobiliario\b",
    r"\bmobiliário\b",
]

REGEX_BDI_DIFERENCIADO = re.compile("|".join(KEYWORDS_BDI_DIFERENCIADO), re.IGNORECASE)

def determinar_tipo_bdi_item(tipo_composicao: Optional[str] = None, descricao: Optional[str] = None) -> TipoBDIItem:
    """
    Determina automaticamente se um item deve receber BDI Padrão (serviços)
    ou BDI Diferenciado (fornecimento de materiais/equipamentos relevantes).
    """
    texto_analise = f"{tipo_composicao or ''} {descricao or ''}".strip().lower()
    if not texto_analise:
        return "PADRAO"
        
    if REGEX_BDI_DIFERENCIADO.search(texto_analise):
        return "DIFERENCIADO"
        
    return "PADRAO"


# Faixas de referência de BDI do TCU (Acórdão 2622/2013) para Edifícios
FAIXAS_REFERENCIA_TCU = {
    "CONSTRUCAO_EDIFICIOS": {
        "ac": {"min": 3.00, "medio": 4.00, "max": 5.50},
        "sg": {"min": 0.80, "medio": 0.80, "max": 1.00},
        "r": {"min": 0.97, "medio": 1.27, "max": 1.27},
        "df": {"min": 0.59, "medio": 1.23, "max": 1.39},
        "lucro": {"min": 6.16, "medio": 7.40, "max": 8.96},
        "bdi_resultado": {"min": 20.34, "medio": 22.12, "max": 25.00}
    },
    "FORNECIMENTO_MATERIAIS_EQUIPAMENTOS": {
        "bdi_resultado": {"min": 11.10, "medio": 14.02, "max": 16.85}
    }
}

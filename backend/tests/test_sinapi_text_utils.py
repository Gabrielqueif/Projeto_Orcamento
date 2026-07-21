"""
Unit tests for sinapi_text_utils.py — pure functions, no mocks needed.

Covers: remover_acentos, limpar_link_excel, gerar_chave_match,
        limpar_valor_moeda, normalizar_nome_aba.
"""
import pytest

from app.modules.importacao.services.sinapi_text_utils import (
    gerar_chave_match,
    limpar_link_excel,
    limpar_valor_moeda,
    normalizar_nome_aba,
    remover_acentos,
)


# ---------------------------------------------------------------------------
# remover_acentos
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.parametrize("entrada, esperado", [
    ("Fundação",    "fundacao"),
    ("Análise",     "analise"),
    ("Descrição",   "descricao"),
    ("SEM ACENTO",  "sem acento"),
    ("já existe",   "ja existe"),
    ("",            ""),
    ("-",           "-"),
    (123,           "123"),    # não-string → converte para str
    (3.14,          "3.14"),   # float → str
])
def test_remover_acentos_normaliza_corretamente(entrada, esperado):
    # Act
    resultado = remover_acentos(entrada)
    # Assert
    assert resultado == esperado


# ---------------------------------------------------------------------------
# limpar_link_excel
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.parametrize("entrada, esperado", [
    # Texto simples — retorna intacto
    ("Alvenaria",                                         "Alvenaria"),
    ("",                                                  ""),
    ("-",                                                 "-"),
    # NaN do pandas
    (float("nan"),                                        ""),
    # Fórmula HYPERLINK com texto visível
    ('=HYPERLINK("http://example.com", "Clique aqui")',   "Clique aqui"),
    ('=HYPERLINK("url", "Texto Visivel")',                 "Texto Visivel"),
    # Fórmula sem HYPERLINK — remove = e aspas
    ('="texto simples"',                                  "texto simples"),
])
def test_limpar_link_excel_extrai_texto_visivel(entrada, esperado):
    # Act
    resultado = limpar_link_excel(entrada)
    # Assert
    assert resultado == esperado


# ---------------------------------------------------------------------------
# gerar_chave_match
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.parametrize("entrada, esperado", [
    ("Fundação de Concreto",                        "fundacaodeconcreto"),
    ("ALVENARIA",                                   "alvenaria"),
    ("123 Teste-ABC",                               "123testeabc"),
    ("!@#$%^&*()",                                  ""),   # só especiais → vazio
    ("",                                            ""),
    ('=HYPERLINK("url", "Concreto Simples")',        "concretosimples"),
])
def test_gerar_chave_match_retorna_chave_normalizada(entrada, esperado):
    # Act
    resultado = gerar_chave_match(entrada)
    # Assert
    assert resultado == esperado


# ---------------------------------------------------------------------------
# limpar_valor_moeda
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.parametrize("entrada, esperado", [
    # Valores numéricos diretos (int/float → retorna float)
    (10.5,          10.5),
    (100,           100.0),
    (0,             0.0),
    # Formato brasileiro (vírgula como decimal, ponto como milhar)
    ("1.234,56",    1234.56),
    ("200,00",      200.0),
    # Inválidos → None
    ("",            None),
    ("-",           None),
    ("nan",         None),
    ("NaN",         None),
    (float("nan"),  None),
])
def test_limpar_valor_moeda_converte_corretamente(entrada, esperado):
    # Act
    resultado = limpar_valor_moeda(entrada)
    # Assert
    assert resultado == esperado



# ---------------------------------------------------------------------------
# normalizar_nome_aba
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.parametrize("entrada, esperado", [
    ("Analítico",       "analitico"),
    ("CSD_TESTE",       "csd_teste"),
    ("  Com Espaço  ",  "com espaco"),
    ("MENU",            "menu"),
    (123,               "123"),
])
def test_normalizar_nome_aba_remove_acentos_e_normaliza(entrada, esperado):
    # Act
    resultado = normalizar_nome_aba(entrada)
    # Assert
    assert resultado == esperado

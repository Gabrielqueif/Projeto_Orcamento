"""Parser SEINFRA: relatório de composições (multi-aba) e tabela de insumos."""

from io import BytesIO

import pandas as pd
import pytest

from app.modules.importacao.services.seinfra_excel_parser import SeinfraExcelParser

TABELA = "Tabela 028.1 - ENC. SOCIAIS 84,44%"


def _excel(sheets: dict) -> bytes:
    out = BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        for nome, rows in sheets.items():
            pd.DataFrame(rows).to_excel(writer, sheet_name=nome, index=False, header=False)
    return out.getvalue()


@pytest.fixture
def composicoes():
    n = None
    pagina1 = [
        [n, "Relatório de Composições", n, n, n, n],
        [n, TABELA, n, n, n, n],
        ["C1802 - BOMBA CENTRÍFUGA DE 1/4 CV - UN", n, n, n, n, n],
        ["MAO DE OBRA", n, "Unidade", "Coeficiente", "Preço", "Total"],
        ["I0043", "AJUDANTE", "H", "8", "19.1", "152.8"],
        [n, n, n, n, "Total:", "152.8"],
        [n, n, n, "Total Simples:", n, "152.8"],
        [n, n, n, "Valor Geral:", n, "152.8"],
        ["C1803 - MURETA - M2", n, n, n, n, n],
        ["MATERIAIS", n, "Unidade", "Coeficiente", "Preço", "Total"],
        ["I0109", "AREIA", "M3", "0.5", "10", "5"],
        ["C0197", "ARGAMASSA", "M3", "0.25", "40", "10"],
    ]
    # a composição C1803 continua na segunda aba (limite de linhas do .xls)
    pagina2 = [
        ["I0109", "AREIA", "M3", "0.5", "10", "5"],
        [n, n, n, "Total Simples:", n, "20"],
        [n, n, n, "Valor Geral:", n, "20.5"],
    ]
    return SeinfraExcelParser(_excel({"orcamento": pagina1, "Page 2": pagina2}))


def test_metadados_identificam_tabela_e_encargos(composicoes):
    assert composicoes.extrair_metadados()["mes_referencia"] == TABELA


def test_composicoes_e_precos_atravessam_abas(composicoes):
    assert composicoes.identificar_abas_dados() == ["orcamento"]
    comps, precos = composicoes.extrair_registros_aba("orcamento", TABELA)
    assert [(c["codigo_composicao"], c["descricao"], c["unidade"]) for c in comps] == [
        ("C1802", "BOMBA CENTRÍFUGA DE 1/4 CV", "UN"),
        ("C1803", "MURETA", "M2"),
    ]
    assert {p["codigo_composicao"]: p["ce"] for p in precos} == {"C1802": 152.8, "C1803": 20.5}


def test_analitico_soma_item_repetido_e_aceita_filho_composicao(composicoes):
    rels = composicoes.extrair_analitico("orcamento", TABELA, fonte="SEINFRA")
    por_chave = {(r["codigo_pai"], r["codigo_filho"]): r for r in rels}
    assert por_chave[("C1802", "I0043")]["quantidade_coeficiente"] == 8.0
    assert por_chave[("C1803", "I0109")]["quantidade_coeficiente"] == 1.0
    assert por_chave[("C1803", "C0197")]["quantidade_coeficiente"] == 0.25
    assert por_chave[("C1802", "I0043")]["fonte"] == "SEINFRA"
    assert composicoes.identificar_abas_precos_insumos() == []


def test_insumos_viram_precos_ce():
    n = None
    parser = SeinfraExcelParser(
        _excel(
            {
                "insumos": [
                    [n, f"Tabela de Preço de Insumos / Serviços\n{TABELA}", n, "Data de Emissão:"],
                    ["COTAÇÃO / ALMOXARIFADO", n, n, n],
                    ["Insumo", "Descrição", "Unidade", "Valor (R$)"],
                    ["I0434", "CAIXA PRE-MOLDADA", "UN", "95.32"],
                    ["G0409", "INSPETOR", "MÊS", "6958.58"],
                ]
            }
        )
    )
    assert parser.extrair_metadados()["mes_referencia"] == TABELA
    assert parser.identificar_abas_dados() == []
    assert parser.identificar_aba_analitico() is None
    [aba] = parser.identificar_abas_precos_insumos()
    precos = parser.extrair_precos_insumos(aba, TABELA, fonte="SEINFRA")
    assert {p["codigo_insumo"]: p["ce"] for p in precos} == {"I0434": 95.32, "G0409": 6958.58}
    assert all(p["fonte"] == "SEINFRA" for p in precos)

import pytest
from app.modules.orcamento.bdi import (
    BDIConfig,
    calcular_bdi_tcu,
    determinar_tipo_bdi_item,
    FAIXAS_REFERENCIA_TCU
)

def test_calcular_bdi_tcu_padrao():
    config = BDIConfig(
        regime_tributario="LUCRO_PRESUMIDO_REAL",
        ac=4.00,
        sg=0.80,
        r=1.20,
        df=1.23,
        lucro=7.40,
        pis=0.65,
        cofins=3.00,
        iss=5.00,
        cprb=0.00
    )
    bdi = calcular_bdi_tcu(config)
    assert bdi == 26.16

def test_calcular_bdi_tcu_simples_nacional():
    config = BDIConfig(
        regime_tributario="SIMPLES_NACIONAL",
        ac=3.00,
        sg=0.50,
        r=1.00,
        df=1.00,
        lucro=8.00,
        aliquota_simples=8.50
    )
    bdi = calcular_bdi_tcu(config)
    # Numerador: (1 + 0.03 + 0.005 + 0.01) * (1 + 0.01) * (1 + 0.08)
    # = 1.045 * 1.01 * 1.08 = 1.139886
    # Denominador: 1 - 0.085 = 0.915
    # BDI = 1.139886 / 0.915 - 1 = 0.245777 -> 24.58%
    assert bdi == 24.58

def test_calcular_bdi_tcu_impostos_invalidos():
    config = BDIConfig(
        regime_tributario="LUCRO_PRESUMIDO_REAL",
        pis=50.0,
        cofins=50.0,
        iss=5.0
    )
    with pytest.raises(ValueError, match="não pode ser igual ou superior a 100%"):
        calcular_bdi_tcu(config)

def test_determinar_tipo_bdi_item():
    # Itens de fornecimento de equipamentos ou materiais devem ser DIFERENCIADO
    assert determinar_tipo_bdi_item("EQUIPAMENTO", "Fornecimento de gerador 50kVA") == "DIFERENCIADO"
    assert determinar_tipo_bdi_item("SERVICO", "Aquisição de transformador trifásico") == "DIFERENCIADO"
    assert determinar_tipo_bdi_item(None, "Fornecimento e instalação de elevador") == "DIFERENCIADO"
    assert determinar_tipo_bdi_item("MATERIAL", "Compra de tubos PEAD") == "DIFERENCIADO"

    # Serviços correntes e mão de obra devem ser PADRAO
    assert determinar_tipo_bdi_item("SERVICO", "Alvenaria de bloco cerâmico furado") == "PADRAO"
    assert determinar_tipo_bdi_item(None, "Pintura látex acrílica em teto") == "PADRAO"
    assert determinar_tipo_bdi_item(None, "Concretagem de laje maciça com bomba") == "PADRAO"
    assert determinar_tipo_bdi_item(None, None) == "PADRAO"

def test_faixas_referencia_tcu():
    assert "CONSTRUCAO_EDIFICIOS" in FAIXAS_REFERENCIA_TCU
    assert FAIXAS_REFERENCIA_TCU["CONSTRUCAO_EDIFICIOS"]["ac"]["medio"] == 4.00

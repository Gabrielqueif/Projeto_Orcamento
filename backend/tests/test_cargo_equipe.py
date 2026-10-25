from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.modules.equipe.schemas import CargoCreate, CargoUpdate, MembroEquipeCreate
from app.modules.equipe.services import CargoService, MembroEquipeService
from core.exceptions import ConflitoError

CARGO_ID = str(uuid4())
ELETRICISTA = {
    "id": CARGO_ID,
    "user_id": None,
    "nome": "Eletricista",
    "campos_ocultos": ["descricao"],
    "campos_extras": [
        {"chave": "nr10_validade", "rotulo": "Validade NR-10", "tipo": "data", "obrigatorio": True},
        {"chave": "anos", "rotulo": "Anos", "tipo": "numero", "obrigatorio": False},
    ],
}


@pytest.fixture
def membros():
    repo = MagicMock()
    repo.listar.return_value = []
    repo.criar.side_effect = lambda dados, _uid: dados
    cargos = MagicMock()
    cargos.buscar_por_id.return_value = ELETRICISTA
    return MembroEquipeService(repo, cargos)


def _membro(**kw):
    base = dict(nome="Ana", cpf="1", cargo_id=CARGO_ID, data_inicio="2026-01-01", remuneracao=3000)
    return MembroEquipeCreate(**{**base, **kw})


@pytest.mark.unit
def test_membro_com_cargo_guarda_nome_extras_e_zera_campo_oculto(membros):
    criado = membros.criar_membro(
        _membro(descricao="lixo", dados_extras={"nr10_validade": "2027-05-01", "anos": "4", "fora": "x"}), "u"
    )
    assert criado["cargo"] == "Eletricista"
    assert criado["descricao"] is None
    assert criado["dados_extras"] == {"nr10_validade": "2027-05-01", "anos": 4.0}


@pytest.mark.unit
def test_extra_obrigatorio_ausente(membros):
    with pytest.raises(ValueError, match="Validade NR-10"):
        membros.criar_membro(_membro(), "u")


@pytest.mark.unit
def test_extra_com_tipo_invalido(membros):
    with pytest.raises(ValueError, match="Validade NR-10"):
        membros.criar_membro(_membro(dados_extras={"nr10_validade": "amanhã"}), "u")


@pytest.mark.unit
def test_campo_base_oculto_nao_e_exigido(membros):
    membros.cargo_repository.buscar_por_id.return_value = {**ELETRICISTA, "campos_ocultos": ["cpf"], "campos_extras": []}
    assert membros.criar_membro(_membro(cpf=None), "u")["cpf"] is None


@pytest.mark.unit
def test_cargo_preexistente_nao_pode_ser_alterado():
    repo = MagicMock()
    repo.buscar_por_id.return_value = ELETRICISTA
    with pytest.raises(ConflitoError):
        CargoService(repo).atualizar_cargo(CARGO_ID, CargoUpdate(nome="X"), "u")
    with pytest.raises(ConflitoError):
        CargoService(repo).deletar_cargo(CARGO_ID, "u")


@pytest.mark.unit
def test_nome_de_cargo_duplicado():
    repo = MagicMock()
    repo.listar.return_value = [ELETRICISTA]
    with pytest.raises(ConflitoError):
        CargoService(repo).criar_cargo(CargoCreate(nome="eletricista"), "u")

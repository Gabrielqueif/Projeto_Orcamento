import pytest
from unittest.mock import MagicMock
from datetime import date
from uuid import uuid4
from app.modules.equipe.services import MembroEquipeService
from app.modules.equipe.schemas import MembroEquipeCreate, MembroEquipeUpdate

@pytest.fixture
def repository_mock():
    return MagicMock()

@pytest.fixture
def service(repository_mock):
    return MembroEquipeService(repository_mock)

@pytest.mark.unit
def test_criar_membro_success(service, repository_mock):
    user_id = str(uuid4())
    membro_in = MembroEquipeCreate(
        nome="José da Silva",
        cpf="123.456.789-00",
        cargo="Mestre de Obras",
        data_inicio=date(2026, 7, 17),
        descricao="Responsável pela equipe de concretagem",
        remuneracao=7500.0,
        status="ATIVO"
    )

    repository_mock.listar.return_value = [] # Nao tem codigos conflitantes
    repository_mock.criar.return_value = {"id": str(uuid4()), "nome": "José da Silva"}

    resultado = service.criar_membro(membro_in, user_id)

    assert resultado["nome"] == "José da Silva"
    repository_mock.criar.assert_called_once()
    # Verifica que o code foi gerado
    dados_criados = repository_mock.criar.call_args[0][0]
    assert "code" in dados_criados
    assert dados_criados["code"].startswith("#GP-0")
    assert repository_mock.criar.call_args[0][1] == user_id

@pytest.mark.unit
def test_buscar_membro_inexistente(service, repository_mock):
    user_id = str(uuid4())
    membro_id = str(uuid4())
    repository_mock.buscar_por_id.return_value = None

    with pytest.raises(ValueError, match="Membro da equipe não encontrado"):
        service.buscar_membro(membro_id, user_id)

@pytest.mark.unit
def test_atualizar_membro_success(service, repository_mock):
    user_id = str(uuid4())
    membro_id = str(uuid4())
    membro_update = MembroEquipeUpdate(
        nome="José da Silva Santos",
        remuneracao=8000.0
    )

    repository_mock.buscar_por_id.return_value = {"id": membro_id, "nome": "José da Silva"}
    repository_mock.atualizar.return_value = {"id": membro_id, "nome": "José da Silva Santos", "remuneracao": 8000.0}

    resultado = service.atualizar_membro(membro_id, membro_update, user_id)

    assert resultado["nome"] == "José da Silva Santos"
    assert resultado["remuneracao"] == 8000.0
    repository_mock.atualizar.assert_called_once()
    dados_atualizados = repository_mock.atualizar.call_args[0][1]
    assert dados_atualizados["nome"] == "José da Silva Santos"
    assert dados_atualizados["remuneracao"] == 8000.0

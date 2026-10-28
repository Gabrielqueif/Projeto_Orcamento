from unittest.mock import MagicMock

import pytest

from app.modules.busca.services import LIMITE_POR_GRUPO, BuscaService
from core.busca import sanitizar_termo

USER_ID = "user-123"


def _linhas(n: int, prefixo: str) -> list:
    return [{"id": f"{prefixo}-{i}", "nome": f"{prefixo} {i}", "escopo": f"{prefixo} {i}"} for i in range(n)]


@pytest.fixture
def repository_mock():
    repo = MagicMock()
    repo.buscar_obras.return_value = []
    repo.buscar_orcamentos.return_value = []
    repo.buscar_membros.return_value = []
    return repo


@pytest.fixture
def service(repository_mock):
    return BuscaService(repository_mock)


# --- sanitizar_termo ---


@pytest.mark.unit
def test_sanitizar_termo_remove_caracteres_perigosos():
    assert sanitizar_termo("a,b(c)d%e_f*g\\h'i\"j") == "abcdefghij"


@pytest.mark.unit
def test_sanitizar_termo_corta_no_limite_padrao_de_100():
    assert sanitizar_termo("a" * 150) == "a" * 100


@pytest.mark.unit
def test_sanitizar_termo_respeita_limite_informado():
    assert sanitizar_termo("abcdef", limite=3) == "abc"


@pytest.mark.unit
def test_sanitizar_termo_colapsa_espacos_e_remove_bordas():
    assert sanitizar_termo("  obra    da   ponte  ") == "obra da ponte"


@pytest.mark.unit
def test_sanitizar_termo_vazio_quando_nada_sobra():
    assert sanitizar_termo("") == ""
    assert sanitizar_termo("  ,,%_ ()  ") == ""


# --- BuscaService ---


@pytest.mark.unit
def test_buscar_limita_cada_grupo_a_cinco_itens(service, repository_mock):
    repository_mock.buscar_obras.return_value = _linhas(8, "obra")
    repository_mock.buscar_orcamentos.return_value = _linhas(7, "orc")
    repository_mock.buscar_membros.return_value = _linhas(9, "mem")

    resultado = service.buscar("ponte", USER_ID)

    assert len(resultado["obras"]) == LIMITE_POR_GRUPO == 5
    assert len(resultado["orcamentos"]) == 5
    assert len(resultado["membros"]) == 5


@pytest.mark.unit
def test_buscar_termo_curto_devolve_vazio_sem_consultar(service, repository_mock):
    resultado = service.buscar("a", USER_ID)

    assert resultado == {"obras": [], "orcamentos": [], "membros": []}
    repository_mock.buscar_obras.assert_not_called()
    repository_mock.buscar_orcamentos.assert_not_called()
    repository_mock.buscar_membros.assert_not_called()


@pytest.mark.unit
def test_buscar_nao_consulta_quando_sanitizado_fica_curto(service, repository_mock):
    # "a%" vira "a" depois de sanitizar: não pode chegar ao repositório
    resultado = service.buscar("a%", USER_ID)

    assert resultado == {"obras": [], "orcamentos": [], "membros": []}
    repository_mock.buscar_obras.assert_not_called()
    repository_mock.buscar_orcamentos.assert_not_called()
    repository_mock.buscar_membros.assert_not_called()


@pytest.mark.unit
def test_buscar_sempre_passa_o_user_id_recebido(service, repository_mock):
    service.buscar("ponte", "dono-do-token")

    for metodo in (repository_mock.buscar_obras, repository_mock.buscar_orcamentos, repository_mock.buscar_membros):
        metodo.assert_called_once()
        assert metodo.call_args.args[1] == "dono-do-token"


@pytest.mark.unit
def test_buscar_envia_termo_sanitizado_ao_repositorio(service, repository_mock):
    service.buscar("ob,ra (da) 'ponte'", USER_ID)

    termo_enviado = repository_mock.buscar_obras.call_args.args[0]
    assert termo_enviado == "obra da ponte"
    assert repository_mock.buscar_orcamentos.call_args.args[0] == "obra da ponte"
    assert repository_mock.buscar_membros.call_args.args[0] == "obra da ponte"


@pytest.mark.unit
def test_buscar_monta_href_de_obra_pelo_id_do_orcamento(service, repository_mock):
    repository_mock.buscar_obras.return_value = [
        {"id": "obra-1", "orcamento_id": "orc-9", "escopo": "Reforma", "cliente": "Ana"}
    ]

    resultado = service.buscar("reforma", USER_ID)

    assert resultado["obras"] == [{"id": "obra-1", "titulo": "Reforma", "subtitulo": "Ana", "href": "/obras/orc-9"}]

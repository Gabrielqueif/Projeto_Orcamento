"""Testes do perfil do usuário autenticado (GET/PATCH /perfil)."""

import pytest

from app.main import app
from core.security import get_current_user

LINHA_PERFIL = {
    "id": "test-user-id",
    "email": "test@example.com",
    "full_name": "Maria Silva",
    "cargo": "Engenheira civil",
    "username": "maria",
    "role": "user",
}


def _mock_update(mock_supabase, linhas):
    """Configura a cadeia table().update().eq().execute() e devolve o mock do update."""
    update = mock_supabase.table.return_value.update
    update.return_value.eq.return_value.execute.return_value.data = linhas
    return update


def _mock_select(mock_supabase, linhas):
    """Configura a cadeia table().select().eq().execute()."""
    select = mock_supabase.table.return_value.select
    select.return_value.eq.return_value.execute.return_value.data = linhas
    return select


def test_patch_com_role_no_corpo_e_rejeitado_sem_gravar(client, mock_supabase):
    """(a) `role` no corpo dá 422 (extra=forbid) e nenhuma escrita acontece."""
    update = _mock_update(mock_supabase, [LINHA_PERFIL])

    resposta = client.patch("/perfil", json={"full_name": "Maria Silva", "role": "admin"})

    assert resposta.status_code == 422
    update.assert_not_called()
    mock_supabase.table.assert_not_called()


def test_patch_envia_somente_nome_cargo_e_updated_at(client, mock_supabase):
    """(b) O update contém apenas full_name, cargo e updated_at, sem role; espaços são removidos."""
    update = _mock_update(mock_supabase, [LINHA_PERFIL])

    resposta = client.patch("/perfil", json={"full_name": "  Maria Silva  ", "cargo": "Engenheira civil"})

    assert resposta.status_code == 200
    mock_supabase.table.assert_called_with("profiles")
    dados_enviados = update.call_args.args[0]
    assert set(dados_enviados) == {"full_name", "cargo", "updated_at"}
    assert dados_enviados["full_name"] == "Maria Silva"
    assert dados_enviados["cargo"] == "Engenheira civil"
    assert dados_enviados["updated_at"] is not None


def test_patch_envia_apenas_o_campo_informado(client, mock_supabase):
    """(b, parcial) Informar só o cargo não envia full_name nem role."""
    update = _mock_update(mock_supabase, [LINHA_PERFIL])

    resposta = client.patch("/perfil", json={"cargo": "Engenheira civil"})

    assert resposta.status_code == 200
    assert set(update.call_args.args[0]) == {"cargo", "updated_at"}


def test_patch_filtra_sempre_pelo_id_do_usuario_autenticado(client, mock_supabase):
    """(c) Update e select usam o id de quem está autenticado, não um id vindo do corpo."""
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "usuario-123",
        "email": "outro@example.com",
        "app_metadata": {},
        "user_metadata": {},
    }
    update = _mock_update(mock_supabase, [{**LINHA_PERFIL, "id": "usuario-123"}])
    select = _mock_select(mock_supabase, [{**LINHA_PERFIL, "id": "usuario-123"}])

    resposta_patch = client.patch("/perfil", json={"full_name": "Outro Nome"})
    resposta_get = client.get("/perfil")

    assert resposta_patch.status_code == 200
    assert resposta_get.status_code == 200
    update.return_value.eq.assert_called_once_with("id", "usuario-123")
    select.return_value.eq.assert_called_once_with("id", "usuario-123")


def test_patch_sem_campos_dá_400(client, mock_supabase):
    """(d) Corpo vazio, ou com apenas null, dá 400 e não grava nada."""
    update = _mock_update(mock_supabase, [LINHA_PERFIL])

    resposta_vazia = client.patch("/perfil", json={})
    resposta_nulos = client.patch("/perfil", json={"full_name": None, "cargo": None})

    assert resposta_vazia.status_code == 400
    assert "Informe ao menos um campo" in resposta_vazia.json()["detail"]
    assert resposta_nulos.status_code == 400
    update.assert_not_called()


def test_get_sem_linha_em_profiles_nao_quebra(client, mock_supabase):
    """(e) Sem linha em profiles: 200 com e-mail do usuário autenticado, role 'user' e campos nulos."""
    _mock_select(mock_supabase, [])

    resposta = client.get("/perfil")

    assert resposta.status_code == 200
    assert resposta.json() == {
        "id": "test-user-id",
        "email": "test@example.com",
        "full_name": None,
        "cargo": None,
        "username": None,
        "role": "user",
    }


def test_get_devolve_campos_vazios_como_null(client, mock_supabase):
    """full_name e cargo vazios em profiles viram null na resposta."""
    _mock_select(mock_supabase, [{**LINHA_PERFIL, "full_name": "", "cargo": None}])

    resposta = client.get("/perfil")

    assert resposta.status_code == 200
    assert resposta.json()["full_name"] is None
    assert resposta.json()["cargo"] is None


@pytest.mark.parametrize("nome", ["A", "x" * 121])
def test_patch_valida_tamanho_do_nome(client, mock_supabase, nome):
    """full_name precisa ter de 2 a 120 caracteres."""
    update = _mock_update(mock_supabase, [LINHA_PERFIL])

    resposta = client.patch("/perfil", json={"full_name": nome})

    assert resposta.status_code == 422
    update.assert_not_called()


def test_patch_atualizado_devolve_perfil_com_role_do_banco(client, mock_supabase):
    """A resposta do PATCH traz o perfil atualizado (role vem do banco, nunca do corpo)."""
    _mock_update(mock_supabase, [{**LINHA_PERFIL, "full_name": "Novo Nome"}])

    resposta = client.patch("/perfil", json={"full_name": "Novo Nome"})

    assert resposta.status_code == 200
    assert resposta.json()["full_name"] == "Novo Nome"
    assert resposta.json()["role"] == "user"

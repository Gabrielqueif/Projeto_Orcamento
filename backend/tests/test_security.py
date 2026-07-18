"""
Unit tests for core/security.py — get_current_user.

A função usa supabase.auth.get_user(token) e retorna user.user.__dict__.
Mockamos o supabase client para simular tokens válidos, inválidos e expirados.
Como a função é async, usamos asyncio.run() para invocá-la de forma síncrona.
"""
import asyncio
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class _FakeUser:
    """Objeto simples que simula user.user do Supabase."""
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


def _make_mock_supabase(user_dict: dict | None):
    """Cria um MagicMock do supabase client com get_user configurado."""
    supabase = MagicMock()
    if user_dict is None:
        supabase.auth.get_user.return_value = MagicMock(user=None)
    else:
        fake_user = _FakeUser(**user_dict)
        supabase.auth.get_user.return_value = MagicMock(user=fake_user)
    return supabase


def _run_async(coro):
    """Executa uma corrotina de forma síncrona."""
    return asyncio.run(coro)


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_get_current_user_token_valido():
    """JWT válido → retorna payload com id e email."""
    from core.security import get_current_user

    # Arrange
    user_payload = {"id": "user-123", "email": "test@example.com"}
    mock_supabase = _make_mock_supabase(user_payload)

    # Act
    resultado = _run_async(get_current_user(token="valid-token", supabase=mock_supabase))

    # Assert
    assert resultado["id"] == "user-123"
    assert resultado["email"] == "test@example.com"
    mock_supabase.auth.get_user.assert_called_once_with("valid-token")


@pytest.mark.unit
def test_get_current_user_token_invalido_levanta_401():
    """supabase.auth.get_user lança exceção → HTTPException 401."""
    from core.security import get_current_user

    # Arrange
    mock_supabase = MagicMock()
    mock_supabase.auth.get_user.side_effect = Exception("Token inválido")

    # Act + Assert
    with pytest.raises(HTTPException) as exc_info:
        _run_async(get_current_user(token="invalid-token", supabase=mock_supabase))

    assert exc_info.value.status_code == 401


@pytest.mark.unit
def test_get_current_user_user_none_levanta_401():
    """supabase.auth.get_user retorna user=None → HTTPException 401."""
    from core.security import get_current_user

    # Arrange
    mock_supabase = _make_mock_supabase(None)  # user=None

    # Act + Assert
    with pytest.raises(HTTPException) as exc_info:
        _run_async(get_current_user(token="any-token", supabase=mock_supabase))

    assert exc_info.value.status_code == 401


@pytest.mark.unit
def test_get_current_user_response_none_levanta_401():
    """supabase.auth.get_user retorna None completo → HTTPException 401."""
    from core.security import get_current_user

    # Arrange
    mock_supabase = MagicMock()
    mock_supabase.auth.get_user.return_value = None

    # Act + Assert
    with pytest.raises(HTTPException) as exc_info:
        _run_async(get_current_user(token="any-token", supabase=mock_supabase))

    assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# create_access_token
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_create_access_token_default():
    """Cria um token com tempo de expiração padrão de 15 minutos e valida o payload."""
    from jose import jwt
    from core.security import create_access_token
    from core.config import settings

    payload = {"sub": "user-123"}
    token = create_access_token(payload)

    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "user-123"
    assert "exp" in decoded


@pytest.mark.unit
def test_create_access_token_custom_expiry():
    """Cria um token com expiração customizada."""
    from jose import jwt
    from datetime import timedelta
    from core.security import create_access_token
    from core.config import settings

    payload = {"sub": "user-456"}
    custom_delta = timedelta(hours=2)
    token = create_access_token(payload, expires_delta=custom_delta)

    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "user-456"
    assert "exp" in decoded


# ---------------------------------------------------------------------------
# require_admin
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_require_admin_app_metadata():
    """role=admin nos app_metadata -> acesso permitido."""
    from core.security import require_admin

    user = {
        "id": "u1",
        "app_metadata": {"role": "admin"},
        "user_metadata": {}
    }
    mock_supabase = MagicMock()

    resultado = require_admin(user, mock_supabase)
    assert resultado == user


@pytest.mark.unit
def test_require_admin_user_metadata():
    """role=admin nos user_metadata -> acesso permitido."""
    from core.security import require_admin

    user = {
        "id": "u1",
        "app_metadata": {},
        "user_metadata": {"role": "admin"}
    }
    mock_supabase = MagicMock()

    resultado = require_admin(user, mock_supabase)
    assert resultado == user


@pytest.mark.unit
def test_require_admin_profiles_table():
    """Verifica fallback na tabela profiles do Supabase."""
    from core.security import require_admin

    user = {
        "id": "user-profile-admin",
        "app_metadata": {},
        "user_metadata": {}
    }
    mock_supabase = MagicMock()
    # Mock supabase.table('profiles').select('role').eq('id', user_id).single().execute()
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {"role": "admin"}

    resultado = require_admin(user, mock_supabase)
    assert resultado == user
    mock_supabase.table.assert_any_call("profiles")


@pytest.mark.unit
def test_require_admin_users_table():
    """Verifica fallback na tabela users do Supabase."""
    from core.security import require_admin

    user = {
        "id": "user-users-admin",
        "app_metadata": {},
        "user_metadata": {}
    }
    mock_supabase = MagicMock()
    # Faz a primeira consulta à tabela profiles falhar e a segunda à tabela users retornar admin
    def side_effect(table_name):
        mock_query = MagicMock()
        if table_name == "profiles":
            mock_query.select.return_value.eq.return_value.single.return_value.execute.side_effect = Exception("Tabela inexistente")
        elif table_name == "users":
            mock_query.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {"role": "admin"}
        return mock_query

    mock_supabase.table.side_effect = side_effect

    resultado = require_admin(user, mock_supabase)
    assert resultado == user
    mock_supabase.table.assert_any_call("users")


@pytest.mark.unit
def test_require_admin_forbidden():
    """Não é admin em nenhum metadado ou tabela -> HTTPException 403."""
    from core.security import require_admin

    user = {
        "id": "user-not-admin",
        "app_metadata": {},
        "user_metadata": {}
    }
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {"role": "membro"}

    with pytest.raises(HTTPException) as exc_info:
        require_admin(user, mock_supabase)

    assert exc_info.value.status_code == 403
    assert "requer privilégios de administrador" in exc_info.value.detail


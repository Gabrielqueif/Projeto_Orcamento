import pytest
import sys
from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

import pandas as pd

# ---------------------------------------------------------------------------
# Path Setup — add backend root so `app`, `core`, `schemas` are importable
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Mock supabase module globally BEFORE importing the app so that
# `from supabase import create_client` inside app code doesn't fail.
mock_supabase_module = MagicMock()
sys.modules["supabase"] = mock_supabase_module

from app.main import app  # noqa: E402  (import after sys.path setup)
from app.dependencies import get_supabase  # noqa: E402
from core.security import get_current_user  # noqa: E402


# ---------------------------------------------------------------------------
# Shared infrastructure fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_supabase():
    """Creates a MagicMock to simulate the Supabase client."""
    return MagicMock()


@pytest.fixture
def client(mock_supabase):
    """
    FastAPI TestClient with dependency overrides:
    - Supabase client → MagicMock
    - Authentication → dummy admin user (no real JWT required)
    """
    def override_get_supabase():
        return mock_supabase

    def override_get_current_user():
        return {
            "id": "test-user-id",
            "email": "test@example.com",
            "app_metadata": {"role": "admin"},
            "user_metadata": {"role": "admin"},
        }

    app.dependency_overrides[get_supabase] = override_get_supabase
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Shared repository mock fixtures (used by service-level unit tests)
# Centralised here to avoid copy-pasting across multiple test files.
# ---------------------------------------------------------------------------

@pytest.fixture
def orcamento_repo_mock():
    """Mock for OrcamentoRepository."""
    return MagicMock()


@pytest.fixture
def item_repo_mock():
    """Mock for ItemRepository (composition catalogue)."""
    return MagicMock()


@pytest.fixture
def orcamento_item_repo_mock():
    """Mock for OrcamentoItemRepository."""
    return MagicMock()


@pytest.fixture
def etapa_repo_mock():
    """Mock for EtapaRepository."""
    return MagicMock()


# ---------------------------------------------------------------------------
# Shared service fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def orcamento_item_service(orcamento_item_repo_mock, orcamento_repo_mock, item_repo_mock):
    """
    OrcamentoItemService pre-wired with mocked repositories.
    Imported lazily to avoid circular import issues at collection time.
    """
    from app.services.orcamento_item_service import OrcamentoItemService
    return OrcamentoItemService(orcamento_item_repo_mock, orcamento_repo_mock, item_repo_mock)


# ---------------------------------------------------------------------------
# Shared test data fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sinapi_excel_content() -> bytes:
    """
    Generates a minimal valid SINAPI-like Excel file entirely in memory.
    Eliminates the dependency on a physical .xlsx file in the repository,
    making tests runnable in any environment (CI, Docker, fresh clone).

    Structure mimics what SinapiExcelParser expects:
      - Sheet name starting with CSD_
      - Row 3 (index 2): [empty, mes_referencia, uf, empty]
      - Row 4 (index 3): [empty, empty, empty, desoneracao_label]
      - Row 5 (index 4): [empty, empty, empty, estado_col]
      - Row 6 (index 5): header row with CODIGO, DESCRICAO, UNIDADE, <states>
      - Rows 7+: data rows
    """
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        data = [
            ["", "", "", ""],
            ["", "", "", ""],
            ["", "12/2025", "BR", ""],
            ["", "", "", "Sem Desoneração"],
            ["", "", "", "SP"],
            ["CODIGO", "DESCRICAO", "UNIDADE", "AC", "SP"],
            ["100", "Serviço de Teste 1", "UN", 10.0, 15.0],
            ["101", "Serviço de Teste 2", "M2", 20.0, 25.0],
        ]
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name="CSD_TESTE", index=False, header=False)
    return output.getvalue()

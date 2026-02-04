import pytest
import sys
from pathlib import Path
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

# Add root directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Mock supabase module globally before importing app
mock_supabase_module = MagicMock()
sys.modules["supabase"] = mock_supabase_module

from app.main import app
from app.dependencies import get_supabase
from core.security import get_current_user

@pytest.fixture
def mock_supabase():
    """
    Creates a MagicMock to simulate the Supabase client.
    """
    mock = MagicMock()
    return mock

@pytest.fixture
def client(mock_supabase):
    """
    TestClient with overridden dependencies for Supabase and Authentication.
    """
    def override_get_supabase():
        return mock_supabase

    def override_get_current_user():
        # Returns a dummy user to simulate an authenticated session
        return {"id": "test-user-id", "email": "test@example.com"}

    app.dependency_overrides[get_supabase] = override_get_supabase
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()

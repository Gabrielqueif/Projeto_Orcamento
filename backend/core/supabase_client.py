import threading

from supabase import Client, create_client

from core.config import settings


_local = threading.local()


def get_supabase_client() -> Client:
    """
    Retorna o cliente Supabase da thread atual.

    Um cliente por thread: o httpx compartilhado entre as threads do FastAPI falha
    sob requisições paralelas (WinError 10035 no Windows).

    Usa, por padrão, a SUPABASE_SERVICE_ROLE_KEY (mais permissiva) para uso no backend.
    Se não estiver definida, tenta usar a SUPABASE_ANON_KEY.
    """
    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not api_key:
        raise RuntimeError(
            "Chave do Supabase não configurada. Defina SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY no .env."
        )

    if not hasattr(_local, "client"):
        _local.client = create_client(settings.SUPABASE_URL, api_key)
    return _local.client

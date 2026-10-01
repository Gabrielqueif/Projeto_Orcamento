from functools import lru_cache

from supabase import Client, create_client

from core.config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Retorna uma instância singleton do cliente Supabase.

    Usa, por padrão, a SUPABASE_SERVICE_ROLE_KEY (mais permissiva) para uso no backend.
    Se não estiver definida, tenta usar a SUPABASE_ANON_KEY.
    """
    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not api_key:
        raise RuntimeError(
            "Chave do Supabase não configurada. Defina SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY no .env."
        )

    return create_client(settings.SUPABASE_URL, api_key)

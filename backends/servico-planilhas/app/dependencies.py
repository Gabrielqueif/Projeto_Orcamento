from core.supabase_client import get_supabase_client


def get_supabase():
    """
    Dependência do FastAPI para injetar o cliente do Supabase nas rotas.

    Exemplo de uso:

        from fastapi import Depends
        from app.dependencies import get_supabase

        @router.get("/exemplo")
        def exemplo(supabase = Depends(get_supabase)):
            data = supabase.table("minha_tabela").select("*").execute()
            return data.data
    """

    return get_supabase_client()



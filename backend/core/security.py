import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

from app.dependencies import get_supabase

logger = logging.getLogger("projeto_orcamento")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_current_user(token: str = Depends(oauth2_scheme), supabase: Client = Depends(get_supabase)) -> dict:
    """
    Valida o token JWT do Supabase e retorna o usuário atual.

    Função síncrona de propósito: a chamada ao Supabase é bloqueante e o FastAPI
    executa dependências `def` em threadpool, sem travar o event loop.
    """
    try:
        # Verifica se o usuario existe no supabase usando o token
        user = supabase.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido ou expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user.user.__dict__  # Retorna dados do usuario

    except Exception as e:
        logger.error(f"Erro na autenticação: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar as credenciais",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    """
    Exige role 'admin'. Fontes confiáveis: `app_metadata.role` (só o service role
    consegue alterar) e `profiles.role` (protegida por migração contra escrita do
    próprio usuário). `user_metadata` NÃO é aceito: o usuário edita esse campo.
    Qualquer falha na verificação nega o acesso.
    """
    if (user.get("app_metadata") or {}).get("role") == "admin":
        return user

    user_id = user.get("id")
    if user_id:
        try:
            response = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
            if response.data and response.data.get("role") == "admin":
                return user
        except Exception as e:
            logger.warning(f"Falha ao consultar role em profiles para {user_id}: {e}")

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado: requer privilégios de administrador"
    )

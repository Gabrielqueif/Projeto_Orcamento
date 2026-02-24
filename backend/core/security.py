import logging

from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from app.dependencies import get_supabase
from supabase import Client
from core.config import settings

logger = logging.getLogger("projeto_orcamento")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    supabase: Client = Depends(get_supabase)
) -> dict:
    """
    Valida o token JWT do Supabase e retorna o usuário atual.
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
            
        return user.user.__dict__ # Retorna dados do usuario
        
    except Exception as e:
        logger.error(f"Erro na autenticação: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar as credenciais",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_admin(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Verifica se o usuário tem a role 'admin'
    """
    # 1. Verifica metadados (App Metadata ou User Metadata)
    app_metadata = user.get('app_metadata', {})
    user_metadata = user.get('user_metadata', {})
    
    if app_metadata.get('role') == 'admin' or user_metadata.get('role') == 'admin':
        return user

    # 2. Verifica tabela 'profiles' (onde o frontend encontrou a role)
    user_id = user.get('id')
    if user_id:
        try:
            # Tenta buscar na tabela profiles
            response = supabase.table('profiles').select('role').eq('id', user_id).single().execute()
            if response.data and response.data.get('role') == 'admin':
                return user
        except Exception:
            # Ignora erro se tabela não existir ou usuario nao encontrado
            pass
            
        try:
            # Tenta buscar na tabela users (fallback comum)
            response = supabase.table('users').select('role').eq('id', user_id).single().execute()
            if response.data and response.data.get('role') == 'admin':
                return user
        except Exception:
            pass
    
    # Se chegou aqui, não é admin
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Acesso negado: requer privilégios de administrador"
    )

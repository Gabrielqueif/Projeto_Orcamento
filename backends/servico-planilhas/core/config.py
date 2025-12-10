from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Configurações do Banco de Dados (PostgreSQL / Supabase)
    SUPABASE_URL: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str


    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None

    # Define de onde carregar as variáveis (prioriza .env)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Cria uma instância das configurações para ser importada em outros lugares
settings = Settings()
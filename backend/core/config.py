from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Configurações do Banco de Dados (PostgreSQL / Supabase)
    SUPABASE_URL: str = ""
    DB_HOST: str = ""
    DB_PORT: int = 5432
    DB_NAME: str = ""
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # Segurança
    SECRET_KEY: str = "dev-only-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 dias

    # Produção
    CORS_ORIGINS: str = "*"  # Separar múltiplas origens por vírgula
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Define de onde carregar as variáveis (prioriza .env)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        """Retorna lista de origens CORS a partir da string separada por vírgula."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Cria uma instância das configurações para ser importada em outros lugares
settings = Settings()

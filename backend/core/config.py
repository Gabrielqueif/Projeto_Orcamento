from pydantic import model_validator
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

    # Produção
    CORS_ORIGINS: str = "*"  # Separar múltiplas origens por vírgula
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Importação de planilhas
    MAX_UPLOAD_MB: int = 25

    # Define de onde carregar as variáveis (prioriza .env)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def _validar_cors_em_producao(self):
        if self.ENVIRONMENT == "production" and (not self.cors_origins_list or "*" in self.cors_origins_list):
            raise ValueError("CORS_ORIGINS deve listar origens explícitas em produção (não use '*').")
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        """Retorna lista de origens CORS a partir da string separada por vírgula."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


# Cria uma instância das configurações para ser importada em outros lugares
settings = Settings()

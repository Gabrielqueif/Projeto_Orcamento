from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Configurações do Banco de Dados
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    
    # Define de onde carregar as variáveis (prioriza .env)
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

# Cria uma instância das configurações para ser importada em outros lugares
settings = Settings()
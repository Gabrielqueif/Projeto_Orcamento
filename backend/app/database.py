# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# 1. Monta a URL de Conexão (Formato PostgreSQL)
# O formato geral é: postgresql://USER:PASSWORD@HOST:PORT/NAME
SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.DB_USER}:{settings.DB_PASSWORD}"
    f"@{settings.SUPABASE_URL}:{settings.DB_PORT}/{settings.DB_NAME}"
)

# 2. Cria o Engine (O 'motor' de conexão)
# Note: o pool_size 5 e max_overflow 10 são valores razoáveis para iniciar
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_size=5, 
    max_overflow=10
)

# 3. Cria a Sessão de Banco de Dados
# sessionmaker é a classe que cria objetos Session que serão usados para interagir com o DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Cria a Base Declarativa
# Base é o objeto que os modelos do banco de dados irão herdar
Base = declarative_base()


# Função de Injeção de Dependência (Crucial para o FastAPI)
# Esta função abre e fecha a sessão do DB automaticamente
def get_db():
    db = SessionLocal()
    try:
        yield db  # Retorna a sessão para ser usada na rota
    finally:
        db.close() # Garante que a sessão será fechada após o uso
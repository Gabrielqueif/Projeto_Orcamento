# schemas.py

from pydantic import BaseModel # <--- GARANTA ESTA IMPORTAÇÃO

# O Pydantic valida e tipa os dados de entrada da sua API
class ItemCreate(BaseModel):
    # As propriedades devem corresponder às colunas da sua tabela SQL
    nome: str
    preco: float
    quantidade: int

    # Configuração opcional: permite usar objetos no formato de dicionário
    class Config:
        from_attributes = True
import pandas as pd
import sqlite3
import re

# Ler a base de dados
database = pd.read_excel("dados/referencia sinapi.xlsx")

# Conexão com a base de dados
conection = sqlite3.connect("backend/db.sqlite3")
cursor = conection.cursor()  # Criar o cursor
table = "api_insumos"

# Limpar os dados da tabela
cursor.execute(f"DELETE FROM {table}")
conection.commit()

# Reiniciar o ID da tabela
cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
conection.commit()

# Função para substituir pontos por vírgulas em valores numéricos


def processar_valor(valor):
    if pd.isna(valor):
        return None
    if isinstance(valor, (int, float)):
        return valor
    if isinstance(valor, str):
        # Verifica se é um número com ponto decimal
        if re.match(r'^\d+\.\d+$', valor):
            # Substitui ponto por vírgula
            return valor.replace('.', ',')
    return valor


# Inserir os dados no banco de dados
for _, row in database.iterrows():
    # Processar cada valor da linha
    data = [processar_valor(valor) for valor in row.tolist()]

    # Montar a query de inserção explicitamente
    query = f"""
    INSERT INTO {table} (
        classificacao, codigo_insumo, descricao_do_insumo, unidade, origem_de_preco,
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
        "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ) VALUES (
        ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    """
    # Executar a query com os valores
    cursor.execute(query, data)

# Salvar as alterações no banco de dados
conection.commit()

# Fechar o cursor e a conexão
cursor.close()
conection.close()

print("Dados inseridos com sucesso! Pontos substituídos por vírgulas nos valores numéricos.")

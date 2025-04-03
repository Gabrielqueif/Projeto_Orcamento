import pandas as pd
import sqlite3

# Ler a base de dados
database = pd.read_excel("dados/referencia sinapi.xlsx")

# Conexão com a base de dados
conection = sqlite3.connect("backend/db.sqlite3")
cursor = conection.cursor()  # Criar o cursor
table = "api_insumos"

# Limpar os dados da tabela
cursor.execute(f"DELETE FROM {table}")
conection.commit()

# Inserir os dados no banco de dados
for _, row in database.iterrows():
    # Obter os valores da linha como uma lista
    data = row.tolist()

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

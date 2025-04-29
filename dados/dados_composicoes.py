import pandas as pd
import sqlite3

# Configurações
excel_file = "dados/referencia_composicoes.xlsx"  # Caminho do arquivo Excel
db_file = "backend/db.sqlite3"  # Caminho do banco de dados SQLite
table_name = "api_composicoes"  # Nome da tabela no banco de dados

# Ler os dados do arquivo Excel
database = pd.read_excel(excel_file)

# Exibir as colunas e os primeiros dados para verificação
print("Colunas do arquivo Excel:", list(database.columns))
print("Primeiras linhas do arquivo Excel:")
print(database.head())

# Conectar ao banco de dados SQLite
conection = sqlite3.connect(db_file)
cursor = conection.cursor()

# Limpar os dados da tabela
cursor.execute(f"DELETE FROM {table_name}")
# Reiniciar IDs
cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table_name}'")
conection.commit()

# Inserir os dados no banco de dados
for _, row in database.iterrows():
    # Obter os valores da linha, ignorando a coluna de ID
    data = tuple(row.tolist())

    # Montar a query de inserção (excluindo a coluna `id`)
    placeholders = ", ".join(["?"] * len(data))  # Gera "?, ?, ?, ..."
    query = f"INSERT INTO {table_name} (grupo, codigo_composicao, tipo_item, codigo_item, descricao, unidade, coeficiente) VALUES ({placeholders})"

    # Executar a query
    cursor.execute(query, data)

# Salvar as alterações e fechar a conexão
conection.commit()
cursor.close()
conection.close()

print("Dados inseridos com sucesso!")

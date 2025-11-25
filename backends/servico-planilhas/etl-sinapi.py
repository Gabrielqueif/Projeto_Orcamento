import psycopg2
from psycopg2 import sql
import pandas as pd

# --- 1. CONFIGURAÇÃO (ATUALIZE COM SEUS DADOS) ---
# Você deve obter estas credenciais no Painel do Supabase (Database Settings)
DB_HOST = "sua-url-do-projeto.supabase.co" 
DB_PORT = "5432" 
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "sua_senha_do_database"

# --- 2. DADOS PARA INSERIR ---
# Os dados que você deseja inserir na tabela
dados_para_inserir = [
    ("Produto A", 10.50, 50),
    ("Produto B", 25.00, 100),
    ("Produto C", 5.99, 200)
]

# --- 3. FUNÇÃO DE INSERÇÃO ---
def inserir_dados_tabela(dados):
    conn = None
    try:
        # Conexão com o Banco de Dados
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cur = conn.cursor()

        # Nome da tabela no seu Supabase
        nome_tabela = "nome_da_sua_tabela" 
        # Colunas correspondentes aos dados acima
        colunas = ["nome", "preco", "quantidade"] 
        
        # Cria a string de comando SQL de forma segura
        # Note o uso de '%s' para substituição segura dos valores
        comando_sql = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
            sql.Identifier(nome_tabela),
            sql.SQL(', ').join(map(sql.Identifier, colunas)),
            sql.SQL(', ').join(sql.Placeholder() * len(colunas))
        )

        # Executa a inserção de múltiplos registros de uma vez
        cur.executemany(comando_sql, dados)
        
        # Confirma as alterações no banco de dados
        conn.commit()
        
        print(f"✅ {cur.rowcount} registros inseridos com sucesso na tabela '{nome_tabela}'.")

    except (Exception, psycopg2.Error) as error:
        print(f"❌ Erro ao conectar ou inserir dados: {error}")
        
    finally:
        # Fecha a conexão e o cursor
        if conn:
            cur.close()
            conn.close()
            print("Conexão com o PostgreSQL encerrada.")

# --- 4. EXECUÇÃO ---
if __name__ == "__main__":
    inserir_dados_tabela(dados_para_inserir)
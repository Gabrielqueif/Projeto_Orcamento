import uvicorn

if __name__ == "__main__":
    # O uvicorn.run() aceita os mesmos argumentos que você usaria no terminal
    #
    # Argumentos:
    # 1. "app.main:app": Aponta para o módulo 'app.main' e o objeto 'app'
    # 2. host: O endereço IP onde o servidor deve ouvir (0.0.0.0 para ser acessível externamente)
    # 3. port: A porta a ser usada (8000 é o padrão)
    # 4. reload: Habilita o recarregamento automático (ideal para desenvolvimento)
    
    uvicorn.run(
        "app.main:app",  # Lembre-se de ajustar este caminho se sua estrutura for diferente
        host="127.0.0.1",
        port=8000,
        reload=True
    )
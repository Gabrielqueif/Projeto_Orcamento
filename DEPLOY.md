# Guia de Implantação (Deployment)

Este projeto utiliza Docker e Docker Compose para facilitar a implantação e execução dos serviços (Frontend e Backend).

## Pré-requisitos

1.  **Docker** e **Docker Compose** instalados na máquina.
2.  Arquivo `.env` na raiz do projeto com as variáveis de ambiente necessárias (já criado automaticamente com base no backend).

## Estrutura dos Serviços

-   **Backend**: Python/FastAPI rodando na porta `8000`.
-   **Frontend**: Next.js rodando na porta `3000`.

## Configuração

O arquivo `docker-compose.yml` está configurado para ler as variáveis do arquivo `.env` na raiz. As principais variáveis são:

-   `SUPABASE_URL`: URL do seu projeto Supabase.
-   `SUPABASE_ANON_KEY`: Chave pública (anon) do Supabase.
-   `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Credenciais do banco de dados.

## Como Executar

### 1. Construir e Iniciar os Containers

Execute o seguinte comando na raiz do projeto:

```bash
docker-compose up -d --build
```

Isso irá:
1.  Construir as imagens do Frontend e Backend.
2.  Iniciar os containers em segundo plano.

### 2. Verificar os Logs

Para acompanhar o status e logs dos serviços:

```bash
docker-compose logs -f
```

### 3. Acessar a Aplicação

-   **Frontend**: Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.
-   **Backend API**: Acesse [http://localhost:8000/docs](http://localhost:8000/docs) para ver a documentação Swagger da API.

## Desenvolvimento

Para parar os serviços:

```bash
docker-compose down
```

Se fizer alterações no código, lembre-se de rodar `docker-compose up -d --build` novamente para reconstruir as imagens.

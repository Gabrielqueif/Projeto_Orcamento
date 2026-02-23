# Guia de Implantação (Deployment)

Este projeto utiliza Docker e Docker Compose para facilitar a implantação e execução dos serviços (Frontend, Backend e Nginx).

## Pré-requisitos

1.  **Docker** e **Docker Compose** instalados na máquina.
2.  Arquivo `.env` na raiz do projeto com as variáveis de ambiente necessárias.
    -   Use `.env.example` como referência: `cp .env.example .env`

## Estrutura dos Serviços

-   **Nginx**: Reverse proxy na porta `80` — roteia `/api/*` para o backend e `/` para o frontend.
-   **Backend**: Python/FastAPI com Gunicorn (4 workers Uvicorn).
-   **Frontend**: Next.js em modo standalone (build otimizado de produção).

## Configuração

### Variáveis de Ambiente

Copie o template e preencha com seus valores:

```bash
cp .env.example .env
```

As principais variáveis são:

| Variável | Descrição | Obrigatória |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase | ✅ |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Conexão PostgreSQL | ✅ |
| `DB_USER`, `DB_PASSWORD` | Credenciais do banco | ✅ |
| `SECRET_KEY` | Chave JWT (gerar com `python -c "import secrets; print(secrets.token_urlsafe(64))"`) | ✅ |
| `API_URL` | URL pública da API (ex: `https://meusite.com/api`) | ✅ |
| `CORS_ORIGINS` | Origens CORS separadas por vírgula | ⚙️ |
| `ENVIRONMENT` | `development` ou `production` | ⚙️ |
| `LOG_LEVEL` | Nível de log: `DEBUG`, `INFO`, `WARNING`, `ERROR` | ⚙️ |

## Deploy em Produção

### 1. Checklist Pré-Deploy

- [ ] `.env` configurado com todos os valores de produção
- [ ] `SECRET_KEY` gerada de forma segura (não usar o valor padrão!)
- [ ] `CORS_ORIGINS` configurado com os domínios reais
- [ ] `ENVIRONMENT=production` (desabilita Swagger Docs)
- [ ] Credenciais do banco de dados rotacionadas se necessário

### 2. Construir e Iniciar

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Isso irá:
1.  Construir as imagens do Frontend, Backend e Nginx.
2.  Iniciar os containers em segundo plano com restart automático.
3.  Nginx ficará acessível na porta `80`.

### 3. Verificar Status

```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl http://localhost/api/health
```

### 4. Acessar a Aplicação

-   **Frontend**: Acesse `http://seu-servidor` no navegador.
-   **Backend Health**: `http://seu-servidor/api/health`
-   **Swagger Docs**: Disponível apenas em `ENVIRONMENT=development`.

## Desenvolvimento Local

Para desenvolvimento, use o compose padrão com hot-reload:

```bash
docker-compose up -d --build
```

### Parar os Serviços

```bash
# Produção
docker-compose -f docker-compose.prod.yml down

# Desenvolvimento
docker-compose down
```

## Monitoramento

```bash
# Ver logs do backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Ver logs do nginx
docker-compose -f docker-compose.prod.yml logs -f nginx

# Restart de um serviço
docker-compose -f docker-compose.prod.yml restart backend
```

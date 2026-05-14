<h1 align="center">🏗️ Projeto Orçamento</h1>

<p align="center">
  Sistema completo para <strong>gestão e elaboração de orçamentos de construção civil</strong>, com suporte a composições de custo (SINAPI/SEINFRA), controle de obras, diário de obras, módulo financeiro e equipes.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

---

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Guia de Instalação](#-guia-de-instalação)
  - [Variáveis de Ambiente](#1-variáveis-de-ambiente)
  - [Executando com Docker (Recomendado)](#2-executando-com-docker-recomendado)
  - [Executando Manualmente](#3-executando-manualmente)
- [Deploy em Produção](#-deploy-em-produção)
- [Contribuição](#-contribuição)

---

## 🎯 Sobre o Projeto

O **Projeto Orçamento** é uma plataforma web desenvolvida para gerenciar todos os aspectos de um projeto de construção civil, desde a fase inicial de orçamentação até o acompanhamento da execução. O objetivo é aumentar a eficiência, reduzir custos e garantir a entrega pontual e dentro do orçamento de cada empreendimento.

A aplicação permite que gestores de obras e escritórios de engenharia:

- **Elaborem orçamentos detalhados** com base nas tabelas de referência oficiais (SINAPI e SEINFRA);
- **Gerenciem múltiplas obras** com controle de status, tipo e prazo;
- **Acompanhem o diário de obra** com registros de atividades;
- **Controlem o aspecto financeiro** com visualizações de custo e progresso;
- **Gerenciem as equipes** envolvidas em cada projeto.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 🔐 **Autenticação** | Login e cadastro seguros via Supabase Auth com proteção de rotas por middleware |
| 🏢 **Gestão de Obras** | Criação de obras com tipo de construção, BDI, status e base de referência regional |
| 📊 **Planilha Orçamentária** | Planilha hierárquica com etapas, subitens e cálculo automático de totais |
| 🔍 **Composições de Custo** | Busca e adição de insumos das bases SINAPI e SEINFRA por estado (UF) |
| 📤 **Importação de Bases** | Upload de planilhas Excel (SINAPI/SEINFRA) para popular as tabelas de referência |
| 📄 **Exportação PDF** | Geração de relatórios de orçamento em PDF diretamente pela interface |
| 📅 **Diário de Obra** | Registro cronológico de atividades e ocorrências por obra |
| 💰 **Módulo Financeiro** | Visão financeira consolidada por obra |
| 👥 **Gestão de Equipes** | Cadastro e associação de equipes às obras |
| ⚙️ **Área Admin** | Configurações avançadas e gestão de bases de dados de referência |

---

## 🚀 Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| [Next.js](https://nextjs.org/) | 14+ | Framework React com App Router |
| [TypeScript](https://www.typescriptlang.org/) | 5+ | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com/) | 3+ | Estilização utilitária |
| [Shadcn/UI](https://ui.shadcn.com/) | — | Componentes de UI acessíveis |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | 2+ | Autenticação e acesso ao banco |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | 0.100+ | Framework da API REST |
| [Python](https://www.python.org/) | 3.10+ | Linguagem principal |
| [Pydantic](https://docs.pydantic.dev/) | 2+ | Validação de schemas e configurações |
| [Supabase Python](https://supabase.com/docs/reference/python) | 2+ | Cliente do banco de dados |
| [Pandas](https://pandas.pydata.org/) | 2+ | Processamento de planilhas Excel |
| [fpdf2](https://pyfpdf.github.io/fpdf2/) | 2.7+ | Geração de PDFs |
| [Uvicorn / Gunicorn](https://www.uvicorn.org/) | — | Servidor ASGI |

### Infraestrutura
| Tecnologia | Uso |
|---|---|
| [Supabase](https://supabase.com/) | Banco de dados PostgreSQL + Auth |
| [Docker & Docker Compose](https://www.docker.com/) | Conteinerização dos serviços |
| [Nginx](https://www.nginx.com/) | Reverse proxy (produção) |

---

## 📂 Arquitetura do Projeto

O repositório é um **monorepo** com separação clara entre frontend, backend e infraestrutura:

```
Projeto_Orcamento/
│
├── 📁 frontend/                    # Aplicação Web (Next.js)
│   └── src/
│       ├── app/                    # Rotas (App Router)
│       │   ├── (dashboard)/        # Área autenticada
│       │   │   ├── obras/          # Gestão de obras e planilha orçamentária
│       │   │   ├── bases/          # Visualização das bases de referência
│       │   │   ├── financeiro/     # Módulo financeiro
│       │   │   ├── diario/         # Diário de obra
│       │   │   ├── equipe/         # Gestão de equipes
│       │   │   └── admin/          # Área administrativa
│       │   ├── auth/               # Callbacks de autenticação
│       │   ├── login/              # Página de login
│       │   └── signup/             # Página de cadastro
│       ├── components/             # Componentes reutilizáveis
│       │   ├── layout/             # Sidebar, TopHeader
│       │   ├── orcamentos/         # Componentes da planilha orçamentária
│       │   ├── bases/              # Componentes de busca de composições
│       │   ├── auth/               # Formulários de autenticação
│       │   ├── admin/              # Componentes da área admin
│       │   └── ui/                 # Primitivos de UI (Shadcn)
│       ├── contexts/               # Contextos React (ex: WizardContext)
│       ├── hooks/                  # Custom hooks
│       ├── lib/
│       │   └── api/                # Camada de acesso à API (fetch wrappers)
│       └── middleware.ts           # Proteção de rotas autenticadas
│
├── 📁 backend/                     # API REST (FastAPI)
│   └── app/
│       ├── main.py                 # Ponto de entrada, middlewares, rotas
│       ├── routes/                 # Endpoints HTTP
│       │   ├── orcamentos.py       # CRUD de orçamentos + exportação PDF
│       │   ├── orcamento_itens.py  # Itens e composições do orçamento
│       │   ├── etapas.py           # Etapas da obra
│       │   ├── itens.py            # Catálogo de insumos/composições
│       │   └── importacao.py       # Upload e processamento de planilhas
│       ├── services/               # Lógica de negócio
│       │   ├── orcamento_service.py
│       │   ├── orcamento_item_service.py
│       │   ├── item_service.py
│       │   ├── etapa_service.py
│       │   ├── import_service.py   # Orquestração do upload
│       │   ├── sinapi_excel_parser.py  # Parser para planilhas SINAPI
│       │   ├── seinfra_excel_parser.py # Parser para planilhas SEINFRA
│       │   └── pdf_service.py      # Geração de PDFs
│       ├── controllers/            # Handlers das requisições
│       ├── repositories/           # Acesso ao banco de dados (Supabase)
│       └── schemas/                # Schemas Pydantic (request/response)
│
├── 📁 nginx/                       # Configuração do reverse proxy
│   ├── nginx.conf
│   └── Dockerfile
│
├── 📁 scripts/                     # Scripts utilitários e deploy
│   ├── deploy.sh
│   └── webhook_listener.py
│
├── 📁 planilhas/                   # Planilhas Excel de referência (SINAPI/SEINFRA)
│
├── 🐳 docker-compose.yml           # Ambiente de desenvolvimento
├── 🐳 docker-compose.prod.yml      # Ambiente de produção
├── 📄 .env.example                 # Template de variáveis de ambiente
└── 📄 DEPLOY.md                    # Guia detalhado de deploy
```

### Fluxo de Dados

```
Usuário (Browser)
      │
      ▼
  Next.js Frontend (porta 3000)
      │  REST API calls (/api/...)
      ▼
  Nginx (porta 80 em produção)
      │  /api/* → backend
      ▼
  FastAPI Backend (porta 8000)
      │  Supabase Python Client
      ▼
  Supabase (PostgreSQL + Auth)
```

---

## 🔧 Pré-requisitos

Para executar o projeto, você precisa de:

- **Docker** e **Docker Compose** *(recomendado — método mais simples)*
- **OU**, para execução manual:
  - [Node.js](https://nodejs.org/) v18+
  - [Python](https://www.python.org/) v3.10+
- Uma conta e projeto criado no [Supabase](https://supabase.com/)

---

## 📦 Guia de Instalação

### 1. Variáveis de Ambiente

Clone o repositório e crie o arquivo `.env` a partir do template:

```bash
git clone https://github.com/seu-usuario/Projeto_Orcamento.git
cd Projeto_Orcamento
cp .env.example .env
```

Edite o `.env` e preencha com os valores do seu projeto Supabase:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Banco de Dados (PostgreSQL via Supabase)
DB_HOST=db.seu-projeto.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha

# API
API_URL=http://localhost/api

# Segurança — gere com: python -c "import secrets; print(secrets.token_urlsafe(64))"
SECRET_KEY=TROCAR_PARA_CHAVE_SEGURA

# CORS (em desenvolvimento pode usar *)
CORS_ORIGINS=*

# Ambiente
ENVIRONMENT=development
LOG_LEVEL=INFO
```

> ⚠️ **Nunca** commite o arquivo `.env` no repositório. Ele já está no `.gitignore`.

---

### 2. Executando com Docker (Recomendado)

Com o Docker instalado e o `.env` configurado, execute:

```bash
docker-compose up -d --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend (API) | http://localhost:8000 |
| Swagger / Docs | http://localhost:8000/docs |

Para parar os serviços:

```bash
docker-compose down
```

---

### 3. Executando Manualmente

#### Backend (FastAPI)

```bash
cd backend

# Crie e ative o ambiente virtual
python -m venv venv

# Windows
.\\venv\\Scripts\\activate
# Linux / macOS
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor com hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

O backend estará disponível em **http://localhost:8000** e a documentação interativa em **http://localhost:8000/docs**.

#### Frontend (Next.js)

Em um **novo terminal**:

```bash
cd frontend

# Crie o arquivo de variáveis do Next.js
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em **http://localhost:3000**.

---

## 🚀 Deploy em Produção

O projeto está pronto para produção com Docker e Nginx. Consulte o **[DEPLOY.md](./DEPLOY.md)** para o guia completo, que inclui:

- Checklist pré-deploy de segurança
- Configuração das variáveis de ambiente de produção
- Comandos para build e inicialização dos containers
- Monitoramento e logs dos serviços

**Resumo rápido:**

```bash
# Construir e iniciar em produção
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Health check
curl http://localhost/api/health
```

Em produção, o Nginx atua como reverse proxy: `/api/*` → backend, `/` → frontend.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Siga o fluxo padrão do GitHub:

1. Faça um **Fork** do projeto
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/minha-nova-feature
   ```
3. Faça o commit das suas mudanças:
   ```bash
   git commit -m 'feat: adiciona minha nova feature'
   ```
4. Faça o push para a branch:
   ```bash
   git push origin feature/minha-nova-feature
   ```
5. Abra um **Pull Request** descrevendo as alterações

---

<p align="center">
  Desenvolvido com ❤️ para a gestão eficiente de obras de engenharia civil
</p>

# 🏗️ Projeto Orçamento

Sistema moderno para gestão e elaboração de orçamentos de obras, com suporte a composições de custos e tabelas de referência (SINAPI).

## 🚀 Tecnologias Utilizadas

O projeto utiliza uma arquitetura moderna dividida em Frontend e Backend:

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Gerenciamento de Estado**: React Hooks
- **Autenticação**: Supabase Auth

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Validação**: Pydantic
- **Cliente HTTP**: Supabase Python Client

---

## 📂 Estrutura do Projeto

O repositório é um **monorepo** organizado da seguinte forma:

```bash
projeto-orcamento/
├── frontend/           # Aplicação Web (Next.js)
├── backend/            # API e Lógica de Negócio (FastAPI)
└── ...
```

---

## ⚙️ Como Executar o Projeto

Siga os passos abaixo para rodar a aplicação localmente.

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Python](https://www.python.org/) (v3.10 ou superior)
- Uma conta no [Supabase](https://supabase.com/) configurada.

### 1. Configurando o Backend

1. Entre na pasta do backend:
   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual (recomendado):
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na pasta `backend` baseando-se no exemplo (se houver) ou adicione:
     ```env
     SUPABASE_URL=sua_url_do_supabase
     SUPABASE_KEY=sua_chave_anon_ou_service_role
     ```

5. Inicie o servidor:
   ```bash
   uvicorn app.main:app --reload
   ```
   O backend estará rodando em `http://localhost:8000`.

### 2. Configurando o Frontend

1. Em um novo terminal, entre na pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env.local` na pasta `frontend` com as credenciais do Supabase:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
     ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O frontend estará acessível em `http://localhost:3000`.

---

## ✨ Funcionalidades Principais

- **Autenticação de Usuários**: Login e Cadastro seguros via Supabase.
- **Gestão de Orçamentos**: Criação, edição e listagem de orçamentos.
- **Composições de Custo**: Adição de itens e etapas aos orçamentos.
- **Integração SINAPI**: (Em desenvolvimento) Importação e uso de tabelas de referência.

---

## 🤝 Contribuição

1. Faça um Fork do projeto.
2. Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`).
3. Faça o Commit de suas mudanças (`git commit -m 'Adm: Adicionando nova feature'`).
4. Faça o Push para a Branch (`git push origin feature/MinhaFeature`).
5. Abra um Pull Request.

# Contexto do Projeto — Projeto Orçamento

> Documento de contexto gerado em 2026-10-21 a partir do código e do histórico git (branch `feat/seinfra-ce-bases-exclusao-orcamento`). Para detalhes de instalação, veja o `README.md`; para o backlog, `tasks.md`; para a marca e o design, `IDENTIDADE_VISUAL.md`.

## 1. O que é

Plataforma web para **elaboração de orçamentos e gestão de obras de construção civil**. Orça com base nas tabelas oficiais **SINAPI** (nacional, por UF) e **SEINFRA** (Ceará), calcula BDI e acompanha a execução: cronograma, almoxarifado, financeiro, equipes e diário de obra.

Público: gestores de obra, escritórios de engenharia e construtoras.

## 2. Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind 3, Radix/Shadcn, Chart.js, pnpm |
| Backend | Python 3.10+, FastAPI, Pydantic 2, pandas/openpyxl (planilhas), fpdf2 (PDF) |
| Dados e auth | Supabase (PostgreSQL + Auth), acessado via `supabase-py` no backend e `supabase-js` no frontend |
| Infra | Docker Compose (`docker-compose.yml` dev, `docker-compose.prod.yml` prod), Nginx como reverse proxy |
| Testes/CI | Pytest + Ruff (backend), Jest + RTL (frontend), GitHub Actions (`backend-ci`, `frontend-ci`, incluindo Gitleaks) |

## 3. Estrutura do repositório

```
Projeto_Orcamento/
├── backend/
│   ├── app/main.py            # app FastAPI, handlers de erro, CORS, registro de routers
│   ├── app/dependencies.py    # get_supabase
│   ├── app/modules/<dominio>/ # routes.py, schemas.py, services.py, repositories.py
│   ├── core/                  # config, exceptions, security (JWT/admin), ownership, supabase_client
│   ├── migrations/            # SQL aplicado manualmente no Supabase
│   ├── scripts/               # utilitários (scrape SINAPI, diagnósticos SEINFRA, import forçado)
│   └── tests/                 # ~35 arquivos de teste
├── frontend/src/
│   ├── app/(dashboard)/       # rotas autenticadas
│   ├── app/login, signup, auth/
│   ├── components/            # admin, auth, bases, common, dashboard, layout, obras, orcamentos, ui
│   └── lib/api/               # clientes REST (fetchWithAuth em client.ts)
├── planilhas/                 # planilhas SINAPI (.xlsx) e SEINFRA (.xls) de referência
├── .agents/                   # AGENTS.md e skills de papéis (tech lead, QA, segurança etc.)
├── tasks.md                   # backlog priorizado
└── .env.example
```

## 4. Backend

Arquitetura **modular por domínio** (routes → services → repositories). Módulos: `almoxarifado`, `composicao` (insumos/composições), `equipe` (equipes e membros), `etapa`, `financeiro` (inclui router de portfólio), `importacao`, `obra`, `orcamento` (itens, BDI em `bdi.py`, exportação PDF em `export.py`).

**Segurança**
- `get_current_user` valida o JWT chamando `supabase.auth.get_user`.
- `require_admin` aceita `app_metadata.role == "admin"` ou `profiles.role == "admin"`; **nunca** `user_metadata` (editável pelo usuário).
- `core/ownership.py` aplica propriedade: rotas com `orcamento_id` / `obra_id` no path só são acessíveis ao dono (`user_id` do registro).
- Em produção, `/docs` e `/redoc` ficam desligados e erros 500 não expõem detalhes; o handler de 500 devolve o header CORS para não mascarar o erro.

**Importação de bases** (`modules/importacao/services/`): `parser_factory` escolhe entre `sinapi_excel_parser` e `seinfra_excel_parser` (ambos herdam de `base_excel_parser`); `import_service` grava no banco e **falha explicitamente se nada for gravado**. Apenas admins importam.

## 5. Frontend

Rotas principais em `app/(dashboard)/`:

| Rota | Função |
|---|---|
| `/` | Dashboard |
| `/orcamentos`, `/orcamentos/novo`, `/orcamentos/[id]` | Lista (com exclusão), criação e planilha do orçamento |
| `/prazo/[id]` | Cronograma/prazo do orçamento (módulo separado) |
| `/obras`, `/obras/novo/etapa-2..3`, `/obras/[id]/{planilha,prazo,almoxarifado}` | Obras (wizard de criação) |
| `/bases`, `/bases/[id]` | Busca de insumos/composições SINAPI/SEINFRA |
| `/financeiro`, `/diario`, `/equipe`, `/docs` | Demais módulos |
| `/admin/sinapi` | Importação de bases (visível a admins na sidebar) |

Componentes de orçamento relevantes: `PlanilhaView`, `EtapasEstrutura`, `BdiConfigModal`, `CurvaAbcView`, `CronogramaFinanceiroView`, `InsumosDrawer`, `CompositionAutocomplete`.

## 6. Regras de negócio importantes

- **SEINFRA só vale para o estado CE.** No formulário de novo orçamento, as tabelas SINAPI e SEINFRA aparecem em grupos separados e a SEINFRA só é habilitada quando a UF é CE.
- **Bases SEINFRA** vêm em duas variantes de encargos sociais: T028 (114,15%) e T028.1 (84,44%). O `mes_referencia` é curto e sem vírgula (ex.: `T028.1-84.44%`) para caber em `varchar(15)` e não colidir com o separador usado em `base_referencia`.
- `orcamentos.base_referencia` é `text` e pode conter mais de uma base (migration `alter_orcamentos_base_referencia_text.sql`).
- **BDI** pode ser analítico e configurável por orçamento; há variáveis globais e memória de cálculo com fórmulas (variáveis 1D/2D/3D+, linhas de elementos).
- **Dias de execução** são calculados a partir do cronograma das etapas.
- Orçamento e obra pertencem a um usuário (`user_id`); acesso é restrito ao dono.

## 7. Banco de dados

Supabase/PostgreSQL. As migrations em `backend/migrations/*.sql` **não** usam ferramenta automática — são aplicadas manualmente. Cobrem: `user_id` em orçamentos/obras, almoxarifado, custos, equipes e membros, obras/baselines, `insumo_precos`, view de busca de insumos, constraints únicas, trigger/grants de `profiles` e correção de escalada de privilégio de `role`. Diretriz do projeto: nunca desabilitar RLS; toda tabela nova leva suas políticas.

## 8. Como rodar

```bash
cp .env.example .env        # preencher SUPABASE_*, DB_*, API_URL, CORS_ORIGINS, ENVIRONMENT, LOG_LEVEL
docker compose up --build   # frontend :3000, backend :8000
```

Manual: backend em `backend/` (`uvicorn app.main:app --reload`, testes com `pytest`, lint com `ruff`); frontend em `frontend/` (`pnpm install`, `pnpm dev`, `pnpm test`).

## 9. Convenções (de `.agents/AGENTS.md`)

- Sem placeholders/código incompleto; explicar o *porquê*, não o *o quê*; evitar comentários óbvios.
- Frontend: Server Components por padrão, `'use client'` só com interatividade, sem `any`, cliente Supabase correto por contexto.
- Backend: Pydantic com `response_model`, `Depends` para Supabase/JWT, `async def` em rotas com I/O (no código atual, dependências de auth são `def` de propósito).
- Supabase: selecionar colunas explícitas (evitar `select('*')`); regra de negócio multi-tabela fica no backend ou em Server Actions.
- Commits em Conventional Commits em português (`feat:`, `fix:`), PRs via GitHub (`Gabrielqueif/Projeto_Orcamento`).

## 10. Estado atual e histórico recente

Últimas entregas (mais recente primeiro):
1. SEINFRA restrita a CE, duas bases no formulário, exclusão de orçamento (commit `a5e9382`, branch atual, ainda sem PR/merge na `main`).
2. Aba Importação na sidebar para admins e correção do gráfico do cronograma.
3. Importação de planilhas SEINFRA (insumos e composições).
4. Dias de execução calculados pelo cronograma das etapas; botão Cronograma e módulo `/prazo/[id]`.
5. Busca de insumos e preços nas buscas de composição/insumo.

Backlog (`tasks.md`), em ordem de prioridade: conciliação almoxarifado × financeiro; filtros em `/financeiro/controle`; relatório PDF/CSV financeiro e Curva S; alertas de estoque mínimo; baixa de estoque por etapa; recálculo em lote de BDI; exportação do orçamento em Excel; apontamento de horas; testes E2E.

## 11. Pontos de atenção

- `tasks.md` cita Next.js 14; o projeto usa **Next.js 15** (README e `package.json`).
- O README descreve `nginx/` e `scripts/` (deploy, webhook listener) que **não aparecem** nos arquivos versionados — confirmar se existem.
- Migrations manuais: é preciso aplicá-las no Supabase em cada ambiente; não há controle de versão de schema aplicado.
- `.idea/` está sem rastreamento no git (considerar `.gitignore`).

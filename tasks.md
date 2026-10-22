# tasks.md — Planejamento Técnico e Tarefas Prioritárias

Documento elaborado pela liderança técnica (**Software Architect / Tech Lead**) mapeando o estado atual da arquitetura e listando as tarefas prioritárias divididas por módulos, com estimativas de impacto e prioridades para execução.

---

## 🏗️ Visão Arquitetural Atual

O **Projeto Orçamento** é composto por:
1. **Backend (FastAPI + Supabase):** Monólito modular estruturado em `app/modules/` (`orcamento`, `obra`, `etapa`, `item`, `almoxarifado`, `financeiro`, `equipe`, `importacao`).
2. **Frontend (Next.js 15 App Router + Tailwind CSS):** Organizado em rotas `(dashboard)` com componentes clientes interativos e clientes de API desacoplados em `src/lib/api/`.

---

## 📌 Tarefas Prioritárias

### 🔴 Alta Prioridade (Foco Imediato)

#### 1. Módulo Financeiro & Custos Reais
- [x] **[Backend] Conciliação Automática Almoxarifado x Financeiro:** *(entregue: lançamentos com `origem: "ALMOXARIFADO"` em `almoxarifado/services.py`)* Integrar a criação de saídas/entradas de insumos no canteiro para gerar lançamentos automáticos em `custos_despesas` com origem `ALMOXARIFADO`.
- [ ] **[Frontend] Filtros Avançados e Busca em `/financeiro/controle`:** Adicionar busca por palavra-chave na descrição e filtro por período/competência na tabela de lançamentos.
- [ ] **[Backend] Relatório PDF/CSV de Consolidação Financeira:** Endpoint para geração de relatório analítico de desvio orçamentário e Curva S financeira.

#### 2. Almoxarifado & Gestão de Suprimentos
- [ ] **[Frontend] Alertas de Estoque Mínimo:** Exibir badges visuais em `/obras/[id]/almoxarifado` para insumos que atingiram o limite crítico de reposição.
- [ ] **[Backend] Baixa Automática de Estoque por Etapa:** Integrar o progresso das etapas da obra (`/etapas/{id}/progresso`) com a sugestão de consumo dos insumos associados.

#### 3. Orçamento e Composições SINAPI
- [ ] **[Frontend/Backend] Atualização em Lote de Preços BDI:** Permitir recálculo dinâmico do orçamento total ao alterar alíquotas ou variáveis globais de BDI.
- [x] **[Frontend] Exportação da Planilha de Orçamento em Excel (.xlsx):** *(entregue: `GET /orcamentos/{id}/excel`)* Permitir o download da planilha analítica e sintética formatada para o cliente.

---

### 🟡 Média Prioridade (Melhoria Contínua & Escalabilidade)

#### 4. Equipe & Gestão de Alocação
- [x] **[Backend/Frontend] Diário de Obra:** *(entregue em `/diario`)* Módulo de controle de diário de obra com registro de presença da equipe por etapa.
- [ ] **[Backend] Métricas de Desempenho:** Cálculo de produtividade média por trabalhador/função comparando o planejado no orçamento x executado.

#### 5. Experiência do Usuário & Acessibilidade
- [x] **[Frontend] Tratamento Global de Erros (Error Boundaries):** Adicionar telas amigáveis de fallback para erros de rede ou exceções 500 em todas as rotas do dashboard.
- [x] **[Frontend] Notificações Toast Persistentes:** Implementar sistema unificado de feedback de sucesso/erro para ações de salvamento e exclusão.

---

### 🟢 Baixa Prioridade (Débito Técnico & Infraestrutura)

#### 6. Testes & Qualidade
- [ ] **[QA Backend] Cobertura de Testes para `financeiro` e `almoxarifado`:** Expandir a suíte do Pytest cobrindo edge cases de saldo negativo e transações simultâneas.
- [ ] **[QA Frontend] Testes E2E (Playwright/Cypress):** Testes das jornadas principais: Criação de Orçamento -> Geração de Obra -> Lançamento de Custos.

---

## 🎯 Próximo Passo Sugerido

O roadmap vigente está em `PLANO_IMPLEMENTACAO.md` (bases próprias, UX e qualidade). Do backlog acima seguem em aberto os alertas de estoque mínimo, a baixa de estoque por etapa, o recálculo em lote de BDI e o relatório financeiro.
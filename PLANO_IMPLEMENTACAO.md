# Plano de Implementação por Fases

> Levantamento de 2026-10-22, feito sobre a `main` (`82f755c`). Complementa o `CONTEXTO.md` e substitui a priorização do `tasks.md`, que está desatualizado.

## 1. Saúde atual

| Verificação | Resultado |
|---|---|
| `pytest` (backend) | 416 passaram, 1 pulado, cobertura de 78% (mínimo exigido: 70%) |
| `ruff check` (backend) | **72 erros** (61 corrigíveis com `--fix`) |
| `tsc --noEmit` (frontend) | sem erros |
| `pnpm lint` (frontend) | 0 erros, 92 avisos |

## 2. Pontos de atenção

### Corrigir já (dados ou comportamento errados)

1. **O almoxarifado grava dados fictícios no banco.** Quando a obra não tem estoque, `obras/[id]/almoxarifado/page.tsx` (linhas ~100–190) cria insumos com `quantidade_atual = 85%` do orçado e mínimo de 20%. Se o orçamento não tem itens, cria uma lista fixa (Cimento CP-II, Aço CA-50…). Também cria locações fictícias (betoneira, gerador) com devolução em 2024. Esses dados vão para o banco do usuário como se fossem reais e entram na conciliação com o financeiro.
2. **A lista de bases disponíveis pode vir incompleta.** `GET /importacao/bases` lê a tabela `composicao` inteira sem paginação. O Supabase limita a resposta a 1000 linhas, então meses mais antigos ou outras fontes podem sumir. O endpoint também não seleciona `tipo_composicao`, por isso todas as bases aparecem como "Sem Desoneração". Falta confirmar se ele exige autenticação.
3. **`/bases` é estática e ignora o id.** A página mostra só um card SINAPI fixo. `bases/[id]` sempre abre a busca SINAPI, então a SEINFRA não pode ser consultada ali. `databaseCard` importa `Link` de `next/dist/client/link` (caminho interno do Next) e coloca um `<button>` dentro do link.

### Telas com conteúdo de demonstração

4. `/docs` e `/docs/[id]` usam projetos fictícios fixos no código ("Residencial Aurora Sky" e outros), mas aparecem no menu como se fossem funcionais.
5. A rota `/teste` é uma sobra de desenvolvimento e continua acessível.

### Qualidade e UX

6. Existem 34 chamadas `alert(` no frontend, embora o projeto já tenha um componente de toast (`components/common/toast.tsx`).
7. Não há `error.tsx`/`loading.tsx` por rota, só o `ErrorBoundary` global do layout.
8. Os 72 erros do Ruff precisam ser zerados para o CI não depender de exceções.

### Documentação e repositório

9. O `tasks.md` está defasado. A conciliação almoxarifado → financeiro já existe (`origem: "ALMOXARIFADO"` em `almoxarifado/services.py`), a exportação em Excel já existe (`GET /orcamentos/{id}/excel`) e o diário de obra foi entregue. O arquivo também ainda cita Next.js 14.
10. O `CONTEXTO.md` ainda descreve a branch `feat/seinfra-…` como atual. `.idea/` e `founder/` não estão no `.gitignore`.
11. As migrations são aplicadas manualmente, sem registro do que já foi aplicado em cada ambiente. Isso pesa mais agora, porque a Fase 3 cria tabelas novas.

## 3. Fases

### Fase 1 — "Custos" vira "Bases de Dados" (pequena, sem migration)

Objetivo: o item do menu passa a mostrar as bases disponíveis.

- **Sidebar:** troca `{ href: "/financeiro", label: "Custos" }` por `{ href: "/bases", label: "Bases de Dados" }`. O financeiro continua acessível pela obra (`/obras/[id]` → `/financeiro/[id]`), que é onde ele faz sentido, porque é por obra. A rota `/financeiro` (portfólio) continua existindo, só sai do menu.
- **Backend `GET /importacao/bases`:** agrupa no banco (`select distinct` via view ou RPC `listar_bases`) em vez de ler linhas soltas. Devolve `fonte`, `mes_referencia`, `tipo_composicao`, a quantidade de composições e insumos e a data da importação. Exige usuário autenticado.
- **Frontend `/bases`:** cards gerados a partir desse endpoint, agrupados por fonte (SINAPI nacional, SEINFRA-CE), com mês, desoneração e contagens. Mantém um estado vazio com link para `/admin/sinapi` quando o usuário é admin.
- **`/bases/[id]`:** usa o id da fonte (`sinapi` ou `seinfra`) para abrir a busca correta, com o `fonte` repassado ao `ItemSearch`.
- Corrige o import de `Link` e o `<button>` aninhado no `databaseCard`.
- **Testes:** pytest do endpoint agrupado e teste de página do `/bases`.

### Fase 2 — Higiene de dados e telas fictícias

- Remove a semeadura fictícia do almoxarifado. Com estoque vazio, mostra um estado vazio com a ação "Importar insumos do orçamento", que cria os insumos com **quantidade atual 0** e deixa o usuário informar o estoque real. Remove as locações fictícias.
- Em `/docs`: esconde do menu até existir backend, ou marca como "em breve". A recomendação é esconder.
- Remove `/teste`.
- Corrige o Ruff (`ruff check --fix` mais ajustes manuais).
- Atualiza o `tasks.md` e o `CONTEXTO.md` e adiciona `.idea/` ao `.gitignore`.

### Fase 3 — Base de dados própria: modelo e API (precisa de migration)

**Ideia:** a base própria é mais uma `fonte`, ao lado de SINAPI e SEINFRA, mas pertence ao usuário. A composição própria pode usar insumos próprios **e** insumos ou composições oficiais com coeficiente, como numa CPU (composição de preço unitário) de verdade.

**Migration `create_bases_proprias.sql`, com RLS por dono em todas as tabelas e sem acesso `anon`:**

| Tabela | Colunas principais |
|---|---|
| `bases_proprias` | `id`, `user_id`, `nome`, `descricao`, `uf`, `data_referencia`, `created_at`, `updated_at` |
| `base_propria_insumos` | `id`, `base_id`, `codigo`, `descricao`, `unidade`, `tipo` (MATERIAL / MAO_DE_OBRA / EQUIPAMENTO / SERVICO), `preco` · único (`base_id`, `codigo`) |
| `base_propria_composicoes` | `id`, `base_id`, `codigo`, `descricao`, `unidade`, `grupo` · único (`base_id`, `codigo`) |
| `base_propria_composicao_itens` | `id`, `composicao_id`, `ref_fonte` (PROPRIA / SINAPI / SEINFRA), `ref_tipo` (INSUMO / COMPOSICAO), `ref_codigo`, `coeficiente` |

- **Preço da composição própria** = Σ (coeficiente × preço da referência). Para referências oficiais, o preço vem da UF, do mês e da desoneração do orçamento, pelo `ItemRepository.buscar_preco` e pela busca de insumos que já existem. Uma composição própria pode conter outra própria, com detecção de ciclo.
- **Novo módulo `app/modules/base_propria/`** (routes → services → repositories, igual aos demais): CRUD de base, insumos, composições e itens, `GET .../composicoes/{id}/preco?uf=&mes=&tipo=` para calcular o preço e duplicação de base.
- **Importação em lote:** modelo `.xlsx` simples (aba Insumos, aba Composições com coeficientes) reaproveitando `base_excel_parser`. Qualquer usuário pode importar para a **própria** base; a importação das bases oficiais continua só para admin.
- **Segurança:** a posse é checada no `core/ownership.py`, como já é feito para obra e orçamento. Os testes cobrem o caso de um usuário tentando ler a base de outro.

### Fase 4 — Base própria: telas

- `/bases` ganha a seção **"Minhas bases"**, com o botão **Nova base**, ao lado das oficiais (Fase 1).
- `/bases/propria/[id]` tem duas abas:
  - **Insumos:** tabela editável com busca e importação de planilha.
  - **Composições:** lista e editor da composição. O usuário adiciona linhas buscando em insumos próprios, insumos SINAPI/SEINFRA ou composições, informa o coeficiente e vê o subtotal e o total calculados para uma UF/mês de referência.
- Baixa do modelo `.xlsx` de importação.

### Fase 5 — Base própria dentro do orçamento

- **Seleção:** no orçamento novo ou na planilha, a base própria aparece como fonte adicional. `orcamentos.base_referencia` já aceita várias bases (`text`). O item ganha `base_propria_id` em `orcamento_itens` (**migration**), e `fonte = "PROPRIA"`.
- **Inclusão de item:** `OrcamentoService` (em torno de `services.py:494`) ganha um ramo para `PROPRIA`. Ele resolve a composição na base do usuário, calcula o preço pela Fase 3 e preenche `orcamento_item_insumo` (o analítico) a partir dos itens da composição. Assim a Curva ABC, o cronograma e o PDF/Excel funcionam sem mudanças.
- **Preço congelado:** o item grava o preço no momento da inclusão, como já acontece hoje. Mudanças na base não alteram orçamentos existentes sem querer. Fica disponível uma ação **"Atualizar preços da base própria"** no orçamento, com prévia da diferença.
- `CompositionAutocomplete` / `ComposicaoSearchSelect` buscam também nas bases próprias do usuário, com um selo "Própria".
- O PDF e o Excel mostram "Fonte: <nome da base própria>" nos itens.
- **Testes:** inclusão de item próprio, preço com insumo SINAPI dentro da composição própria, atualização em lote e isolamento entre usuários.

### Fase 6 — UX e qualidade

- Troca os `alert(` pelo toast. Cria `error.tsx` e `loading.tsx` nas rotas principais.
- Reduz os avisos do ESLint.
- E2E com Playwright da jornada "criar base própria → usar no orçamento → gerar obra".
- Continua o backlog do `tasks.md` revisado: alertas de estoque mínimo, baixa de estoque por etapa, recálculo em lote de BDI e relatório financeiro.

## 4. Ordem e dependências

```
Fase 1 ──► Fase 3 ──► Fase 4 ──► Fase 5
Fase 2 (independente, pode correr junto com a 1)
Fase 6 (contínua)
```

As fases 3 e 5 têm migrations. Elas param para aprovação antes de serem aplicadas no Supabase.

## 5. Decisões em aberto

1. A base própria é **por usuário** ou deve ser **compartilhada por empresa/equipe**? O plano assume por usuário (`user_id`), seguindo o padrão atual. Compartilhar exigiria um conceito de organização, que o projeto ainda não tem.
2. A base própria deve ter **versões por mês** (como SINAPI) ou um preço vigente único com data de referência? O plano assume preço único e duplicação de base para criar uma "versão".
3. O `/financeiro` (portfólio) sai do menu de vez ou vira um item dentro de "Obras"?

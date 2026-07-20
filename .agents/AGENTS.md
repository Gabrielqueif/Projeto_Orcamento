# Diretrizes de Fluxo e Desenvolvimento do Projeto

## 🚀 Ferramentas e Rascunhos (LM Studio)
* Sempre que for solicitado a geração de códigos extensos, novas funções ou novos componentes, utilize primeiramente a ferramenta do MCP `lm-studio-local/openai_chat` para gerar a estrutura/rascunho inicial do código. Depois, revise e finalize a escrita do arquivo no projeto utilizando suas ferramentas nativas.

## 💬 Comunicação e Alinhamento

* **Sem Códigos Incompletos:** Nunca utilize placeholders como `// implemente o resto aqui` ou `...` em trechos cruciais. Se o código for muito longo, use a estratégia de rascunho com o LM Studio primeiro, mas entregue o arquivo final completo.
* **Validação de Premissas:** Se uma instrução for ambígua ou faltarem dados sobre a arquitetura atual do projeto, pergunte ou liste as premissas assumidas antes de começar a escrever o código.
* **Explicações Concisas:** Foque o texto explicativo no *porquê* das decisões de design e arquitetura, e não no *o que* o código faz (o código limpo deve ser autoexplicativo).

## 🔄 Ciclo de Desenvolvimento (Passo a Passo)

1. **Planejamento:** Antes de criar arquivos, mapeie quais arquivos existentes serão afetados e descreva brevemente a arquitetura proposta.
2. **Drafting (LM Studio):** Para lógicas complexas, algoritmos pesados ou novos componentes, gere o rascunho inicial via MCP `lm-studio-local/openai_chat`.
3. **Escrita Local:** Aplique o rascunho no projeto utilizando as ferramentas nativas de escrita de arquivo.
4. **Verificação de Quebras:** Sempre revise se a nova implementação quebra a retrocompatibilidade com as funções existentes.

## 📐 Padrões de Engenharia de Software

* **Tratamento de Erros:** Todo fluxo assíncrono ou integração com APIs externas deve conter blocos `try/catch` robustos, com logs limpos e tratamento amigável para o usuário final.
* **Clean Code:** Priorize funções pequenas, com responsabilidade única (Single Responsibility Principle) e nomes de variáveis altamente descritivos.
* **Comentários:** Evite comentários óbvios. Comente apenas regras de negócio complexas ou hacks necessários por limitações de bibliotecas de terceiros.

## 💻 Padrões Frontend (Next.js & TypeScript)

* **Architecture:** Priorize Server Components (`app/` router) para busca de dados inicial e componentes estáticos. Use `'use client'` estritamente onde houver interatividade (hooks, states, events).
* **Supabase Client:** Sempre utilize o cliente correto dependendo do contexto: `createClient` adaptado para Server Components/Server Actions ou o cliente de Client Components para evitar vazamento de credenciais.
* **Typing:** Nunca utilize `any`. Use os tipos gerados automaticamente pelo CLI do Supabase para tipar as respostas do banco (`Database['public']['Tables'][...]['Row']`).

## 🐍 Padrões Backend (FastAPI & Pydantic)

* **Asynchronicity:** Utilize `async def` para rotas que fazem chamadas I/O (como queries no Supabase ou requisições HTTP) para não bloquear o event loop do FastAPI.
* **Schemas (Pydantic):** Toda entrada e saída de dados das rotas deve ser explicitamente validada usando modelos Pydantic (`BaseModel`). Use `response_model` nos decorators das rotas para garantir a segurança dos dados trafegados.
* **Dependency Injection:** Utilize o sistema de `Depends` do FastAPI para gerenciar a inicialização do cliente Supabase, validação de tokens JWT do Supabase Auth e injeção de escopos de segurança.

## 🗄️ Integração e Banco de Dados (Supabase)

* **Bypass de RLS:** Nunca sugira desabilitar Row Level Security (RLS) em tabelas de produção. Toda nova tabela deve vir acompanhada de suas respectivas políticas de segurança.
* **Consultas Otimizadas:** No frontend ou backend, selecione explicitamente as colunas necessárias (`.select('id, name')`) em vez de trazer o objeto inteiro (`.select('*')`) para economizar banda e memória.
* **Business Logic:** Regras de negócio complexas que envolvem múltiplas tabelas devem ser centralizadas em Server Actions (Next.js) ou rotas dedicadas no FastAPI, evitando que o Client Component manipule dados sensíveis diretamente.
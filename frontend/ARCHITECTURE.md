# Documentação de Arquitetura - Frontend (Projeto Orçamento)

Esta documentação define a arquitetura, padrões e boas práticas adotadas no desenvolvimento do frontend do **Projeto Orçamento**.

## 1. Stack Tecnológica

O projeto adota tecnologias modernas e performáticas, visando escalabilidade e facilidade de manutenção:

- **Framework:** Next.js 15 (App Router)
- **Biblioteca de UI:** React 19
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4 (com PostCSS e suporte a animações `tw-animate-css`)
- **Componentes Base:** Radix UI e Lucide React (Ícones)
- **Comunicação de Dados:** Fetch API (encapsulada) com suporte ao Supabase (`@supabase/supabase-js` e `@supabase/ssr`)
- **Testes:** Jest e React Testing Library

---

## 2. Estrutura de Diretórios (`/src`)

A estrutura segue uma divisão clara de responsabilidades, baseada no **App Router** do Next.js:

- `app/`: Contém as rotas da aplicação, layouts (como `(dashboard)`) e configuração global (ex: `globals.css`).
- `components/`: Componentes reutilizáveis, divididos em domínios (`admin`, `auth`, `orcamentos`, `layout`, `ui`). A pasta `ui/` deve conter os componentes genéricos de UI (botões, inputs, modais).
- `hooks/`: Custom hooks para encapsular lógica de estado e efeitos do React.
- `lib/`: Configurações de bibliotecas externas, clientes (Supabase) e utilitários de comunicação com a API.
- `utils/`: Funções utilitárias e *helpers* genéricos.

---

## 3. Comunicação com a API (Camada de Serviços)

Para garantir uma arquitetura limpa, toda a comunicação externa deve passar pela camada `/lib/api/`. **Nunca faça chamadas `fetch` diretas dentro dos componentes visuais.**

### 3.1 Como as funções devem ser estruturadas:
A camada de API deve exportar funções que retornam `Promises` tipadas. O uso de um *wrapper* customizado (como `fetchWithAuth` em `lib/client.ts`) é obrigatório para padronizar headers, tratamento básico de erros e injeção de tokens (JWT).

**Exemplo Prático (Definição - `src/lib/api/orcamentos.ts`):**
```typescript
import { fetchWithAuth } from "./client";

export interface Orcamento {
  id: string;
  nome: string;
  cliente: string;
  // ...outros campos omitidos por brevidade
}

export async function getOrcamentos(status?: string): Promise<Orcamento[]> {
  const url = status ? `/orcamentos/?status=${status}` : '/orcamentos/';
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar orçamentos");
  }

  return response.json();
}
```

### 3.2 Como a API deve ser chamada nos Componentes:
Nos componentes React (tipicamente com a diretiva `"use client"` se usarem estado), as funções da camada de API devem ser injetadas através de `useEffect` (para busca inicial) ou atreladas a eventos de usuário (ex: `onClick`).

**Exemplo Prático (Chamada):**
```tsx
"use client";
import { useEffect, useState } from "react";
import { getOrcamentos, Orcamento } from "@/lib/api/orcamentos";

export default function ListaOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getOrcamentos();
        setOrcamentos(data);
      } catch (error) {
        console.error("Falha ao carregar:", error);
        // Implementar feedback visual de erro (ex: Toast)
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) return <p>Carregando...</p>;

  return (
    <ul>
      {orcamentos.map((o) => (
        <li key={o.id}>{o.nome}</li>
      ))}
    </ul>
  );
}
```

---

## 4. Boas Práticas de Arquitetura e Desenvolvimento

> [!IMPORTANT]
> A manutenção de um código escalável exige o cumprimento rígido destas práticas por todos os desenvolvedores envolvidos no projeto.

### 4.1. Server Components vs Client Components
O Next.js 15 utiliza **React Server Components (RSC)** por padrão.
- **Server Components:** Use sempre que possível (sem o `"use client"`). São ideais para páginas não interativas, acesso direto a serviços no lado do servidor e SEO. Melhoram a performance reduzindo o JavaScript enviado ao cliente.
- **Client Components:** Utilize `"use client"` no topo do arquivo apenas quando o componente precisar usar hooks de estado/ciclo de vida (`useState`, `useEffect`, `useContext`) ou depender de interatividade direta com eventos DOM (`onClick`, `onChange`).

### 4.2. Atomicidade e Composição (Clean Code)
- Mantenha os componentes pequenos, puros e focados em uma única responsabilidade.
- Caso um componente ultrapasse ~200 linhas de código, analise a extração da sua UI ou lógica para subcomponentes ou *custom hooks*.
- Evite *prop drilling* excessivo. Em vez de passar `props` por múltiplos níveis de componentes não relacionados, faça uso do React Context ou de estratégias de composição (`children`).

### 4.3. Gerenciamento de Estilos (Tailwind CSS)
- Evite atributos de estilo *inline* (`style={{...}}`).
- Use os utilitários de construção de classes, como o `clsx` e `tailwind-merge` (já nas dependências), sempre que precisar aplicar estilos condicionais ou mesclar classes enviadas via `props`, prevenindo conflitos (especialmente valioso para componentes da pasta `components/ui/`).
- Utilize variáveis semânticas do projeto de design que devem estar contidas no `globals.css`.

### 4.4. Tipagem Estrita (TypeScript)
- Defina `Interfaces` ou `Types` rigorosos para todos os dados que transitam da API.
- Crie `Interfaces` para as propriedades (`Props`) de todos os componentes.
- A regra geral é banir completamente o uso do tipo `any`. Se o tipo da variável é temporariamente desconhecido em tempo de compilação, use `unknown` em conjunto com *Type Guards*.

### 4.5. Reatividade e Formulários
- Utilize o controle semântico de formulários do HTML em harmonia com React. Para formulários extensos e complexos, utilize a união de React Hook Form + Zod (para validação de schema) com a intenção de minimizar *re-renders* e centralizar as regras de validação no cliente antes do envio à API.

---

## 5. Mapeamento de Telas e Endpoints Necessários

Para guiar a construção ou manutenção da API no Backend, abaixo está o mapeamento detalhado das áreas do Frontend e as respectivas chamadas de API (`fetchWithAuth`) que precisam corresponder a um endpoint.

### 5.1. Módulo de Obras / Orçamentos (`/obras`)
Gerenciamento de nível raiz dos orçamentos (obras).
- **Listar Obras:** `getOrcamentos(status, cliente, nome)` 
  -> **Endpoint Esperado:** `GET /orcamentos/` (com query params opcionais)
- **Buscar Detalhe da Obra:** `getOrcamento(id)` 
  -> **Endpoint Esperado:** `GET /orcamentos/{id}`
- **Criar Obra:** `createOrcamento(data: OrcamentoCreate)` 
  -> **Endpoint Esperado:** `POST /orcamentos/`
- **Atualizar Obra:** `updateOrcamento(id, data: OrcamentoUpdate)` 
  -> **Endpoint Esperado:** `PUT /orcamentos/{id}`
- **Excluir Obra:** `deleteOrcamento(id)` 
  -> **Endpoint Esperado:** `DELETE /orcamentos/{id}`
- **Exportar PDF:** `downloadOrcamentoPDF(id)` 
  -> **Endpoint Esperado:** `GET /orcamentos/{id}/pdf` (Deve retornar um *Blob*/arquivo binário)

### 5.2. Gestão Interna do Orçamento (Etapas e Itens)
As ações executadas dentro da tela de detalhes de um orçamento (ex: `obras/[id]/planilha`).
- **Listar Etapas:** `getEtapas(orcamentoId)` 
  -> **Endpoint Esperado:** `GET /orcamentos/{id}/etapas`
- **Criar Etapa:** `createEtapa(orcamentoId, data: EtapaCreate)` 
  -> **Endpoint Esperado:** `POST /orcamentos/{id}/etapas`
- **Atualizar Etapa:** `updateEtapa(orcamentoId, etapaId, data: EtapaUpdate)` 
  -> **Endpoint Esperado:** `PUT /orcamentos/{id}/etapas/{etapaId}`
- **Excluir Etapa:** `deleteEtapa(orcamentoId, etapaId)` 
  -> **Endpoint Esperado:** `DELETE /orcamentos/{id}/etapas/{etapaId}`
- **Listar Itens/Composições:** `getItens(orcamentoId)` 
  -> **Endpoint Esperado:** `GET /orcamentos/{id}/itens`
- **Adicionar Item:** `addItem(orcamentoId, data: OrcamentoItemCreate)` 
  -> **Endpoint Esperado:** `POST /orcamentos/{id}/itens`
- **Atualizar Item:** `updateItem(orcamentoId, itemId, data: OrcamentoItemUpdate)` 
  -> **Endpoint Esperado:** `PUT /orcamentos/{id}/itens/{itemId}`
- **Excluir Item:** `deleteItem(orcamentoId, itemId)` 
  -> **Endpoint Esperado:** `DELETE /orcamentos/{id}/itens/{itemId}`

### 5.3. Importação e Bases de Dados (SINAPI / Própria)
Telas dedicadas à atualização de índices, tabelas de preço e importação de planilhas.
- **Listar Bases (ex: SINAPI):** `getSinapiBases()` 
  -> **Endpoint Esperado:** `GET /importacao/bases`
- **Upload de Planilha (Extração de Metadados):** `uploadWorksheet(file, source)` 
  -> **Endpoint Esperado:** `POST /importacao/upload` (Form-Data)
- **Importar Planilha (Efetivar):** `importWorksheet(files, source)` 
  -> **Endpoint Esperado:** `POST /importacao/import` (Form-Data)

### 5.4. Busca de Composições
Telas ou modais (ex: modal de adição de item) que fazem buscas na base geral de composições.
- **Buscar Composições (Busca Livre):** `buscarComposicoes(termo, fonte)` 
  -> **Endpoint Esperado:** `GET /composicoes/?termo={termo}&fonte={fonte}`
- **Buscar Preços por Estado:** `getEstadosComposicao(codigo, mes_referencia, fonte)` 
  -> **Endpoint Esperado:** `GET /composicoes/{codigo}/estados`

> [!TIP]
> Ao desenvolver o backend (ex: utilizando FastAPI, Django ou Express), utilize as `Interfaces` definidas no Frontend (como `OrcamentoCreate`, `EtapaCreate`, etc.) como base para construir seus *Schemas/Pydantic Models*. Os endpoints devem sempre retornar as propriedades listadas na interface correspondente.

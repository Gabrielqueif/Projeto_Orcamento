# Identidade Visual — GPObras

> Guia derivado do código do frontend (`frontend/tailwind.config.ts`, `frontend/src/app/globals.css`, `Sidebar.tsx`, `AuthShell.tsx`, `MetricCard.tsx`) e do logo em `frontend/public/logo.png`. Gerado em 2026-10-21.

## 1. Marca

- **Nome do produto:** **GPObras** (o repositório se chama "Projeto Orçamento").
- **Escrita do nome:** `GP` na cor do texto base + `Obras` em verde-limão (`#9fd300`). Sobre fundo escuro, `GP` é branco; sobre fundo claro, `GP` é azul-marinho (`#001b3d`).
- **Tom:** técnico, confiável e organizado. Visual de software de gestão de engenharia: azul-marinho profundo, acento verde-limão vibrante e apoio em teal.
- **Contato de suporte exibido na interface:** `suporte@gpobras.com.br`.

## 2. Logo

Arquivo: `frontend/public/logo.png` (PNG com fundo transparente).

- **Símbolo:** hexágono com borda em gradiente (azul-petróleo → teal → verde-limão, da esquerda para a direita) e miolo branco. Dentro, seis blocos isométricos em volta de uma torre central mais alta, ligados por trilhas em gradiente. Remete a obra, módulos integrados e dados centralizados.
- **Cores internas dos blocos:** topo teal (~`#1BAFB3`), face esquerda azul-marinho (~`#17496F`), face direita verde-limão (~`#B9DC4B`).
- **Uso no produto:**
  - Sidebar: 40×40 px, ao lado do nome (`GP` branco + `Obras` verde), Manrope ExtraBold 22px, `tracking -0.5px`.
  - Telas de login/cadastro (`AuthShell`): 70×70 px com `rounded-lg`, nome em 32px bold, subtítulo em 13px muted.
- **Boas práticas (sugeridas, não codificadas):** manter área de respiro de ao menos 1/4 da altura do símbolo; não distorcer, recolorir nem aplicar sombras; o miolo branco do hexágono garante leitura tanto em fundo escuro quanto claro.

## 3. Paleta de cores

### Marca
| Token | Hex | Uso |
|---|---|---|
| `bg-dark` / `color-primary-dark` / `text-main` / `heading` | `#001b3d` | Sidebar, fundo de login, títulos e texto principal |
| `bg-darker` | `#00102a` | Variação mais escura de fundos |
| `color-secondary-dark` | `#002855` | Superfícies escuras secundárias |
| `brand-primary` / `brand-accent` | `#9fd300` | Cor de ação: CTAs, item ativo da sidebar, destaque de "Obras", borda inferior de cards |
| `brand-primaryHover` | `#8bc400` | Hover do verde de marca |
| `teal` / `status-info` | `#00a3b1` | Acento secundário, informação, gráficos |

### Neutros
| Token | Hex | Uso |
|---|---|---|
| `bg-light` / `color-bg-soft` | `#F8FAFC` | Fundo geral das telas internas |
| `color-bg-subtle` | `#f1f5f9` | Fundos sutis (chips, linhas alternadas) |
| `surface` | `#FFFFFF` | Cards, modais, painéis |
| `border` | `#E2E8F0` | Bordas e divisórias |
| `text-muted` | `#64748b` | Texto secundário, rótulos |
| `color-text-subtle` | `#94a3b8` | Texto terciário, itens inativos na sidebar |

### Semânticas (status)
| Estado | Cor principal | Escura | Fundo |
|---|---|---|---|
| Sucesso | `#059669` (`color-success`) | `#047857` | `#ECFDF5` / `#D1FAE5` |
| Alerta | `#F97316` (`color-warning`) | `#C2410C` | `#FFEDD5` / `#FFF7ED` |
| Perigo | `#DC2626` (`color-danger`) | `#B91C1C` | `#FEE2E2` / `#FEF2F2` |

Observações: `status-success` (`#9fd300`), `status-warning` (`#F59E0B`) e `status-danger` (`#EF4444`) também existem no Tailwind e são usados em indicadores. Badges positivos usam fundo `#E6F6D0` com texto `#4D7E05`. A interface é **somente tema claro** na área de conteúdo, com sidebar e login escuros; não há modo escuro.

## 4. Tipografia

- **Principal:** **Manrope** (400, 500, 600, 700, 800) — títulos, navegação, botões e interface em geral (`font-['Manrope']` / `font-manrope`).
- **Monoespaçada:** **JetBrains Mono** (400, 500, 600) — códigos de composição, valores e dados tabulares (`font-mono`).
- Ambas são carregadas via Google Fonts em `globals.css`.
- **Escala em uso:** marca 22–32px ExtraBold/Bold; valores de métrica 36px bold; texto de navegação 14px medium (ativo: bold); texto auxiliar 13px; rótulos de card 11px bold, caixa alta com `tracking-wide`.

## 5. Forma, espaço e elevação

- **Raios:** botões e itens de navegação 8px (`rounded-[8px]`); cards `rounded-xl` (12px); ícones em quadrado 40×40 `rounded-lg`; badges e avatares `rounded-full`.
- **Sidebar:** 256px de largura, fixa à esquerda, fundo `#001b3d`, divisórias `rgba(255,255,255,0.06)`.
- **Cards:** fundo branco, borda `#E2E8F0`, padding 24px, `shadow-sm`; no hover sobem 4px (`-translate-y-1`) com `shadow-md`. Cards de métrica têm uma borda inferior colorida (verde por padrão) como assinatura.
- **Login:** painel branco de 12px de raio sobre fundo `#001b3d` com padrão de pontos (`radial-gradient` branco 5%, grade de 24px) e sombra profunda `0 25px 50px -12px rgba(0,0,0,.5)`.
- **Transições:** 150ms em navegação e botões.

## 6. Componentes-chave

- **Navegação ativa:** fundo `#9fd300`, texto `#001b3d` em bold, ícone preenchido e sombra `0 4px 12px rgba(159,211,0,.25)`. Inativo: texto `#94a3b8`, ícone `#64748b`, hover branco com fundo `rgba(255,255,255,.06)`.
- **CTA primário ("Nova Obra", "Novo Membro"):** fundo `#9fd300`, texto `#001b3d`, Manrope bold 14px, 8px de raio, hover com opacidade 90%.
- **Ação destrutiva ("Sair da conta"):** vermelho `rgba(239,68,68,.7)` que intensifica no hover, com fundo vermelho a 8%.
- **Cards de métrica:** ícone em quadrado `bg-light`, rótulo em caixa alta 11px muted, valor 36px bold, badge opcional verde.
- **Ícones:** **Phosphor Icons** (peso `regular` por padrão, `fill` para o item ativo, `bold` em botões de ação), 16–18px. O `components.json` do shadcn aponta para `lucide`, mas o produto usa Phosphor.
- **Base de UI:** primitivos Shadcn/Radix (estilo `new-york`) em `src/components/ui`.

## 7. Inconsistências e pontos de melhoria

- `layout.tsx` carrega **Geist/Geist Mono** via `next/font`, e `<html lang="en">`, enquanto a identidade usa Manrope/JetBrains Mono e o produto é em português. Sugestão: trocar para Manrope via `next/font` e `lang="pt-BR"`.
- `metadata` ainda traz título "GPObras" com descrição padrão "Generated by create next app".
- Há cerca de 1.100 ocorrências de hex hard-coded em 39 arquivos `.tsx`; os tokens (`bg-dark`, `brand-primary`, `text-muted`…) já existem e deveriam substituir os valores literais.
- O `Button` do shadcn usa tokens padrão (`bg-primary`, etc.) que não estão mapeados para o verde de marca, então ele não reflete a identidade sem sobrescrita de classe.
- Dois sistemas de tokens coexistem no `tailwind.config.ts` (nomes antigos `brand.*`/`status.*` e os novos `color-*` por CSS variable); vale unificar.
- O `lucide` declarado em `components.json` não é a biblioteca de ícones em uso.

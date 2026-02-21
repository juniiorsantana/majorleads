# UI SPEC — LeadSense Dashboard

**Versão:** 0.1  
**Status:** Rascunho  
**Última atualização:** Fevereiro de 2026  
**Destinatário:** Dev Frontend  
**Documentos relacionados:** PRD.md, SPEC-tracker.md

---

## 1. Stack e Convenções Técnicas

| Item | Decisão |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Estilização | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Tipografia | Inter (Google Fonts) |
| Paleta base | Zinc (neutros) + Violet (brand) |
| Modo escuro | Suportado via `class="dark"` no `<html>` |
| Grid de layout | 12 colunas, gap-6 |
| Border radius padrão | `rounded-xl` (12px) |
| Breakpoints | sm: 640, md: 768, lg: 1024, xl: 1280 |

### 1.1 Tokens de Design

```css
/* Cores Brand */
--brand-primary:    #7C3AED   /* violet-600 */
--brand-light:      #EDE9FE   /* violet-100 */
--brand-dark:       #5B21B6   /* violet-800 */

/* Neutros */
--bg-base:          #FAFAFA   /* zinc-50 */
--bg-card:          #FFFFFF
--bg-sidebar:       #18181B   /* zinc-900 */
--text-primary:     #18181B   /* zinc-900 */
--text-muted:       #71717A   /* zinc-500 */
--border:           #E4E4E7   /* zinc-200 */

/* Semânticas */
--success:          #16A34A   /* green-600 */
--warning:          #D97706   /* amber-600 */
--danger:           #DC2626   /* red-600 */
--info:             #2563EB   /* blue-600 */

/* Dark mode */
--dark-bg-base:     #09090B
--dark-bg-card:     #18181B
--dark-border:      #27272A
```

---

## 2. Layout Global

### 2.1 Estrutura Base

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (fixo, 240px)  │  CONTENT AREA (flex-1)    │
│                         │                           │
│  [Logo]                 │  [Topbar]                 │
│                         │  ─────────────────────    │
│  [Nav Items]            │  [Page Content]           │
│                         │                           │
│  ─────────────────      │                           │
│  [User + Settings]      │                           │
└─────────────────────────────────────────────────────┘
```

**Sidebar:** `w-[240px] h-screen fixed left-0 top-0 bg-zinc-900 flex flex-col`  
**Content area:** `ml-[240px] min-h-screen bg-zinc-50 flex flex-col`  
**Topbar:** `h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10`  
**Page content:** `flex-1 p-8`

**Mobile (< lg):** Sidebar vira drawer off-canvas com overlay. Topbar exibe hamburguer button à esquerda.

### 2.2 Sidebar — Componente

```
┌────────────────────────┐
│  ⬡ LeadSense          │  ← Logo, h-16, border-b border-zinc-800
├────────────────────────┤
│                        │
│  [Site Selector ▾]     │  ← Dropdown para multi-site (ver 2.3)
│                        │
│  ── PRINCIPAL ──       │  ← Label de grupo: text-xs text-zinc-500 uppercase tracking-wider
│                        │
│  ⊞ Overview            │  ← Item ativo: bg-violet-600 text-white rounded-lg
│  👤 Leads              │
│  ▣ Popups              │
│  📊 Relatórios         │
│                        │
│  ── CONTA ──           │
│                        │
│  ⚙ Configurações       │
│  📦 Instalação         │
│                        │
├────────────────────────┤
│  [Avatar] Nome         │  ← Fixo no bottom, flex items-center gap-3
│           Plano: Pro   │
└────────────────────────┘
```

**Nav Item — estados:**
- Default: `flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors text-sm`
- Ativo: `bg-violet-600 text-white`
- Com badge (ex: leads novos): badge `ml-auto bg-violet-500 text-white text-xs rounded-full px-2 py-0.5`

### 2.3 Site Selector (Dropdown na Sidebar)

Permite ao usuário alternar entre múltiplos sites cadastrados:

```
┌──────────────────────┐
│ meusite.com.br    ▾  │  ← Trigger: bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white
└──────────────────────┘
         ↓ aberto
┌──────────────────────┐
│ ✓ meusite.com.br     │
│   loja.meusite.com   │
│   ─────────────────  │
│   + Adicionar site   │
└──────────────────────┘
```

### 2.4 Topbar — Componente

```
[Breadcrumb: Overview]          [🔔 Notificações]  [Período ▾]  [Avatar]
```

- **Breadcrumb:** `text-lg font-semibold text-zinc-900` com sub-nível em `text-zinc-500`
- **Período selector:** Dropdown com opções: Hoje / 7 dias / 30 dias / 90 dias / Personalizado. Persiste globalmente para toda a página.
- **Notificações:** Ícone Bell com badge de contagem. Dropdown lista alertas do sistema.

---

## 3. Tela — Onboarding / Instalação do Script

**Rota:** `/onboarding`  
**Quando exibir:** Conta nova sem nenhum site configurado. Redirecionar automaticamente.

### 3.1 Layout

Tela full-screen centrada, sem sidebar. Fundo `bg-zinc-50`.

```
┌──────────────────────────────────────────────────────┐
│                    [Logo Central]                    │
│                                                      │
│           Boas-vindas ao LeadSense 🎉               │
│      Vamos instalar o script no seu site             │
│                                                      │
│  ┌─── Step Indicator ────────────────────────┐      │
│  │  [1. Criar Site] ──> [2. Instalar] ──> [3. ✓]   │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ┌─── Card Central (max-w-2xl) ──────────────┐      │
│  │  [Conteúdo do step atual]                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│              [Botão Próximo →]                       │
└──────────────────────────────────────────────────────┘
```

### 3.2 Step 1 — Informações do Site

```
Título: "Qual é o seu site?"

[Input] Nome do site (ex: Minha Loja)       placeholder="Minha Loja Online"
[Input] URL do site                          placeholder="https://meusite.com.br"

[Select] Plataforma
  ○ WordPress
  ○ Shopify
  ○ Webflow
  ○ Wix
  ○ HTML / Outra
```

### 3.3 Step 2 — Instalação do Script

Conteúdo varia conforme a plataforma selecionada no step 1.

```
Título: "Instale o script no seu site"

┌─── Tab Bar ────────────────────────────────────┐
│  [WordPress]  [Shopify]  [HTML]  [GTM]         │
└────────────────────────────────────────────────┘

[Instrução contextual por plataforma]

┌─── Code Block ─────────────────────────────────┐
│  <script                                        │
│    src="https://cdn.leadsense.io/v1/tracker.js" │
│    data-token="SEU_TOKEN"                       │
│    async>                                       │
│  </script>                          [Copiar 📋] │
└────────────────────────────────────────────────┘

[Botão Secundário: Enviar instruções por e-mail]
```

**Code block:** `bg-zinc-900 text-green-400 font-mono text-sm rounded-xl p-4 relative`. Botão Copiar no canto superior direito: ao clicar, troca para "Copiado ✓" por 2s.

**Instruções por plataforma:**
- **WordPress:** "Instale o plugin LeadSense ou cole no functions.php do seu tema"
- **Shopify:** "Acesse Loja Online > Temas > Editar código > theme.liquid, cole antes de `</head>`"
- **HTML:** "Cole o código antes do fechamento da tag `</head>` em todas as páginas"
- **GTM:** "Crie uma tag HTML customizada, cole o código e dispare em All Pages"

### 3.4 Step 3 — Verificação

```
[Loader animado]
Aguardando o primeiro evento do seu site...

─── após detectar ───

[✅ Ícone verde grande]
Script detectado com sucesso!
Recebemos o primeiro evento de meusite.com.br

[Botão primário: Ir para o Dashboard →]
```

**Estado de timeout (após 3 min sem detectar):**
```
[⚠️ Ícone amarelo]
Ainda não detectamos o script.
Verifique se o código foi colado corretamente.

[Botão: Ver instruções novamente]   [Botão: Verificar novamente]
[Link: Pular por agora →]
```

---

## 4. Tela — Overview (Home Analytics)

**Rota:** `/dashboard`

### 4.1 Layout da Página

```
[Topbar: "Overview" | Período: 30 dias ▾]

┌─── KPI Cards (4 colunas) ──────────────────────────────────────┐
│  [Visitantes]  [Identificados]  [Conversão]  [Popups Ativos]  │
└────────────────────────────────────────────────────────────────┘

┌─── Gráfico Principal (8 cols) ─────┐  ┌─── Top UTMs (4 cols) ──┐
│  Visitantes por dia (área chart)   │  │  Tabela UTM sources    │
│                                    │  │                         │
└────────────────────────────────────┘  └─────────────────────────┘

┌─── Segmentação de Leads (4 cols) ──┐  ┌─── Top Páginas (4 cols) ┐  ┌─── Dispositivos (4 cols) ┐
│  Donut chart: frio/morno/quente    │  │  Tabela de páginas      │  │  Donut: desktop/mob/tab   │
└────────────────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘

┌─── Atividade Recente (12 cols) ────────────────────────────────┐
│  Feed de últimos eventos (lead identificado, popup convertido) │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 KPI Card — Componente

```
┌─────────────────────────────┐
│  [Ícone]   Visitantes       │  ← label: text-sm text-zinc-500
│                             │
│  12.483                     │  ← valor: text-3xl font-bold text-zinc-900
│                             │
│  ↑ 18% vs período anterior  │  ← trend: text-sm. Verde se positivo, vermelho se negativo
└─────────────────────────────┘
```

Estrutura: `bg-white rounded-xl border border-zinc-200 p-6 flex flex-col gap-2`

**4 KPIs da Home:**

| KPI | Ícone | Descrição |
|---|---|---|
| Total de Visitantes | `Users` | Sessões únicas no período |
| Leads Identificados | `UserCheck` | Com email ou WhatsApp capturado |
| Taxa de Conversão | `TrendingUp` | Leads / Visitantes × 100 |
| Popups Ativos | `Layers` | Total de popups com status active |

### 4.3 Gráfico de Visitantes — Área Chart

- Biblioteca: Recharts `AreaChart`
- X-axis: datas do período
- Y-axis: contagem de visitantes
- 2 séries: "Visitantes" (violet-500) e "Identificados" (violet-200)
- Tooltip customizado: card branco com sombra, mostra data + valores das 2 séries
- Legenda: acima do gráfico, à direita
- Altura: `h-[280px]`
- Responsivo: `ResponsiveContainer width="100%" height="100%"`

### 4.4 Top UTM Sources — Tabela Compacta

```
┌─ UTM Source ──────── Visitas ── Leads ── Conv. ─┐
│  facebook              4.230     310      7.3%   │
│  google                2.100     198      9.4%   │
│  organic                 890      44      4.9%   │
│  direct                  723      31      4.3%   │
│  [Ver todos →]                                   │
└──────────────────────────────────────────────────┘
```

- Header: `text-xs text-zinc-500 uppercase`
- Linhas: `hover:bg-zinc-50 transition-colors`
- Barra de progresso inline na coluna Visitas (barra fina violet abaixo do número)

### 4.5 Feed de Atividade Recente

```
┌─── Atividade Recente ────────────────────────────────────────┐
│  Hoje                                                        │
│                                                              │
│  👤 João Silva identificado via popup "Oferta de Saída"  2min│
│  🖱️ Clique no CTA em /oferta — Facebook / Mobile         5min│
│  📋 Formulário preenchido em /contato — email capturado  12min│
│                                                              │
│  Ontem                                                       │
│                                                              │
│  💬 Popup "Boas-vindas" convertido — WhatsApp aberto     ...  │
│  ...                                                         │
│  [Carregar mais]                                             │
└──────────────────────────────────────────────────────────────┘
```

- Cada item: `flex items-start gap-3 py-3 border-b border-zinc-100 last:border-0`
- Ícone em `rounded-full bg-violet-100 p-2 text-violet-600`
- Timestamp: `text-xs text-zinc-400 ml-auto`
- Agrupamento por dia com label `text-xs font-medium text-zinc-400 uppercase py-2`

---

## 5. Tela — Lista de Leads

**Rota:** `/leads`

### 5.1 Layout

```
[Topbar: "Leads" | Exportar CSV]

┌─── Filtros ────────────────────────────────────────────────────┐
│  [🔍 Busca por nome, email...]  [Segmento ▾]  [Origem ▾]  [Data ▾]  [Limpar filtros] │
└────────────────────────────────────────────────────────────────┘

┌─── Tabela de Leads ────────────────────────────────────────────┐
│  ☐  Lead          Email           Segmento   Origem    Visto   │
│  ─────────────────────────────────────────────────────────────  │
│  ☐  [Avatar] João  joao@...       🔴 Quente  Facebook  2min    │
│  ☐  [Avatar] Maria maria@...      🟡 Morno   Google    1h      │
│  ☐  [Avatar] —     (anônimo)      ⚪ Frio    Direct    3h      │
│  ...                                                            │
└────────────────────────────────────────────────────────────────┘

[Paginação: < 1 2 3 ... 12 >]    [Mostrando 1-25 de 1.483 leads]
```

### 5.2 Tabela — Especificação de Colunas

| Coluna | Largura | Conteúdo |
|---|---|---|
| Checkbox | 40px | Seleção em massa |
| Lead | flex-1 | Avatar initials + Nome (ou "Visitante anônimo") + cidade |
| Email | 200px | Email clicável ou `—` |
| Segmento | 120px | Badge colorido: Quente / Morno / Frio / Em saída |
| Origem | 140px | Ícone + UTM source |
| Última visita | 100px | Tempo relativo (2min, 1h, 3d) |
| Ações | 80px | Botão `···` com menu: Ver perfil / Exportar / Remover |

**Badge de segmento:**
- Quente: `bg-red-100 text-red-700`
- Morno: `bg-amber-100 text-amber-700`
- Frio: `bg-zinc-100 text-zinc-600`
- Em saída: `bg-blue-100 text-blue-700`

**Linha hover:** `hover:bg-zinc-50 cursor-pointer` — clicar na linha abre o perfil do lead.

**Seleção em massa:** Quando 1+ leads selecionados, aparece uma barra no topo da tabela:
```
[3 leads selecionados]   [Exportar]   [Adicionar tag]   [Remover]
```

### 5.3 Filtros — Comportamento

- **Busca:** Debounce 300ms, busca em nome + email + whatsapp
- **Segmento:** Multi-select dropdown (Quente, Morno, Frio, Em saída)
- **Origem:** Multi-select com lista de UTM sources detectados
- **Data:** Date range picker (calendário duplo)
- Filtros ativos exibem chips abaixo da barra: `[Facebook ✕] [Quente ✕]`
- URL atualiza com os filtros para permalink/compartilhamento

### 5.4 Estado Vazio

```
         [Ícone Users com pontilhado]
    Nenhum lead encontrado
    Tente ajustar os filtros ou aguarde
    as primeiras visitas no seu site.

         [Limpar filtros]
```

---

## 6. Tela — Perfil do Lead

**Rota:** `/leads/[id]`  
**Acesso:** Clique em um lead na lista.

### 6.1 Layout

```
[← Voltar para Leads]

┌─── Hero do Lead (full width) ────────────────────────────────┐
│  [Avatar 64px]  João Silva                    [Segmento badge]│
│                 joao@email.com | (11) 99999-9999              │
│                 São Paulo, SP — Claro — Mobile                │
│                                            [Abrir WhatsApp ↗] │
└──────────────────────────────────────────────────────────────┘

┌─── Info Cards (4 cols) ────────────────────────────────────────┐
│ [Sessões: 3] [Páginas vistas: 12] [Tempo total: 8min] [Conv: 1]│
└────────────────────────────────────────────────────────────────┘

┌─── Timeline de Eventos (8 cols) ──┐  ┌─── Painel Lateral (4 cols) ──┐
│                                   │  │                               │
│  [Timeline cronológica]           │  │  Dados do Lead                │
│                                   │  │  ─────────────────────        │
│                                   │  │  UTM Source: facebook         │
│                                   │  │  UTM Campaign: promo-jan      │
│                                   │  │  Dispositivo: iPhone 14       │
│                                   │  │  Browser: Safari 17           │
│                                   │  │  IP: 177.92.x.x               │
│                                   │  │  ISP: Claro                   │
│                                   │  │  Tipo: Residencial            │
│                                   │  │                               │
│                                   │  │  ─────────────────────        │
│                                   │  │  Popups Vistos (2)            │
│                                   │  │  • Oferta de Saída — clicou   │
│                                   │  │  • Boas-vindas — fechou       │
│                                   │  │                               │
│                                   │  │  ─────────────────────        │
│                                   │  │  Tags                         │
│                                   │  │  [facebook] [mobile] [+ Add]  │
└───────────────────────────────────┘  └───────────────────────────────┘
```

### 6.2 Timeline de Eventos — Componente

```
  🗓 Hoje, 09:14

  ●──[page_view]───────────────────────────────────── 09:14
  │   Acessou /oferta-especial
  │   via facebook / cpc / promo-jan

  ●──[scroll_depth]────────────────────────────────── 09:15
  │   Scrollou até 75% da página

  ●──[popup_shown]─────────────────────────────────── 09:16
  │   Popup "Oferta de Saída" exibido
  │   Gatilho: exit_intent

  ●──[popup_clicked]───────────────────────────────── 09:16
  │   Clicou em "Quero a oferta"
  │   → Redirecionado para /checkout

  ●──[form_submit]─────────────────────────────────── 09:18
  │   Formulário enviado em /checkout
  │   Capturado: nome, email, whatsapp
```

- Linha vertical: `border-l-2 border-zinc-200 ml-3`
- Bullet: `w-3 h-3 rounded-full bg-violet-500 -ml-[7px]`
- Evento header: `text-sm font-medium text-zinc-900`
- Detalhes: `text-sm text-zinc-500 ml-4`
- Timestamp: `text-xs text-zinc-400 ml-auto`
- Agrupamento por dia com separador

---

## 7. Tela — Popups (Lista)

**Rota:** `/popups`

### 7.1 Layout

```
[Topbar: "Popups"]                              [+ Criar Popup]

┌─── Cards de Popups (grid 3 colunas) ──────────────────────────┐
│                                                                │
│  ┌─ Card Popup ──────────────┐  ┌─ Card ──────────────────┐  │
│  │  [Preview miniatura]      │  │  [Preview miniatura]     │  │
│  │  ─────────────────────    │  │  ──────────────────────  │  │
│  │  Oferta de Saída          │  │  Boas-vindas Mobile      │  │
│  │  Exit intent + 60s        │  │  scroll 50% + UTM=fb     │  │
│  │                           │  │                          │  │
│  │  3.241 exibições          │  │  1.102 exibições         │  │
│  │  CTR: 8.3%  Conv: 4.1%   │  │  CTR: 12.1%  Conv: 6.2% │  │
│  │                           │  │                          │  │
│  │  [● Ativo]  [Editar] [⋯] │  │  [● Ativo]  [Editar][⋯] │  │
│  └───────────────────────────┘  └──────────────────────────┘  │
│                                                                │
│  ┌─ Card ────────────────────┐  ┌─ Placeholder ────────────┐  │
│  │  ...                      │  │  [+ Criar novo popup]    │  │
│  └───────────────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Card de Popup:**
- `bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow`
- Preview: `h-40 bg-zinc-100 flex items-center justify-center` — renderiza miniatura HTML do popup em iframe sandboxed ou screenshot estático
- Toggle ativo/inativo: switch component, muda status via API com otimistic update
- Menu `⋯`: Editar / Duplicar / Ver relatório / Arquivar

### 7.2 Estado Vazio

```
      [Ícone Layers com pontilhado]
  Você ainda não tem nenhum popup
  Crie seu primeiro popup em minutos
  e comece a converter mais visitantes.

       [+ Criar meu primeiro popup]
```

---

## 8. Tela — Editor de Popup

**Rota:** `/popups/new` e `/popups/[id]/edit`

### 8.1 Layout do Editor

Layout especial — **sem sidebar**, full-screen dividido em 3 painéis:

```
┌─── Topbar do Editor ────────────────────────────────────────────┐
│  [← Sair]  Nome do popup: [Oferta de Saída          ]  [Salvar] [Publicar ▾] │
└─────────────────────────────────────────────────────────────────┘

┌─── Painel Esquerdo (280px) ─┐  ┌─── Canvas Central ──┐  ┌─── Painel Direito (320px) ─┐
│                              │  │                      │  │                             │
│  ETAPAS                      │  │  [Preview do Popup]  │  │  PROPRIEDADES               │
│  ─────────────────           │  │                      │  │  (painel contextual)        │
│  ① Gatilhos e Condições      │  │  [Desktop] [Mobile]  │  │                             │
│  ② Design do Popup           │  │                      │  │                             │
│  ③ Ação ao Converter         │  │                      │  │                             │
│  ④ Frequência e A/B          │  │                      │  │                             │
│                              │  │                      │  │                             │
└──────────────────────────────┘  └──────────────────────┘  └─────────────────────────────┘
```

### 8.2 Etapa 1 — Gatilhos e Condições

**Painel Esquerdo mostra lista de etapas com a atual destacada.**

**Painel Direito — Gatilhos:**

```
QUANDO mostrar este popup?

┌─── Gatilhos (OR entre eles) ──────────────────────┐
│  [+ Adicionar gatilho]                            │
│                                                   │
│  ✕  Exit Intent                                   │
│  ✕  Tempo na página: [60] segundos                │
│  ✕  Scroll: [75] %                                │
└───────────────────────────────────────────────────┘

PARA QUEM mostrar?

┌─── Condições (AND entre elas) ────────────────────┐
│  [+ Adicionar condição]                           │
│                                                   │
│  ✕  UTM Source  [é igual a ▾]  [facebook    ]    │
│  ✕  Segmento   [é ▾]          [Lead Morno   ]    │
│  ✕  Nº sessões [maior que ▾]  [1            ]    │
└───────────────────────────────────────────────────┘
```

Cada gatilho/condição é um row com: ícone, label, campos de configuração, botão remover. Arrastar para reordenar (drag handle).

### 8.3 Etapa 2 — Design do Popup

**Painel Esquerdo — Tipo e estrutura:**

```
TIPO DE POPUP
○ Modal Central
○ Slide-in (canto)
○ Top Bar
○ Bottom Bar  
○ Toast (notificação)

ESTRUTURA DE BLOCOS
[Imagem]         [Arrastar ↕]  [✕]
[Título]         [Arrastar ↕]  [✕]
[Texto]          [Arrastar ↕]  [✕]
[Campo Email]    [Arrastar ↕]  [✕]
[Botão CTA]      [Arrastar ↕]  [✕]

[+ Adicionar bloco]
```

**Canvas Central — Preview interativo:**

Renderiza o popup em tempo real conforme as edições. Clicar em um elemento no canvas abre suas propriedades no painel direito.

Toggle **Desktop / Mobile** no topo do canvas muda a viewport de preview.

**Painel Direito — Propriedades do elemento selecionado:**

Exemplo (Botão selecionado):
```
BOTÃO

Texto:     [Quero a oferta agora!]

Cor de fundo:   [████] #7C3AED
Cor do texto:   [████] #FFFFFF
Borda radius:   [8] px

Tamanho:  ○ Pequeno  ● Médio  ○ Grande
Largura:  ○ Auto     ● Full

Ação ao clicar:
[Redirecionar para URL ▾]
URL: [https://meusite.com.br/checkout]
```

**Variáveis disponíveis (hint abaixo de campos de texto):**

```
💡 Variáveis disponíveis:
{{lead.first_name}}  {{lead.city}}  {{utm.campaign}}  {{session.count}}
```

### 8.4 Etapa 3 — Ação ao Converter

```
O que acontece quando o lead converte?

[Redirecionar para URL ▾]      URL: _______________
[Exibir mensagem de sucesso]   Mensagem: ___________
[Abrir WhatsApp]               Número: ____________
                               Mensagem pré-preenchida: __________
[Disparar Webhook]             URL POST: __________
[Fechar popup]
```

Múltiplas ações podem ser encadeadas com botão `[+ Adicionar ação]`.

### 8.5 Etapa 4 — Frequência e A/B

```
FREQUÊNCIA DE EXIBIÇÃO
[Mostrar 1x por sessão    ▾]
  ○ Uma vez por sessão
  ○ Uma vez por dia
  ○ Uma vez por semana
  ○ Sempre

A/B TESTING
○ Desativado
● Ativado

  Variação A  [50%]  ████████████  (esta versão atual)
  Variação B  [50%]  ████████████  [Editar variação B]

  [Adicionar variação C]  (disponível apenas no plano Pro)
```

### 8.6 Topbar do Editor — Estados

- **Rascunho (não publicado):** Badge "Rascunho" em zinc. Botão principal: "Publicar"
- **Publicado com alterações:** Badge "Alterações não salvas" em amber. Botões: "Salvar rascunho" e "Publicar alterações"
- **Publicado e salvo:** Badge "Publicado" em green. Botão: "Salvar" (disabled se sem alterações)

Auto-save a cada 30 segundos com indicador `"Salvo às 14:32"` no topo.

---

## 9. Tela — Relatórios

**Rota:** `/reports`

### 9.1 Layout com Sub-navegação

```
[Topbar: "Relatórios" | Período ▾ | Exportar PDF]

┌─── Sub-nav (tabs) ─────────────────────────────────────────┐
│  [Visão Geral]  [Popups]  [UTM / Campanhas]  [Páginas]     │
└────────────────────────────────────────────────────────────┘

[Conteúdo da aba selecionada]
```

### 9.2 Aba — Visão Geral

```
┌─── KPIs (4 colunas) ──────────────────────────────────────────┐
│  [Total visitas] [Leads capturados] [Taxa conv.] [Receita est.]│
└────────────────────────────────────────────────────────────────┘

┌─── Gráfico de linha (visitantes + leads, 12 cols) ────────────┐
│  [Área chart com 2 séries + toggle por métrica]               │
└────────────────────────────────────────────────────────────────┘

┌─── Funil de Conversão (5 cols) ───┐  ┌─── Fontes (7 cols) ──────────┐
│                                   │  │                               │
│  Visitantes      12.483  ████████ │  │  [Donut chart por UTM source] │
│  Engajados        4.201  ████░░░░ │  │  + Legenda com %              │
│  Leads            1.832  ███░░░░░ │  │                               │
│  Convertidos        342  █░░░░░░░ │  │                               │
│                                   │  │                               │
└───────────────────────────────────┘  └───────────────────────────────┘
```

### 9.3 Aba — Popups

```
┌─── KPIs de Popups ──────────────────────────────────────────┐
│  [Total exibições]  [Cliques]  [CTR médio]  [Conversões]    │
└─────────────────────────────────────────────────────────────┘

┌─── Tabela comparativa de popups ─────────────────────────────┐
│  Nome             Exibições  Cliques   CTR    Conv.  Status  │
│  Oferta de Saída  3.241      269       8.3%   4.1%   ● Ativo │
│  Boas-vindas      1.102      133      12.1%   6.2%   ● Ativo │
│  Black Friday        —        —         —      —     ○ Draft  │
└──────────────────────────────────────────────────────────────┘

┌─── Gráfico: CTR por popup ao longo do tempo ─────────────────┐
│  [Line chart multi-série, 1 linha por popup]                 │
└──────────────────────────────────────────────────────────────┘
```

### 9.4 Aba — UTM / Campanhas

```
┌─── Filtros de UTM ──────────────────────────────────────────┐
│  [Source ▾]  [Medium ▾]  [Campaign ▾]                       │
└─────────────────────────────────────────────────────────────┘

┌─── Tabela de Campanhas ──────────────────────────────────────┐
│  Campanha          Source   Medium  Visitas  Leads   Conv.   │
│  promo-fevereiro   facebook cpc     4.230    310     7.3%    │
│  seo-blog          google   organic 2.100    198     9.4%    │
│  [expandir linha → ver utm_content e utm_term]               │
└──────────────────────────────────────────────────────────────┘

┌─── Heatmap de UTM × Dispositivo ──────────────────────────────┐
│  (matrix: campanhas nas linhas, dispositivos nas colunas)     │
│  células coloridas por taxa de conversão                      │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Tela — Configurações

**Rota:** `/settings`

### 10.1 Layout com Sub-navegação Vertical

```
┌─── Sidebar de Configurações (200px) ──┐  ┌─── Conteúdo ──────────────────────┐
│                                       │  │                                   │
│  Geral                                │  │  [Conteúdo da seção selecionada]  │
│  Sites                                │  │                                   │
│  Script de Instalação                 │  │                                   │
│  Integrações                          │  │                                   │
│  Plano e Fatura                       │  │                                   │
│  Privacidade (LGPD)                   │  │                                   │
│  Membros da equipe                    │  │                                   │
│  Notificações                         │  │                                   │
└───────────────────────────────────────┘  └───────────────────────────────────┘
```

### 10.2 Seção — Geral

```
INFORMAÇÕES DA CONTA
[Input] Nome da conta       [Salvar]
[Input] E-mail de login
[Button] Alterar senha

APARÊNCIA
Tema:  ○ Claro  ○ Escuro  ● Sistema
Idioma: [Português (BR) ▾]
Fuso horário: [America/Sao_Paulo ▾]
```

### 10.3 Seção — Script de Instalação

```
TOKEN DO SITE
┌──────────────────────────────────────────────┐
│  abc123xyz789...                   [Copiar]  │
└──────────────────────────────────────────────┘
[Gerar novo token]  ← com aviso de confirmação

CÓDIGO DE INSTALAÇÃO
[Mesmo bloco de código do Onboarding, com tabs por plataforma]

STATUS DO SCRIPT
● Detectado — último evento: 2 minutos atrás
  meusite.com.br — 1.234 eventos hoje

[Testar instalação]
```

### 10.4 Seção — Integrações

```
┌─── Card de Integração ──────────────────────────────────────┐
│  [Logo Webhook]   Webhook                                   │
│  Envie eventos em tempo real para sua URL                   │
│                                              [Configurar →] │
└─────────────────────────────────────────────────────────────┘

[Cards para: RD Station, ActiveCampaign, HubSpot, Slack, Zapier, Make]

Cada card conectado exibe:
┌───────────────────────────────────────────────────────────┐
│  [Logo] ActiveCampaign                    [● Conectado]   │
│  Sincronizando leads desde 12/01/2026     [Desconectar]   │
└───────────────────────────────────────────────────────────┘
```

### 10.5 Seção — Plano e Fatura

```
PLANO ATUAL
┌──────────────────────────────────────────────────────────┐
│  Pro                              R$ 697/mês             │
│  Próxima cobrança: 18/03/2026                            │
│                                                          │
│  Pageviews: ████████████░░░░  82.400 / 500.000           │
│  Popups ativos: 6 / ilimitado                            │
│                                    [Gerenciar plano]     │
└──────────────────────────────────────────────────────────┘

HISTÓRICO DE FATURAS
[Tabela: Data | Valor | Status | PDF]
```

### 10.6 Seção — Privacidade (LGPD)

```
MODO DE RASTREAMENTO
○ Completo  — coleta tudo sem consentimento explícito
○ Anônimo   — anonimiza IPs e não captura formulários
● Com consentimento — aguarda opt-in do visitante

BANNER DE CONSENTIMENTO
[Toggle: Ativar banner de cookies integrado]

  Texto do banner:
  [Textarea: "Usamos cookies para personalizar..."]

  Botão aceitar: [Aceitar]        [Personalizar texto]
  Botão recusar: [Recusar]        [Personalizar texto]

  Preview:
  ┌──────────────────────────────────────────────────┐
  │ 🍪 Usamos cookies para...  [Aceitar]  [Recusar]  │
  └──────────────────────────────────────────────────┘

RETENÇÃO DE DADOS
Manter dados de leads por: [12 meses ▾]
[Exportar todos os dados]  [Deletar todos os dados]
```

---

## 11. Componentes Globais

### 11.1 Botões

```
Primary:    bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium
Secondary:  bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-lg text-sm
Danger:     bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm
Ghost:      hover:bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg text-sm
Icon only:  p-2 rounded-lg hover:bg-zinc-100 text-zinc-500
```

**Estados:** `:disabled` → `opacity-50 cursor-not-allowed`. Loading → spinner substituí label.

### 11.2 Inputs

```
Base: w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm
      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent

Erro: border-red-500 focus:ring-red-500
      + texto de erro: text-xs text-red-600 mt-1

Label: text-sm font-medium text-zinc-700 mb-1 block
```

### 11.3 Toast / Notificações

Posição: `fixed bottom-6 right-6 z-50 flex flex-col gap-2`

```
┌─────────────────────────────────────┐
│  ✅  Popup publicado com sucesso!   │  ← Success: borda esquerda green
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  ❌  Erro ao salvar. Tente novamente│  ← Error: borda esquerda red
└─────────────────────────────────────┘
```

- Auto-dismiss: 4 segundos
- Hover pausa o timer
- Máximo 3 toasts simultâneos (FIFO)

### 11.4 Modal de Confirmação

```
┌─── Overlay (bg-black/50 backdrop-blur-sm) ─────────────────┐
│                                                             │
│         ┌─── Modal (max-w-md) ──────────────────────┐      │
│         │  [Ícone ⚠️]                               │      │
│         │  Título da ação                           │      │
│         │  Descrição explicando o que vai acontecer │      │
│         │                                           │      │
│         │  [Cancelar]          [Confirmar / Deletar]│      │
│         └───────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.5 Empty States

Padrão para todas as telas sem dados:

```
[Ícone relacionado ao contexto, 48px, text-zinc-300]
Título descritivo (text-lg font-medium text-zinc-900)
Subtítulo orientando o próximo passo (text-sm text-zinc-500)
[CTA opcional]
```

### 11.6 Skeleton Loaders

Usar em lugar de spinners para conteúdo tabelado e cards:

```javascript
// Padrão de skeleton
<div className="animate-pulse">
  <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-zinc-200 rounded w-1/2" />
</div>
```

KPI cards: skeleton de altura fixa enquanto dados carregam.  
Tabelas: 5 linhas skeleton com colunas de largura variada.

### 11.7 Badges de Status

```
Ativo:      bg-green-100 text-green-700  + dot verde animado (pulse)
Rascunho:   bg-zinc-100 text-zinc-600
Pausado:    bg-amber-100 text-amber-700
Arquivado:  bg-zinc-100 text-zinc-400
```

---

## 12. Fluxos e Navegação

### 12.1 Fluxo de Criação de Popup

```
/popups
  → [+ Criar Popup]
    → /popups/new
      → Step 1: Gatilhos e Condições
      → Step 2: Design
      → Step 3: Ação
      → Step 4: Frequência / A/B
        → [Publicar]
          → Toast "Popup publicado!"
          → Redireciona para /popups/[id] (view do popup criado)
        → [Salvar rascunho]
          → Toast "Rascunho salvo"
          → Permanece no editor
```

### 12.2 Fluxo de Lead Identificado (Tempo Real)

Quando o tracker detecta um novo lead identificado:
1. Badge de notificação no sino aumenta +1
2. Feed de atividade na Home atualiza (via polling a cada 30s ou WebSocket)
3. Toast opcional: "Novo lead identificado: João Silva"

### 12.3 Estados de Carregamento Global

- **Navegação entre páginas:** Barra de progresso fina no topo da página (estilo NProgress), cor `violet-500`
- **Ações de submit:** Botão entra em loading state (spinner + disabled)
- **Dados de dashboard:** Skeleton loaders por seção, não bloqueia o layout inteiro

---

## 13. Responsividade

| Breakpoint | Comportamento |
|---|---|
| `< lg (1024px)` | Sidebar vira drawer. Topbar exibe hamburguer. Grids passam para 1-2 colunas. |
| `< md (768px)` | Cards KPI: 2 colunas. Tabelas: scroll horizontal com colunas fixas. |
| `< sm (640px)` | Cards KPI: 1 coluna. Editor de popup: não disponível (exibe aviso para usar desktop). |

**Editor de Popup em mobile:**
```
[📱 Ícone]
O editor de popups é otimizado para desktop.
Para a melhor experiência, acesse pelo computador.

[Continuar mesmo assim]  ← abre versão simplificada somente-leitura
```

---

## 14. Acessibilidade

- Todos os elementos interativos devem ser alcançáveis por teclado (`Tab`, `Enter`, `Escape`)
- Modais e drawers devem capturar o foco (focus trap) e liberar ao fechar
- Cores: contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA)
- Ícones sem texto devem ter `aria-label` ou `title`
- Loading states devem ter `aria-busy="true"` e `aria-live="polite"` para leitores de tela
- Inputs sempre com `<label>` associado via `htmlFor` / `id`
- Toasts: `role="alert"` para erros, `role="status"` para sucesso

---

*Dúvidas sobre comportamento não especificado: priorizar o padrão do shadcn/ui. Para casos edge não cobertos, registrar como comentário no PR para decisão de produto.*

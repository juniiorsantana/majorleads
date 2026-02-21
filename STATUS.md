# STATUS DO PROJETO — MajorLeads

**Última atualização:** Fevereiro de 2026

---

## Frontend

### ✅ Concluído
- Onboarding (Step 1 - Create Site, Step 2 - Install Script, Step 3 - Verify)
- Editor de Popup Completo:
  - Drag & Drop de camadas e ordenação
  - Gerenciamento de camadas (Adicionar/Remover/Editar)
  - Novos tipos de inputs (Nome, Email, WhatsApp) e Imagens
  - Lógica de Gatilhos (Exit Intent, Tempo, Scroll, Inatividade)
  - Regras de URL condicional
  - Ações de Conversão (WhatsApp, Redirect, Webhook)
  - Construtor de UTM tags integrado ao Redirect
  - Preview responsivo (Desktop/Mobile)
- Configurações > Integrações (card Webhook + drawer de configuração)
- Configurações > Instalação (token, código por plataforma, status do script)
- Configurações > Privacidade LGPD (modos, banner de consentimento, retenção)
- Sidebar e layout global do dashboard
- Lista de Leads (Filtros e Tabela)
- Integração com Backend (Supabase):
  - Autenticação (Login, Cadastro, Recuperação de Senha)
  - Gerenciamento de Perfis de Usuário
  - Salvamento e Edição de Popups
- Refinamentos do Editor de Popup:
  - Correção de problemas de CSP e CORB
  - Melhorias de Acessibilidade (Labels e Inputs)
  - Prevenção de saída acidental da página
  - Correção de codificação de caracteres em textos e labels
- Lista de Popups:
  - Listagem integrada ao Supabase
  - Filtros de status e busca
  - Ações rápidas (Editar, Duplicar, Excluir com confirmação e feedback)
  - Visualização de métricas (Views, CTR, Conversão)
  - Refatoração da criação de Rascunho (criação apenas ao salvar)
- Painel de Analytics (Overview):
  - Integração com dados reais do Supabase
  - Filtros de data (7d, 30d, 90d)
  - Gráficos de Leads Capturados
  - Métricas de KPI (Total Leads, Leads no Período, Popups Ativos)
  - Top UTM Sources e Dispositivos
  - Feed de Atividade Recente

### 🔄 Em andamento
- [ ] Implementação do Tracker in-site (tracker.js)
- [ ] Dashboards de Relatórios por Popup



### 📋 Pendente (por prioridade)
- [ ] Relatórios avançados individuais
- [ ] Webhook de saída configurável no editor
- [ ] Testes E2E do fluxo de captura

---

## Backend

### ✅ Concluído
- Configuração do Projeto Supabase
- Tabelas Essenciais:
  - `profiles` (Perfis de usuário)
  - `sites` (Domínios dos usuários)
  - `popups` (Configurações dos popups)
  - `leads` (Captura de dados)
  - `events` (Eventos do tracker — session, scroll, clicks, etc.)
- RLS (Row Level Security) configurado para proteção de dados
- Motor de regras de popup (Edge Function + Tracker)
- Edge Functions de Backend:
  - `track-events` — Ingestão de eventos em lote
  - `enrich-ip` — Geolocalização e detecção de bots via IP
  - `identify-lead` — Upsert de leads por visitor_id
  - `get-config` — Config de popups ativos por site/token

### 📋 Pendente
- [ ] Autenticação e multi-tenant
- [ ] Banco de eventos (ClickHouse)
- [ ] Integração Webhook

---

## Tracker.js

### ✅ Concluído
- Motor de regras e Renderização de popups no DOM (Shadow DOM)
- Collectors implementados:
  - Scroll depth (25%, 50%, 75%, 90%, 100%)
  - Clicks em botões e links
  - Time on page (15s, 30s, 60s, 120s, 300s) + Idle detection
  - Exit intent (Desktop: mouseleave / Mobile: visibilitychange + scroll rápido)
  - Captura de formulários (heurística de campos PII + auto-identify)
  - SPA Navigation (History API + popstate)
  - page_leave com tempo e scroll final
- Fila de eventos com batch (10 eventos ou 5s) + sendBeacon no beforeunload
- Implementação de Controles de Segurança (Threat Model):
  - Sanitização HTML (DOMPurify via DOMParser nativo) no Renderer de Popups
  - Edge function com rate limiting por IP na tabela `rate_limits` (200 req/min)
  - Edge function forçando resolução do `site_id` exclusivamente pelo `token`
  - Validação estrita de eventos usando Zod limitando data e propriedades
  - Allowlist restrita para o Form Collector, prevenindo vazamento de dados de cartão/senhas e suporte a `data-ls-ignore`

### 📋 Pendente
- [ ] Integração com IP Enrichment no client-side
- [ ] Privacy mode (consent_required / anonymous)

---

## Decisões tomadas
- Produto nomeado: **MajorLeads**
- Stack frontend: React + Tailwind CSS + shadcn/ui
- Drag and drop: @dnd-kit/core + @dnd-kit/sortable
- Ícones: Lucide React
- Backend: Supabase

# CRM — Fase 1: Dados Reais + WhatsApp + Fechamento de Negócio

**Projeto:** MajorLeads  
**Status:** 🔄 Em andamento  
**Última atualização:** Março de 2026

---

## Contexto

O kanban do CRM já está funcional — cards aparecem, drag & drop entre colunas funciona e status é persistido. O que falta na Fase 1 é:

- Conectar os cards aos leads reais do Supabase (hoje usa mocks)
- Botão WhatsApp com mudança automática de status ao clicar
- Modal de fechamento com valor de conversão manual
- KPIs de receita no header baseados em dados reais
- Colunas e status alinhados ao fluxo da clínica odontológica

---

## Migration necessária

Rodar no Supabase SQL Editor antes de qualquer mudança no frontend:

```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS crm_status text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS source text;

CREATE INDEX IF NOT EXISTS idx_leads_crm_status ON leads(crm_status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
```

**Valores válidos para `crm_status`:**
`novo` | `contactado` | `agendado` | `compareceu` | `fechado` | `perdido`

**Valores válidos para `source`:**
`tracker` | `meta_ads` | `null`

> Dados de fechamento (valor, procedimento, observações) são salvos em `extra_data` (jsonb já existente) — sem migration adicional.

---

## O que já está pronto ✅

- Kanban com drag & drop funcionando
- Cards visíveis por coluna
- Persistência de status ao mover entre colunas

---

## O que falta implementar

### 1. Conectar dados reais do Supabase

Substituir os mocks pela query real. Usar `.in()` para suportar múltiplos sites:

```ts
const { data: sites } = await supabase
  .from('sites').select('id').eq('user_id', user.id);
const siteIds = sites?.map(s => s.id) ?? [];

const { data: leads } = await supabase
  .from('leads')
  .select('id, name, email, whatsapp, utm_source, utm_campaign,
           device_type, created_at, crm_status, source, extra_data')
  .in('site_id', siteIds)
  .order('created_at', { ascending: false });
```

Agrupar por `crm_status` no client-side para montar as colunas.

---

### 2. Colunas do kanban (ordem e cores)

| Coluna | crm_status | Cor |
|---|---|---|
| Novo | `novo` | blue |
| Contactado | `contactado` | amber |
| Ag. Consulta | `agendado` | purple |
| Compareceu | `compareceu` | teal |
| Fechado | `fechado` | green |
| Perdido | `perdido` | red |

---

### 3. Card do lead — campos a exibir

- Nome (ou `Visitante anônimo` se null)
- Telefone/WhatsApp
- Badge da campanha (`utm_campaign`, se existir)
- Badge de origem: `Meta Ads` se `source === 'meta_ads'`, senão `Site`
- Tempo relativo desde `created_at`
- Botão WhatsApp (ver item 4)

---

### 4. Botão WhatsApp com mudança automática de status

Ao clicar no botão WhatsApp do card:

1. Abre `https://wa.me/{telefone}?text={mensagem}` em nova aba
2. Se `crm_status === 'novo'` → atualiza para `contactado`
3. Salva `crm_whatsapp_opened_at = new Date().toISOString()` em `extra_data`

**Mensagem padrão (URL-encoded):**
```
Olá {nome}! Vi que você demonstrou interesse. Posso te ajudar?
```
Substitui `{nome}` pelo nome do lead se disponível.

**Regra ao mover via drag para `contactado`:**  
Se `lead.whatsapp` existe e `crm_whatsapp_opened_at` não está em `extra_data` → abre WhatsApp automaticamente + salva timestamp.

---

### 5. Modal de fechamento

Ao mover para `fechado` OU clicar em "Fechar negócio" no card, abrir modal com:

| Campo | Tipo | Obrigatório |
|---|---|---|
| Valor do procedimento | number (R$) | Sim |
| Tipo de procedimento | text (ex: "Implante") | Sim |
| Observações | textarea | Não |

Ao confirmar, salvar em `extra_data`:
```ts
{ ...lead.extra_data, crm_value: number, crm_procedure: string, crm_notes: string }
```

Update no Supabase:
```ts
await supabase.from('leads')
  .update({ crm_status: 'fechado', extra_data: updatedExtraData })
  .eq('id', lead.id);
```

---

### 6. KPIs no header

Calculados a partir dos leads já carregados (sem query adicional):

| KPI | Cálculo |
|---|---|
| Total no CRM | `leads.length` |
| Contactados hoje | `crm_status === 'contactado'` com `created_at` hoje |
| Fechados no mês | `crm_status === 'fechado'` com `created_at` neste mês |
| Receita do mês | soma de `extra_data.crm_value` dos fechados no mês, formatado como R$ |

---

### 7. Estado vazio por coluna

Quando uma coluna não tem leads, exibir card sutil:
```
Nenhum lead aqui ainda
```

---

## Comportamento de updates (otimista)

1. Atualizar estado local imediatamente (sem esperar o Supabase)
2. Persistir no Supabase em background
3. Em caso de erro → reverter estado local + exibir toast de erro

---

## Regras gerais

- Usar `useAuth()` para obter o usuário atual
- Exibir skeletons de carregamento enquanto a query está em andamento
- Não quebrar a rota existente `/dashboard/crm`
- Manter layout, header e barra de busca atuais
- Usar Tailwind e lucide-react já instalados no projeto

---

## Verificação da Fase 1

- [ ] Migration rodou sem erros no Supabase
- [ ] Cards mostram leads reais (não mocks)
- [ ] Drag & drop persiste `crm_status` no banco
- [ ] Botão WhatsApp abre conversa + muda status para `contactado`
- [ ] Modal de fechamento salva valor e procedimento em `extra_data`
- [ ] KPIs no header refletem dados reais
- [ ] Estado vazio aparece em colunas sem leads
- [ ] Updates otimistas com reversão em caso de erro

---

## Próxima fase

**Fase 2 — Integração Meta Lead Ads**  
Webhook da Meta → Edge Function `meta-leadgen-webhook` → lead criado automaticamente com `source: 'meta_ads'` → aparece na coluna "Novo" do CRM.

> Ver plano completo em `crm-fase2-meta.md` (a criar).

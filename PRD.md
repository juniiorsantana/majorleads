# PRD — LeadSense: Plataforma de Inteligência de Visitantes e Popups Personalizados

**Versão:** 0.1  
**Status:** Rascunho  
**Última atualização:** Fevereiro de 2026

---

## 1. Visão Geral

### 1.1 Problema

Páginas de vendas, landing pages e e-commerces perdem grande parte do tráfego pago e orgânico sem saber quem são os visitantes, qual a intenção deles e por que não converteram. Sem essa inteligência, é impossível personalizar a experiência em tempo real para aumentar conversão.

### 1.2 Solução

O **LeadSense** é uma plataforma SaaS que:

- Rastreia o comportamento de cada visitante via script JavaScript leve e universal
- Enriquece os dados do visitante usando IP, UTMs, eventos de clique, formulários e histórico de sessão
- Exibe popups inteligentes com mensagens personalizadas no momento certo, para o perfil certo
- Entrega um dashboard com insights detalhados por lead, sessão e campanha

### 1.3 Proposta de Valor

> "Transforme visitantes anônimos em leads identificados e aumente sua conversão com mensagens certas, na hora certa, para cada perfil de visitante."

---

## 2. Objetivos e Métricas de Sucesso

| Objetivo | KPI | Meta (6 meses) |
|---|---|---|
| Aumentar conversão de páginas | Taxa de conversão da página | +20% vs. sem a ferramenta |
| Identificar visitantes anônimos | % de visitas com perfil enriquecido | >40% |
| Engajamento com popups | CTR dos popups personalizados | >8% |
| Adoção por clientes | Sites com script instalado e ativo | 500 |
| Retenção | Churn mensal | <5% |

---

## 3. Público-Alvo

**Usuário Primário:** Donos de negócios digitais, gestores de tráfego e profissionais de marketing que operam páginas de vendas, landing pages, e-commerces ou sites institucionais.

**Usuário Secundário:** Agências de performance e consultores de CRO (Conversion Rate Optimization).

**Perfis de plataforma suportados:** WordPress, Shopify, Hotmart, Kiwify, Webflow, Wix, HTML puro, e qualquer plataforma que aceite JavaScript customizado.

---

## 4. Personas

### Persona 1 — Rodrigo, Infoprodutor
- Vende cursos online via página de vendas no Hotmart
- Gasta R$15k/mês em tráfego pago
- Não sabe quais UTMs geram leads quentes vs. frios
- Quer recuperar quem saiu sem comprar

### Persona 2 — Camila, Gestora de Tráfego
- Gerencia 12 clientes ao mesmo tempo
- Precisa de dados claros para otimizar campanhas
- Quer mostrar relatórios de comportamento para seus clientes

### Persona 3 — Marcos, Dono de E-commerce
- Tem loja no Shopify com 3.000 visitas/dia
- Alta taxa de abandono de carrinho
- Quer interceptar o visitante antes de sair com uma oferta personalizada

---

## 5. Funcionalidades do Produto

### 5.1 Script de Rastreamento (Core)

O coração do produto. Um snippet JavaScript que o cliente cola no `<head>` do site.

**Requisitos:**
- Tamanho máximo do script inicial: < 5KB (carregamento assíncrono)
- Não bloquear o carregamento da página (async/defer)
- Compatível com todos os navegadores modernos e Safari iOS
- Funcionar sem dependência de frameworks (Vanilla JS)
- Auto-configurável via atributo `data-token` no script tag

**Instalação esperada:**
```html
<script 
  src="https://cdn.leadsense.io/tracker.js" 
  data-token="SEU_TOKEN_AQUI" 
  async>
</script>
```

**Dados coletados automaticamente:**
- IP do visitante (para enriquecimento: cidade, estado, operadora, tipo de conexão)
- UTM parameters (source, medium, campaign, term, content)
- Referrer (URL de origem)
- Dispositivo, sistema operacional e navegador
- Resolução de tela
- Timestamp de entrada e saída
- Páginas visitadas na sessão
- Profundidade de scroll (em %)
- Tempo na página

---

### 5.2 Identificação e Enriquecimento de Leads

**5.2.1 Enriquecimento por IP**
- Geolocalização: país, estado, cidade
- Provedor de internet (ISP)
- Tipo de conexão (residencial, empresarial, mobile, datacenter)
- Detecção de VPN/proxy

**5.2.2 Captura via Formulários**
- Interceptação automática de `<form>` e `<input>` na página
- Captura de: nome, e-mail, telefone/WhatsApp, empresa
- Associação automática ao perfil do visitante
- Suporte a formulários nativos e de terceiros (RD Station, ActiveCampaign, Typeform)

**5.2.3 Identificação Manual via SDK**
```javascript
LeadSense.identify({
  name: "João Silva",
  email: "joao@email.com",
  whatsapp: "5511999999999"
});
```

**5.2.4 Histórico de Sessões**
- Reconhecimento de visitante recorrente via cookie first-party + fingerprint
- Histórico de visitas anteriores, páginas acessadas e ações realizadas

---

### 5.3 Motor de Eventos e Segmentação

Eventos rastreados automaticamente:

| Evento | Descrição |
|---|---|
| `page_view` | Visitante acessou uma página |
| `scroll_depth` | Scrollou 25%, 50%, 75%, 90% |
| `time_on_page` | Ficou X segundos na página |
| `click` | Clicou em elemento (botão, link, CTA) |
| `form_start` | Começou a preencher formulário |
| `form_submit` | Enviou formulário |
| `exit_intent` | Cursor se moveu para fora da página (desktop) |
| `back_button` | Pressionou voltar no navegador |
| `idle` | Ficou inativo por X segundos |
| `utm_match` | UTM específico detectado na sessão |

**Segmentos de Intenção (gerados automaticamente):**
- **Lead Frio:** Primeira visita, < 30s na página, sem clique em CTA
- **Lead Morno:** Voltou ao site, leu mais de 50% da página, não converteu
- **Lead Quente:** Clicou em CTA, preencheu formulário, veio de campanha específica
- **Lead em Saída:** Exit intent ou back button detectado

---

### 5.4 Popups Inteligentes

**5.4.1 Tipos de Popup**
- Modal central (lightbox)
- Slide-in (canto inferior direito/esquerdo)
- Top bar / bottom bar
- Overlay de saída (exit intent fullscreen)
- Notificação flutuante (toast)

**5.4.2 Gatilhos de Exibição**

Cada popup pode ser ativado por combinação de regras:

- Tempo na página (ex: após 45 segundos)
- Profundidade de scroll (ex: após 70% da página)
- Exit intent (cursor sai da janela)
- Clique em botão específico (via seletor CSS)
- Back button / tentativa de sair
- UTM específico (ex: `utm_source=facebook`)
- Segmento de lead (ex: apenas leads mornos)
- Número de sessões (ex: 2ª visita ou mais)
- Inatividade (ex: idle por 30s)
- Página específica visitada

**5.4.3 Personalização de Conteúdo**

Variáveis dinâmicas disponíveis no editor de popup:

```
{{lead.first_name}}     → João
{{lead.city}}           → São Paulo
{{utm.campaign}}        → promo-jan
{{session.count}}       → 3ª visita
{{page.title}}          → Nome da página atual
```

**5.4.4 Editor de Popup (no Dashboard)**
- Editor visual drag-and-drop (no-code)
- Suporte a texto, imagem, vídeo, botão CTA, campo de captura
- Preview em tempo real (desktop e mobile)
- A/B testing nativo (2+ variações por popup)

**5.4.5 Ações do Popup**
- Redirecionar para URL
- Abrir link externo
- Disparar evento customizado (webhook)
- Mostrar mensagem de sucesso
- Abrir WhatsApp com mensagem pré-preenchida
- Fechar e não mostrar novamente (suprimir)

---

### 5.5 Dashboard e Analytics

**Visão Geral (Home)**
- Total de visitantes (dia, semana, mês)
- Visitantes identificados vs. anônimos
- Taxa de conversão geral
- Impressões e CTR dos popups ativos
- Mapa de calor de geolocalização

**Relatório de Leads**
- Lista de leads capturados com perfil completo
- Filtros por: data, UTM, origem, segmento, popup
- Exportação CSV / integração CRM
- Timeline de eventos por lead (o que fez, quando, em qual página)

**Relatório de Popups**
- Impressões, cliques, conversões por popup
- Comparativo A/B testing
- Funil: exibido → clicado → convertido

**Relatório de Tráfego**
- Origens de tráfego e UTMs
- Dispositivos e sistemas operacionais
- Páginas mais visitadas
- Taxa de saída por página

---

### 5.6 Integrações

**Nativas (v1):**
- Webhook (POST JSON customizável)
- WhatsApp via link `wa.me`

**Via Zapier / Make (v1):**
- RD Station
- ActiveCampaign
- HubSpot
- Google Sheets
- Slack

**Nativas planejadas (v2):**
- Meta Ads (envio de eventos para Conversions API)
- Google Tag Manager (layer de dados)
- Klaviyo
- Kommo (amoCRM)

---

## 6. Arquitetura Técnica (Alto Nível)

```
[Visitante] 
    ↓ carrega
[tracker.js — CDN]
    ↓ envia eventos via REST/WebSocket
[API de Ingestão — Edge / Cloudflare Workers]
    ↓
[Fila de Eventos — Redis / SQS]
    ↓
[Processador de Regras — Node.js / Go]
    ↓ avalia gatilhos de popup
[API de Decisão — retorna popup JSON para o tracker.js]
    ↓
[Tracker.js renderiza popup no site do cliente]

[Dados de Eventos] → [Data Warehouse — ClickHouse / BigQuery]
                   → [Dashboard — Next.js + API GraphQL]
```

**Stack sugerida:**
- **Tracker:** Vanilla JavaScript (ES5+ compatível)
- **CDN:** Cloudflare
- **Backend:** Node.js (NestJS) ou Go
- **Banco principal:** PostgreSQL
- **Banco de eventos:** ClickHouse
- **Cache/Filas:** Redis
- **Frontend Dashboard:** Next.js + TailwindCSS
- **Enriquecimento de IP:** MaxMind GeoIP2 ou IPinfo.io

---

## 7. Requisitos Não Funcionais

| Requisito | Meta |
|---|---|
| Latência do script (tempo até primeiro byte) | < 100ms (via CDN) |
| Impacto no PageSpeed do cliente | < 2 pontos |
| Uptime da API de ingestão | 99,9% |
| Latência da decisão de popup | < 200ms |
| Retenção de dados de eventos | 12 meses |
| Conformidade LGPD | Consentimento via banner opcional + anonimização de IP |

---

## 8. Conformidade e Privacidade (LGPD / GDPR)

- Opção de banner de consentimento de cookies integrado ao script
- Possibilidade de anonimizar IP (últimos octetos zerados)
- Política de retenção de dados configurável por conta
- Opção de opt-out por visitante (cookie de exclusão)
- Dados armazenados em servidores no Brasil (opção)
- DPA (Data Processing Agreement) disponível para clientes enterprise

---

## 9. Modelo de Negócio (SaaS)

| Plano | Pageviews/mês | Popups ativos | Usuários | Preço estimado |
|---|---|---|---|---|
| Starter | até 20.000 | 3 | 1 | R$ 97/mês |
| Growth | até 100.000 | 10 | 3 | R$ 297/mês |
| Pro | até 500.000 | ilimitado | 10 | R$ 697/mês |
| Enterprise | customizado | ilimitado | ilimitado | Sob consulta |

---

## 10. Roadmap

### Fase 1 — MVP (0–3 meses)
- [ ] Script de rastreamento (eventos básicos)
- [ ] Enriquecimento por IP
- [ ] Captura de formulários
- [ ] 3 tipos de popup (modal, slide-in, exit intent)
- [ ] Gatilhos: tempo, scroll, exit intent, UTM
- [ ] Dashboard básico: leads, eventos, popups
- [ ] Painel de criação de popup (editor simples)
- [ ] Integração via Webhook

### Fase 2 — Crescimento (3–6 meses)
- [ ] A/B testing de popups
- [ ] Variáveis dinâmicas de personalização
- [ ] Segmentação automática de leads (frio/morno/quente)
- [ ] Integrações nativas (RD Station, ActiveCampaign)
- [ ] Relatórios avançados e exportação
- [ ] Editor drag-and-drop de popups

### Fase 3 — Escala (6–12 meses)
- [ ] Integração com Meta Conversions API
- [ ] Score de lead com IA (propensão a converter)
- [ ] Recomendações automáticas de popup por IA
- [ ] Multi-site por conta
- [ ] White-label para agências

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Bloqueio por adblockers | Alta | Médio | Proxy via domínio próprio do cliente |
| Impacto na performance do site | Médio | Alto | Script assíncrono + monitoramento de Core Web Vitals |
| Conflito com CMP/cookies do cliente | Médio | Médio | Documentação clara + modo de compatibilidade |
| Restrições LGPD | Baixo | Alto | Módulo de consentimento nativo |
| Concorrência (Hotjar, VWO, Clarity) | Alta | Médio | Foco em mercado BR + integração com WhatsApp + preço acessível |

---

## 12. Glossário

| Termo | Definição |
|---|---|
| UTM | Parâmetros de rastreamento de campanha (source, medium, campaign, etc.) |
| Exit Intent | Detecção de que o usuário está prestes a sair da página |
| Back Redirect | Interceptação do comportamento de voltar no navegador |
| Fingerprinting | Identificação de dispositivo sem uso de cookies |
| CRO | Conversion Rate Optimization — otimização da taxa de conversão |
| Pageview | Cada carregamento de página rastreado pelo script |

---

*Este documento é um artefato vivo e deve ser atualizado conforme decisões de produto forem tomadas.*

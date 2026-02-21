# SPEC TÉCNICO — LeadSense Tracker.js

**Versão:** 0.1  
**Status:** Em Desenvolvimento
**Última atualização:** Fevereiro de 2026
**Documento relacionado:** PRD.md, STATUS.md

---

## 1. Visão Geral

O `tracker.js` é o núcleo client-side da plataforma LeadSense. É um script JavaScript leve, assíncrono e universal, responsável por:

1. Coletar dados de comportamento do visitante
2. Enriquecer o perfil do lead via API
3. Escutar eventos e avaliar regras de segmentação
4. Renderizar popups personalizados no DOM
5. Reportar conversões e interações de volta à API

O script deve ser **zero-dependência**, funcionar em qualquer plataforma e ter impacto mínimo na performance da página hospedeira.

---

## 2. Requisitos Técnicos

| Requisito | Especificação |
|---|---|
| Compatibilidade de browsers | Chrome 60+, Firefox 60+, Safari 12+, Edge 80+, iOS Safari 12+ |
| Tamanho do bundle (gzip) | < 12KB inicial, < 30KB total com módulos lazy |
| Carregamento | Assíncrono (não bloqueante) |
| Dependências externas | Nenhuma |
| Suporte a SPA | Sim (React, Vue, Next.js, Nuxt) |
| Suporte a iframes | Não (por design — isolamento de segurança) |
| Modo strict | Compatível com `"use strict"` e CSP básico |
| Cookie policy | First-party cookies apenas (SameSite=Lax) |

---

## 3. Instalação e Inicialização

### 3.1 Snippet de Instalação

O cliente cola este código antes do fechamento do `</head>`:

```html
<script>
  (function(w, d, s, token) {
    var ls = w.LeadSense = w.LeadSense || {};
    ls._token = token;
    ls._queue = [];
    ls.track = function() { ls._queue.push(arguments); };
    ls.identify = function() { ls._queue.push(['identify'].concat([].slice.call(arguments))); };
    var sc = d.createElement(s);
    sc.src = 'https://cdn.leadsense.io/v1/tracker.js';
    sc.async = true;
    sc.setAttribute('data-token', token);
    d.head.appendChild(sc);
  })(window, document, 'script', 'TOKEN_DO_CLIENTE');
</script>
```

**Vantagem:** A fila `_queue` captura chamadas feitas antes do script carregar, garantindo que nenhum evento seja perdido.

### 3.2 Alternativa via Atributo (simplificada)

Para usuários menos técnicos, suporte ao carregamento via tag simples:

```html
<script 
  src="https://cdn.leadsense.io/v1/tracker.js" 
  data-token="TOKEN_DO_CLIENTE"
  async>
</script>
```

### 3.3 Via Google Tag Manager

Instrução de variável GTM para o campo URL do script customizado:

```
https://cdn.leadsense.io/v1/tracker.js?token={{LeadSense Token}}
```

---

## 4. Ciclo de Vida do Script

```
Carregamento
    │
    ▼
init()
├── Lê data-token
├── Gera / recupera visitor_id (cookie + fingerprint)
├── Detecta contexto (SPA? iframe? bot?)
├── Verifica consentimento (LGPD mode)
│
▼
session_start()
├── Coleta dados iniciais da sessão (UTM, referrer, device, IP async)
├── Dispara evento page_view
├── Registra timestamp de entrada
│
▼
Loop de Observação (event listeners)
├── scroll → scroll_depth events
├── mousemove → exit_intent detection
├── click → click events
├── visibilitychange → tab_hidden / tab_visible
├── popstate / hashchange → SPA navigation
├── beforeunload → session_end
│
▼
Motor de Regras (a cada evento)
├── Avalia regras dos popups ativos via config remota
├── Se gatilho atingido → renderiza popup
│
▼
session_end()
├── Envia evento de saída com duração e scroll máximo
└── Flush da fila de eventos pendentes
```

---

## 5. Gerenciamento de Identidade do Visitante

### 5.1 Visitor ID

O `visitor_id` é um UUID v4 gerado no primeiro acesso e persistido para reconhecer visitantes recorrentes.

**Estratégia de persistência (ordem de prioridade):**

```
1. Cookie first-party: _ls_vid (expires: 365 dias, SameSite=Lax)
2. localStorage: leadsense_vid
3. sessionStorage: leadsense_vid_session (fallback para Safari ITP)
4. Canvas Fingerprint (fallback sem storage — não persistente)
```

### 5.2 Session ID

O `session_id` é um UUID v4 gerado a cada nova sessão (nova aba, após 30 min de inatividade ou novo dia).

```
Cookie: _ls_sid (expires: session, SameSite=Lax)
```

### 5.3 Fingerprinting (Passivo)

Usado apenas como fallback ou para reforço de identidade, nunca como identificador primário. Componentes usados:

- User-Agent
- Resolução de tela + color depth
- Fuso horário
- Idioma do navegador
- Lista de plugins instalados
- Canvas hash (renderização de texto em canvas)
- WebGL renderer string

**Resultado:** Hash SHA-256 de 64 chars, armazenado no `visitor_id` como sufixo quando cookies são bloqueados.

### 5.4 Estrutura do Perfil Local

```javascript
{
  visitor_id: "uuid-v4",
  session_id: "uuid-v4",
  is_returning: true,
  session_count: 3,
  first_seen: "2026-01-10T14:23:00Z",
  last_seen: "2026-02-18T09:00:00Z",
  identified: false,
  lead: {
    name: null,
    email: null,
    whatsapp: null
  }
}
```

---

## 6. Coleta de Dados

### 6.1 Dados de Sessão (coletados no init)

```javascript
{
  // Origem
  utm_source:   "facebook",
  utm_medium:   "cpc",
  utm_campaign: "promo-fevereiro",
  utm_term:     "curso online",
  utm_content:  "criativo-A",
  referrer:     "https://facebook.com/...",
  referrer_domain: "facebook.com",

  // Página
  url:          "https://meusite.com.br/oferta",
  path:         "/oferta",
  title:        "Oferta Especial",
  
  // Dispositivo
  device_type:  "mobile",       // mobile | tablet | desktop
  os:           "iOS",
  os_version:   "17.2",
  browser:      "Safari",
  browser_version: "17.0",
  screen_width: 390,
  screen_height: 844,
  language:     "pt-BR",
  timezone:     "America/Sao_Paulo",
  
  // Conexão
  connection_type: "4g",        // via Navigator.connection API
  
  // Timestamp
  created_at: "2026-02-18T09:00:00Z"
}
```

### 6.2 Enriquecimento por IP (assíncrono)

Após o `session_start`, o script faz uma requisição ao endpoint de enriquecimento:

```
GET https://api.leadsense.io/v1/enrich/ip
Headers: X-LS-Token: TOKEN, X-LS-Visitor: visitor_id
```

**Resposta esperada:**

```json
{
  "ip": "177.92.x.x",
  "ip_anonymized": "177.92.0.0",
  "country": "BR",
  "state": "SP",
  "city": "São Paulo",
  "isp": "Claro",
  "connection_type": "residential",
  "is_vpn": false,
  "is_proxy": false,
  "is_datacenter": false,
  "is_bot": false
}
```

Se `is_bot: true`, o tracker entra em modo silencioso (não dispara popups, não envia eventos para o dashboard principal).

### 6.3 Captura de Formulários

O tracker observa o DOM e intercepta formulários automaticamente.

**Lógica de detecção:**

```javascript
// 1. Scan inicial ao carregar
document.querySelectorAll('form').forEach(attachFormListener);

// 2. MutationObserver para formulários adicionados dinamicamente (SPA, popups)
const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    m.addedNodes.forEach(node => {
      if (node.querySelectorAll) {
        node.querySelectorAll('form').forEach(attachFormListener);
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });
```

**Campos capturados (por heurística de nome/id/placeholder):**

| Campo | Detectores (name, id, placeholder, aria-label) |
|---|---|
| Nome | `name`, `nome`, `full_name`, `first_name`, `firstName` |
| Email | `email`, `e-mail`, `mail` |
| Telefone/WhatsApp | `phone`, `telefone`, `whatsapp`, `celular`, `fone`, `tel` |
| Empresa | `company`, `empresa`, `negocio` |
| CPF | `cpf`, `documento` |

**Captura é feita em dois momentos:**
1. `blur` em cada campo (captura parcial, útil para abandono de formulário)
2. `submit` do formulário (captura completa)

**Sanitização antes do envio:**
- Campos `type="password"` são ignorados
- Campos `type="hidden"` são ignorados salvo whitelist explícita
- Dados PII são enviados via HTTPS e nunca armazenados no localStorage

### 6.4 Eventos Rastreados

Todos os eventos seguem o mesmo schema de envio:

```typescript
interface LeadSenseEvent {
  event:      string;           // nome do evento
  visitor_id: string;
  session_id: string;
  token:      string;
  timestamp:  number;           // Unix timestamp ms
  url:        string;
  path:       string;
  properties: Record<string, any>;
}
```

**Catálogo de Eventos:**

```
page_view
  properties: { title, referrer, utm_* }

scroll_depth
  properties: { depth: 25 | 50 | 75 | 90 | 100 }
  obs: disparado uma vez por threshold por session

time_on_page
  properties: { seconds: 15 | 30 | 60 | 120 | 300 }
  obs: disparado uma vez por threshold por session

click
  properties: { 
    tag: "BUTTON", 
    text: "Quero Comprar", 
    href: "/checkout",
    selector: "#btn-cta",
    classes: ["btn", "btn-primary"]
  }

form_start
  properties: { form_id, form_action, field_name }

form_field_blur
  properties: { form_id, field_name, field_type, has_value: true }
  obs: nunca inclui o valor do campo

form_submit
  properties: { form_id, form_action, captured_fields: ["email","name"] }

exit_intent
  properties: { scroll_at_exit: 67, time_on_page: 45 }

back_button
  properties: { from_url, to_url }

tab_hidden
  properties: { visible_for_seconds: 38 }

tab_visible
  properties: { hidden_for_seconds: 120 }

idle
  properties: { idle_seconds: 30 }

spa_navigation
  properties: { from_path, to_path }

popup_shown
  properties: { popup_id, popup_name, trigger_type, trigger_value }

popup_clicked
  properties: { popup_id, popup_name, action_type, action_value }

popup_closed
  properties: { popup_id, popup_name, closed_after_seconds: 5 }

session_end
  properties: { duration_seconds, max_scroll, page_count, event_count }

page_leave
  properties: { time_on_page, scroll_percentage }
```

---

## 7. Comunicação com a API

### 7.1 Endpoints Consumidos pelo Tracker

### 7.1 Endpoints Consumidos pelo Tracker

**Base URL:** `v1` (Edge Functions)

| Endpoint | Método | Descrição |
|---|---|---|
| `/enrich-ip` | GET | Enriquecimento de IP e geolocalização |
| `/track-events` | POST | Envio de lote de eventos (substitui `/events/batch`) |
| `/get-config` | GET | Configuração de popups ativos (substitui `/config/{token}`) |
| `/identify-lead` | POST | Identificação do lead (substitui `/identify`) |

### 7.2 Estratégia de Envio de Eventos (Batch)

Eventos não são enviados individualmente. O tracker mantém uma fila local e envia em lotes:

```
Envio disparado quando:
  - Fila atinge 10 eventos
  - Passou 5 segundos desde o último envio
  - beforeunload (flush imediato via sendBeacon)
```

```javascript
// Flush via Beacon API (garantido mesmo em beforeunload)
navigator.sendBeacon(
  'hhttps://<SUPABASE_PROJECT_URL>/functions/v1/track-events',
  JSON.stringify({ events: queue, token })
);

// Flush normal (fetch com retry)
// Flush normal (fetch com retry)
fetch('https://<SUPABASE_PROJECT_URL>/functions/v1/track-events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ events: queue, token }),
  keepalive: true
});
```

**Retry policy:**
- 3 tentativas com backoff exponencial (1s, 2s, 4s)
- Falhas após 3 tentativas são descartadas (não bloquear UX)

### 7.3 Configuração Remota de Popups

O tracker busca a config de popups ao inicializar e a cacheia:

```
GET https://<SUPABASE_ID>.supabase.co/functions/v1/get-config?token={token}
Cache: localStorage, TTL de 5 minutos
```

**Schema de resposta:**

```json
{
  "popups": [
    {
      "id": "popup_abc123",
      "name": "Oferta de Saída",
      "status": "active",
      "config": {
        "triggers": [
          { "type": "exit_intent" },
          { "type": "time_on_page", "value": 60 }
        ],
        "conditions": [
          { "type": "utm_source", "operator": "equals", "value": "facebook" },
          { "type": "session_count", "operator": "gte", "value": 1 }
        ],
        "frequency": {
          "show_once_per": "session"   // session | day | week | always
        },
        "template": {
          "type": "modal",             // modal | slide_in | top_bar | toast
          "position": "center",
          "animation": "fade",
          "content": {
             "html": "<div class='ls-popup'>...</div>",
             "css": ".ls-popup { ... }"
          }
        },
        "actions": [
          { "type": "redirect", "value": "/oferta-especial" }
        ]
      }
    }
  ]
}
```

---

## 8. Motor de Regras e Popups

### 8.1 Avaliação de Gatilhos

A cada evento disparado, o motor avalia todos os popups ativos:

```javascript
function evaluateTriggers(event, context) {
  for (const popup of activePopups) {
    if (hasBeenShown(popup)) continue;
    if (!allConditionsMet(popup.config.conditions, context)) continue;
    
    const triggered = popup.config.triggers.some(trigger => 
      matchesTrigger(trigger, event, context)
    );
    
    if (triggered) {
      showPopup(popup);
      markAsShown(popup);
    }
  }
}
```

**Operadores de condição suportados:**

| Operador | Exemplo |
|---|---|
| `equals` | `utm_source equals "google"` |
| `not_equals` | `device_type not_equals "mobile"` |
| `contains` | `url contains "/checkout"` |
| `starts_with` | `path starts_with "/blog"` |
| `gte` | `session_count gte 2` |
| `lte` | `scroll_depth lte 30` |
| `exists` | `lead.email exists` |
| `not_exists` | `lead.email not_exists` |
| `in` | `utm_campaign in ["camp-a","camp-b"]` |

### 8.2 Controle de Frequência

```javascript
function hasBeenShown(popup) {
  const key = `_ls_shown_${popup.id}`;
  const lastShown = localStorage.getItem(key);
  if (!lastShown) return false;

  const freq = popup.config.frequency.show_once_per;
  const elapsed = Date.now() - parseInt(lastShown);

  if (freq === 'session') return sessionStorage.getItem(key) !== null;
  if (freq === 'day')     return elapsed < 86400000;
  if (freq === 'week')    return elapsed < 604800000;
  if (freq === 'always')  return false;
  return true;
}
```

### 8.3 Renderização do Popup

O HTML do popup é injetado em um Shadow DOM para garantir isolamento de estilos:

```javascript
function renderPopup(popup) {
  const host = document.createElement('div');
  host.id = `ls-popup-${popup.id}`;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });
  
  const style = document.createElement('style');
  style.textContent = popup.config.template.content.css + BASE_RESET_CSS;
  
  const container = document.createElement('div');
  container.innerHTML = popup.config.template.content.html;
  
  shadow.appendChild(style);
  shadow.appendChild(container);

  // Substituição de variáveis dinâmicas
  applyTemplateVars(shadow, getTemplateContext());
  
  // Eventos de fechar
  attachCloseListeners(shadow, popup);
  
  // Acessibilidade
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-modal', 'true');
  container.focus();

  track('popup_shown', { popup_id: popup.id, popup_name: popup.name });
}
```

### 8.4 Variáveis de Template

```javascript
function getTemplateContext() {
  return {
    'lead.first_name': getFirstName(profile.lead.name) || 'visitante',
    'lead.name':       profile.lead.name || '',
    'lead.email':      profile.lead.email || '',
    'lead.city':       ipData.city || '',
    'lead.state':      ipData.state || '',
    'utm.source':      session.utm_source || '',
    'utm.campaign':    session.utm_campaign || '',
    'session.count':   profile.session_count || 1,
    'page.title':      document.title,
    'page.url':        location.href
  };
}

function applyTemplateVars(root, context) {
  root.querySelectorAll('[data-ls-text]').forEach(el => {
    const key = el.getAttribute('data-ls-text');
    el.textContent = context[key] || '';
  });
  // Também substitui {{varname}} em textContent
  root.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0 && el.textContent.includes('{{')) {
      el.textContent = el.textContent.replace(/\{\{(.+?)\}\}/g, (_, k) => context[k.trim()] || '');
    }
  });
}
```

---

## 9. SDK Público (API JavaScript)

Métodos expostos no objeto global `window.LeadSense`:

```javascript
// Identificar o lead manualmente (ex: após login ou preenchimento de form)
LeadSense.identify({
  name:      "João Silva",
  email:     "joao@email.com",
  whatsapp:  "5511999999999",
  custom: {
    plano: "pro",
    origem_crm: "rd_station"
  }
});

// Disparar evento customizado
LeadSense.track("video_play", {
  video_title: "Apresentação do Produto",
  duration: 180
});

// Forçar exibição de um popup específico (para testes)
LeadSense.showPopup("popup_abc123");

// Verificar se o visitante já foi identificado
LeadSense.isIdentified(); // → true | false

// Retornar o perfil atual do visitante
LeadSense.getProfile(); // → { visitor_id, session_id, lead, ... }

// Desativar rastreamento (opt-out LGPD)
LeadSense.optOut();

// Reativar rastreamento
LeadSense.optIn();

// Callback para quando o lead é identificado
LeadSense.onIdentify(function(lead) {
  console.log('Lead identificado:', lead);
});
```

---

## 10. Suporte a SPA (Single Page Applications)

Frameworks como Next.js, Nuxt, React e Vue alteram a URL sem recarregar a página. O tracker lida com isso:

```javascript
// Escuta mudanças de rota via History API
const originalPushState = history.pushState;
history.pushState = function(...args) {
  originalPushState.apply(history, args);
  onRouteChange(location.href);
};

window.addEventListener('popstate', () => onRouteChange(location.href));

function onRouteChange(newUrl) {
  const from = currentPath;
  currentPath = new URL(newUrl).pathname;
  
  // Envia evento de navegação
  track('spa_navigation', { from_path: from, to_path: currentPath });
  
  // Dispara novo page_view
  track('page_view', { url: newUrl, title: document.title });
  
  // Reavalia popups para a nova rota
  refreshPopupConfig();
  resetPageMetrics(); // zera scroll e tempo para a nova página
}
```

---

## 11. Detecção de Exit Intent e Back Button

### 11.1 Exit Intent (Desktop)

```javascript
document.addEventListener('mouseleave', (e) => {
  // Só dispara se cursor saiu pelo topo (direção de fechar aba)
  if (e.clientY <= 0 && e.relatedTarget === null) {
    if (!exitIntentFired && timeOnPage > MIN_TIME_BEFORE_EXIT) {
      exitIntentFired = true;
      track('exit_intent', { scroll_at_exit: maxScroll, time_on_page: timeOnPage });
      evaluateTriggers({ type: 'exit_intent' }, getContext());
    }
  }
});
```

### 11.2 Exit Intent (Mobile)

Em mobile, `mouseleave` não funciona. Estratégias alternativas:

```javascript
// 1. Visibilidade: usuário troca de aba ou minimiza o app
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    track('tab_hidden', { visible_for_seconds: timeOnPage });
    evaluateTriggers({ type: 'tab_hidden' }, getContext());
  }
});

// 2. Scroll para cima rápido (comportamento comum antes de fechar)
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const delta = lastScrollY - window.scrollY;
  if (delta > 80) { // scrollou 80px para cima rapidamente
    evaluateTriggers({ type: 'scroll_up_fast' }, getContext());
  }
  lastScrollY = window.scrollY;
}, { passive: true });
```

### 11.3 Back Button / Back Redirect

```javascript
// Técnica: empurra um estado extra no history ao carregar
// Se o usuário clicar "voltar", retorna para esse estado e interceptamos
history.pushState({ ls_sentinel: true }, '', location.href);

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.ls_sentinel) {
    track('back_button', { from_url: location.href });
    evaluateTriggers({ type: 'back_button' }, getContext());
    
    // Reempurra o sentinel para permitir múltiplas interceptações
    // mas respeita o limite de frequência do popup
    history.pushState({ ls_sentinel: true }, '', location.href);
  }
});
```

---

## 12. Performance e Otimizações

### 12.1 Carregamento Lazy de Módulos

O bundle inicial contém apenas o core. Módulos pesados são carregados sob demanda:

```
tracker.js (core ~8KB gzip)
  ├── Carregado imediatamente:
  │     init, session, events, queue, cookie
  │
  └── Carregados sob demanda:
        popup-renderer.js  (~10KB) — quando há popup a exibir
        form-capture.js    (~4KB)  — quando há form na página
        fingerprint.js     (~6KB)  — quando cookies estão bloqueados
```

```javascript
function loadModule(name) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://cdn.leadsense.io/v1/modules/${name}.js`;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}
```

### 12.2 Scroll Listener Otimizado

```javascript
// Usar requestAnimationFrame para evitar layout thrashing
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollMetrics();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

### 12.3 Debounce e Throttle

```javascript
// Resize com debounce (não precisa de precisão)
window.addEventListener('resize', debounce(updateViewport, 250));

// Mousemove com throttle (exit intent — 100ms é suficiente)
document.addEventListener('mousemove', throttle(checkExitIntent, 100));
```

---

## 13. Privacidade e Conformidade LGPD

### 13.1 Modos de Operação

O tracker suporta 3 modos configuráveis pelo cliente:

| Modo | Comportamento |
|---|---|
| `full` (padrão) | Coleta tudo, incluindo IP e dados de formulário |
| `anonymous` | Coleta comportamento, anonimiza IP, não captura formulários |
| `consent_required` | Aguarda consentimento do usuário antes de qualquer coleta |

Configurado no snippet:
```html
<script data-token="TOKEN" data-privacy-mode="consent_required" async ...>
```

### 13.2 Opt-Out

```javascript
// Quando chamado, armazena flag de opt-out e para toda coleta
LeadSense.optOut();

// Internamente:
function optOut() {
  document.cookie = '_ls_optout=1; expires=Fri, 31 Dec 2099 23:59:59 GMT; path=/; SameSite=Lax';
  localStorage.setItem('_ls_optout', '1');
  stopAllListeners();
  clearQueue();
}
```

### 13.3 Dados Nunca Coletados

- Senhas ou campos `type="password"`
- Dados de cartão de crédito (campos com nome/id relacionados a `card`, `cvv`, `pan`)
- Conteúdo de campos `contenteditable`
- Histórico de clipboard

---

## 14. Tratamento de Erros

O tracker nunca deve lançar erros não tratados que possam afetar o site do cliente:

```javascript
// Wrapper global de segurança
function safe(fn, context) {
  try {
    return fn();
  } catch (e) {
    if (isDebugMode()) {
      console.warn('[LeadSense] Error in', context, e);
    }
    // Silencioso em produção — jamais quebrar o site do cliente
  }
}

// Uso:
safe(() => initSession(), 'initSession');
safe(() => renderPopup(popup), 'renderPopup');
```

**Modo debug:**
```javascript
// Ativado via parâmetro na URL ou config
// https://meusite.com.br/?ls_debug=1
window.LeadSense.debug = true;
```

No modo debug, o console exibe:
- Cada evento disparado com seus dados
- Avaliação de gatilhos (por que um popup foi ou não exibido)
- Status da fila de envio
- Configuração de popups carregada

---

## 15. Testes

### 15.1 Testes Unitários

- Framework: **Vitest**
- Cobertura mínima: 80%
- Módulos críticos (identity, rules engine, form capture): 95%

### 15.2 Testes de Integração

- Simulação de diferentes navegadores via **Playwright**
- Testes em WordPress (plugin), Shopify (theme script), HTML puro
- Verificação de ausência de erros no console do site hospedeiro
- Verificação de impacto no Lighthouse Score (< 2 pontos de perda)

### 15.3 Testes de Carga

- Script deve suportar páginas com 500+ elementos DOM sem degradação
- Fila de eventos deve suportar 1000 eventos em memória sem vazamento

---

## 16. Versionamento e Deploy

```
CDN: https://cdn.leadsense.io/v1/tracker.js   (sempre atualizado — sem breaking changes)
     https://cdn.leadsense.io/v1.2.3/tracker.js (versão fixada)
```

- Atualizações da v1.x são **não-breaking** (retrocompatíveis)
- Breaking changes incrementam a versão principal: v2/
- Cache CDN: 1 hora (com stale-while-revalidate)
- Hash de integridade disponível para clientes que usam CSP com `integrity`:

```html
<script 
  src="https://cdn.leadsense.io/v1/tracker.js"
  integrity="sha384-HASH_AQUI"
  crossorigin="anonymous"
  data-token="TOKEN"
  async>
</script>
```

---

## 17. Estrutura de Arquivos do Projeto

```
leadsense-tracker/
├── src/
│   ├── core/
│   │   ├── init.js            # Bootstrap e configuração
│   │   ├── identity.js        # visitor_id, session_id, fingerprint
│   │   ├── session.js         # Dados de sessão (UTM, device, etc.)
│   │   ├── queue.js           # Fila de eventos e envio batch
│   │   └── config.js          # Fetch e cache da config remota
│   ├── collectors/
│   │   ├── scroll.js          # scroll_depth tracking
│   │   ├── clicks.js          # click tracking
│   │   ├── forms.js           # form capture
│   │   ├── exit-intent.js     # exit_intent (desktop + mobile)
│   │   ├── back-button.js     # back button intercept
│   │   ├── time.js            # time_on_page, idle
│   │   └── spa.js             # SPA navigation
│   ├── popup/
│   │   ├── engine.js          # Motor de regras e gatilhos
│   │   ├── renderer.js        # Renderização no Shadow DOM
│   │   ├── templates.js       # Substituição de variáveis
│   │   └── frequency.js       # Controle de frequência
│   ├── api/
│   │   ├── events.js          # POST /v1/events/batch
│   │   ├── enrich.js          # GET /v1/enrich/ip
│   │   └── identify.js        # POST /v1/identify
│   ├── privacy/
│   │   ├── consent.js         # LGPD consent mode
│   │   └── optout.js          # Opt-out handler
│   └── sdk.js                 # API pública (LeadSense.*)
├── tests/
│   ├── unit/
│   └── integration/
├── dist/
│   ├── tracker.js             # Bundle final (UMD)
│   └── tracker.min.js
├── rollup.config.js
├── vitest.config.js
└── package.json
```

## 18. Esquema do Banco de Dados (Supabase)

### sites
* `id` (uuid)
* `user_id` (uuid, fk profiles)
* `domain` (text)
* `status` (text: active, pending)
* `settings` (jsonb)

### popups
* `id` (uuid)
* `site_id` (uuid, fk sites)
* `name` (text)
* `status` (text: active, paused, draft)
* `config` (jsonb: triggers, conditions, template, etc.)
* `created_at` (timestamptz)

### leads
* `id` (uuid)
* `site_id` (uuid, fk sites)
* `visitor_id` (uuid)
* `session_id` (uuid)
* `popup_id` (uuid, fk popups, nullable)
* `name` (text)
* `email` (text)
* `whatsapp` (text)
* `extra_data` (jsonb)
* `utm_source` (text)
* `utm_medium` (text)
* `utm_campaign` (text)
* `device_type` (text)
* `created_at` (timestamptz)

### events (ClickHouse - Futuro / Supabase Log - Atual)
* `id` (uuid)
* `site_id` (uuid)
* `visitor_id` (uuid)
* `session_id` (uuid)
* `event_name` (text)
* `properties` (jsonb)
* `url` (text)
* `timestamp` (timestamptz)
```

---

*Este documento deve ser atualizado a cada sprint. Decisões de implementação que divergirem deste spec devem ser registradas com justificativa.*

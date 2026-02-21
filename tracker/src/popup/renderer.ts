'use strict';

/**
 * popup/renderer.ts
 * Renderiza popups usando Shadow DOM para total isolamento de CSS.
 * Suporta: modal, slide_in, top_bar, toast
 */

import { Popup, LeadProfile } from '../core/types';
import { executeActions } from './actions';

type TrackFn = (event: string, props: Record<string, unknown>) => void;

const HOST_ID = '__ls_popup_host__';

// ─── Substituição de Variáveis ────────────────────────────────────
function interpolate(html: string, profile: LeadProfile): string {
  const lead = profile.lead;
  return html
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name || '')
    .replace(/\{\{\s*email\s*\}\}/gi, lead.email || '')
    .replace(/\{\{\s*first_name\s*\}\}/gi, (lead.name || '').split(' ')[0])
    .replace(/\{\{\s*city\s*\}\}/gi, '') // IP data added in future phase
    .replace(/\{\{\s*session_count\s*\}\}/gi, String(profile.session_count));
}

function sanitizeHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const allowedTags = new Set([
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'a', 'button', 'input', 'form', 'label', 'strong', 'em', 'br'
  ]);

  function cleanNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (!allowedTags.has(tag)) {
        el.remove();
        return;
      }

      // Remove all attributes starting with 'on' or 'javascript:' in href/src
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value.toLowerCase();
        if (attrName.startsWith('on')) {
          el.removeAttribute(attr.name);
        } else if ((attrName === 'href' || attrName === 'src') && attrValue.includes('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    }

    // Traverse children explicitly because we might mutate the DOM tree
    const children = Array.from(node.childNodes);
    for (const child of children) {
      cleanNode(child);
    }
  }

  const children = Array.from(doc.body.childNodes);
  for (const child of children) {
    cleanNode(child);
  }

  return doc.body.innerHTML;
}

// ─── Animações ────────────────────────────────────────────────────
function getAnimationCSS(animation: string, type: string): string {
  const base = `
    @keyframes ls-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ls-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ls-slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ls-slide-right { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
  `;

  const anim = animation === 'fade' ? 'ls-fade-in'
    : type === 'top_bar' ? 'ls-slide-down'
      : type === 'slide_in' ? 'ls-slide-right'
        : 'ls-slide-up';

  return `${base}\n.__ls-popup-inner { animation: ${anim} 0.35s ease forwards; }`;
}

// ─── Wrapper de Layout ────────────────────────────────────────────
function buildWrapper(popup: Popup): string {
  const { type, position } = popup.config.template;

  const posMap: Record<string, string> = {
    center: 'align-items: center; justify-content: center;',
    top: 'align-items: flex-start; justify-content: center; padding-top: 40px;',
    bottom: 'align-items: flex-end; justify-content: center; padding-bottom: 40px;',
    'bottom-right': 'align-items: flex-end; justify-content: flex-end; padding: 20px;',
    'bottom-left': 'align-items: flex-end; justify-content: flex-start; padding: 20px;',
  };

  const flexPos = posMap[position] || posMap['center'];

  if (type === 'top_bar') {
    return `<div class="__ls-popup-overlay" style="
      position: fixed; top: 0; left: 0; right: 0; z-index: 2147483640;
      display: flex; flex-direction: column; pointer-events: none;
    ">`;
  }

  if (type === 'toast' || type === 'slide_in') {
    return `<div class="__ls-popup-overlay" style="
      position: fixed; inset: 0; z-index: 2147483640; pointer-events: none;
      display: flex; ${flexPos}
    ">`;
  }

  // modal com overlay
  return `<div class="__ls-popup-overlay" style="
    position: fixed; inset: 0; z-index: 2147483640;
    background: rgba(0,0,0,0.5); display: flex; ${flexPos}
  " data-ls-close-overlay>`;
}

// ─── Botão de Fechar ──────────────────────────────────────────────
const CLOSE_BTN_HTML = `
<button data-ls-close style="
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; cursor: pointer;
  color: inherit; font-size: 20px; line-height: 1;
  opacity: 0.7; padding: 4px;
" aria-label="Fechar">✕</button>
`;

// ─── Render ───────────────────────────────────────────────────────
export function renderPopup(popup: Popup, profile: LeadProfile, track: TrackFn, onClose: () => void): void {
  // Remove popup anterior se existir
  closeActivePopup();

  const { content, animation, type } = popup.config.template;

  // Cria host element
  const host = document.createElement('div');
  host.id = HOST_ID;
  document.body.appendChild(host);

  // Shadow DOM (open mode for tests & events tracking)
  let shadow: ShadowRoot | HTMLElement;
  try {
    shadow = host.attachShadow({ mode: 'open' });
  } catch {
    // fallback jsdom se algo der errado
    shadow = host;
  }

  const css = `
    ${getAnimationCSS(animation, type)}
    .__ls-popup-inner {
      position: relative;
      max-width: 95vw;
      pointer-events: auto;
      box-sizing: border-box;
    }
    .__ls-popup-inner * { box-sizing: border-box; }
    ${content.css || ''}
  `;

  const rawHtml = interpolate(content.html, profile);
  const html = sanitizeHTML(rawHtml);
  const wrapper = buildWrapper(popup);

  shadow.innerHTML = `
    <style>${css}</style>
    ${wrapper}
      <div class="__ls-popup-inner">
        ${CLOSE_BTN_HTML}
        ${html}
      </div>
    </div>
  `;

  // Eventos de fechar
  function scheduleClose(): void {
    track('popup_closed', { popup_id: popup.id });
    closeActivePopup();
    onClose();
  }

  shadow.querySelector('[data-ls-close]')?.addEventListener('click', scheduleClose);
  shadow.querySelector('[data-ls-close-overlay]')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) scheduleClose();
  });

  // Esc key
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { scheduleClose(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);

  // CTA buttons dentro do conteúdo
  shadow.querySelectorAll('[data-ls-action="submit"], [data-ls-submit]').forEach(btn => {
    btn.addEventListener('click', () => {
      track('popup_cta_click', { popup_id: popup.id });
      executeActions(popup, track);
      scheduleClose();
    });
  });

  track('popup_shown', { popup_id: popup.id, popup_name: popup.name, type });
}

export function closeActivePopup(): void {
  document.getElementById(HOST_ID)?.remove();
}

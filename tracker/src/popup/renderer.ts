'use strict';

/**
 * popup/renderer.ts
 * Renderiza popups usando Shadow DOM para total isolamento de CSS.
 * Suporta: modal, slide_in, top_bar, toast
 */

import { Popup, LeadProfile } from '../core/types';
import { executeActions } from './actions';

type TrackFn = (event: string, props: Record<string, unknown>) => void;
type IdentifyFn = (data: Record<string, unknown>) => void;

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
function getAnimationCSS(type: string): string {
  const base = `
    @keyframes ls-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ls-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ls-slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ls-slide-right { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
  `;

  const anim = type === 'modal' ? 'ls-fade-in'
    : type === 'top-bar' ? 'ls-slide-down'
      : type === 'slide-in' ? 'ls-slide-right'
        : 'ls-slide-up';

  return `${base}\n.__ls-popup-inner { animation: ${anim} 0.35s ease forwards; }`;
}

// ─── CSS Helper ───────────────────────────────────────────────────
function toInlineStyle(props: Record<string, any>, isContainer = false): string {
  // Converte camelCase props (como fontSize, backgroundColor) para dash-case CSS inline style
  const styleString = Object.entries(props)
    .filter(([k, v]) => v !== undefined && v !== '' && !['text', 'src', 'alt', 'placeholder', 'fieldType', 'name', 'required'].includes(k))
    .map(([k, v]) => {
      let cssKey = k.replace(/([A-Z])/g, "-$1").toLowerCase();
      let cssVal = v;
      if (typeof v === 'number' && !['opacity', 'zIndex', 'fontWeight', 'lineHeight'].includes(k)) {
        cssVal = `${v}px`;
      }
      return `${cssKey}: ${cssVal}`;
    })
    .join('; ');

  if (!isContainer) return styleString;

  // Add default container styles for flex/stack layouts typically used in headings/texts
  return `${styleString}; max-width: 100%; word-break: break-word;`;
}

// ─── Layer Generator ──────────────────────────────────────────────
function generateLayerHTML(layer: any, profile: LeadProfile): string {
  const { type, props = {} } = layer;
  let html = '';

  switch (type) {
    case 'heading':
    case 'text': {
      const tag = type === 'heading' ? 'h2' : 'p';
      const text = interpolate(props.text || '', profile);
      const style = toInlineStyle({ ...props, marginBottom: 12 }, true);
      html = `<${tag} style="margin: 0; ${style}">${text}</${tag}>`;
      break;
    }
    case 'hero_image':
    case 'avatar_image': {
      const src = props.src || '';
      const alt = props.alt || '';
      const defaultAvatarStyle = type === 'avatar_image' ? { borderRadius: '50%', objectFit: 'cover' as const, width: 64, height: 64 } : { maxWidth: '100%', objectFit: 'cover' as const, borderRadius: 8 };
      const style = toInlineStyle({ ...defaultAvatarStyle, ...props, marginBottom: 16 }, true);
      html = `<img src="${src}" alt="${alt}" style="${style}" />`;
      break;
    }
    case 'button': {
      const text = interpolate(props.text || 'Submit', profile);
      const style = toInlineStyle({
        padding: '12px 24px',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        fontWeight: 'bold',
        transition: 'opacity 0.2s',
        ...props
      });
      html = `<button data-ls-submit style="${style}">${text}</button>`;
      break;
    }
    case 'input_field': {
      const placeholder = interpolate(props.placeholder || '', profile);
      const fieldType = props.fieldType || 'text';
      const name = props.name || fieldType;
      const required = props.required ? 'required' : '';
      const style = toInlineStyle({
        padding: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        width: '100%',
        marginBottom: 12,
        outline: 'none',
        ...props
      });
      html = `<input type="${fieldType}" name="${name}" placeholder="${placeholder}" ${required} style="${style}" />`;
      break;
    }
    default:
      console.warn('Unknown layer type:', type);
  }

  return html;
}

// ─── Wrapper de Layout ────────────────────────────────────────────
function buildWrapper(popup: Popup): string {
  const { type } = popup;

  const baseOverlay = `position: fixed; inset: 0; z-index: 2147483640; display: flex; box-sizing: border-box;`;

  if (type === 'top-bar') {
    return `<div class="__ls-popup-overlay" style="${baseOverlay} align-items: flex-start; pointer-events: none; bottom: auto;">`;
  }

  if (type === 'toast' || type === 'slide-in') {
    return `<div class="__ls-popup-overlay" style="${baseOverlay} align-items: flex-end; justify-content: flex-end; padding: 20px; pointer-events: none;">`;
  }

  // modal com overlay
  return `<div class="__ls-popup-overlay" style="${baseOverlay} align-items: center; justify-content: center; background: rgba(0,0,0,0.5); padding: 16px;" data-ls-close-overlay>`;
}

// ─── Base Content Container Style ────────────────────────────────
function getContainerStyle(type: string): string {
  const base = `background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 24px; position: relative; pointer-events: auto; display: flex; flex-direction: column; width: 100%;`;
  if (type === 'top-bar') return `background: white; width: 100%; padding: 12px 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative; pointer-events: auto; display: flex; align-items: center; justify-content: center; gap: 16px;`;
  if (type === 'toast' || type === 'slide-in') return `${base} max-width: 360px;`;
  // Modal default
  return `${base} max-width: 450px;`;
}

// ─── Botão de Fechar ──────────────────────────────────────────────
const CLOSE_BTN_HTML = `
<button data-ls-close style="
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; cursor: pointer;
  color: #71717a; font-size: 20px; line-height: 1;
  opacity: 0.7; padding: 4px;
" aria-label="Fechar">✕</button>
`;

// ─── Render ───────────────────────────────────────────────────────
export function renderPopup(popup: Popup, profile: LeadProfile, track: TrackFn, onClose: () => void): void {
  // Remove popup anterior se existir
  closeActivePopup();

  const { type, layers = [] } = popup;

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
    ${getAnimationCSS(type)}
    .__ls-popup-inner * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    .__ls-popup-inner input::placeholder { color: #a1a1aa; }
    .__ls-popup-inner button:hover { opacity: 0.9; }
  `;

  const contentHtml = layers.map(layer => generateLayerHTML(layer, profile)).join('');
  const wrapper = buildWrapper(popup);
  const containerStyle = getContainerStyle(type);

  shadow.innerHTML = `
    <style>${css}</style>
    ${wrapper}
      <div class="__ls-popup-inner" style="${containerStyle}">
        ${type !== 'top-bar' ? CLOSE_BTN_HTML : ''}
        ${type === 'top-bar' ? `<div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1200px;">${contentHtml}${CLOSE_BTN_HTML.replace('absolute; top: 12px; right: 12px;', 'relative; top: 0; right: 0;')}</div>` : contentHtml}
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
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // Captura dados de inputs no popup
      const leadData: Record<string, string> = { popup_id: popup.id };
      let hasData = false;

      shadow.querySelectorAll<HTMLInputElement>('input, select, textarea').forEach(input => {
        const name = input.name || input.id;
        if (!name || input.type === 'submit' || input.type === 'button') return;

        const isEmail = name.toLowerCase().includes('email');
        const isPhone = name.toLowerCase().includes('phone') || name.toLowerCase().includes('tel') || name.toLowerCase().includes('whatsapp');
        const isName = name.toLowerCase().includes('name') || name.toLowerCase().includes('first') || name.toLowerCase().includes('last');

        if (isEmail && input.value) { leadData.email = input.value.trim(); hasData = true; }
        else if (isPhone && input.value) { leadData.whatsapp = input.value.trim(); hasData = true; }
        else if (isName && input.value) { leadData.name = input.value.trim(); hasData = true; }
        else if (input.value) { leadData[name] = input.value.trim(); }
      });

      if (hasData && typeof window !== 'undefined' && (window as any).LeadSense?.identify) {
        (window as any).LeadSense.identify(leadData);
      }

      track('popup_cta_click', { popup_id: popup.id });
      track('popup_converted', { popup_id: popup.id });

      executeActions(popup, track, profile);
      scheduleClose();
    });
  });

  track('popup_shown', { popup_id: popup.id, popup_name: popup.name, type });
}

export function closeActivePopup(): void {
  document.getElementById(HOST_ID)?.remove();
}

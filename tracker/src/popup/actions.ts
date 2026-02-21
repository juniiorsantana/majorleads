'use strict';

/**
 * popup/actions.ts
 * Executa as ações configuradas em um popup após interação do usuário.
 */

import { Popup } from '../core/types';

type TrackFn = (event: string, props: Record<string, unknown>) => void;

export function executeActions(popup: Popup, track: TrackFn): void {
    const { actions = [] } = popup.config;

    for (const action of actions) {
        switch (action.type) {
            case 'redirect':
                if (action.value) {
                    track('popup_redirect', { popup_id: popup.id, url: action.value });
                    window.location.href = action.value;
                }
                break;

            case 'open_tab':
                if (action.value) {
                    track('popup_open_tab', { popup_id: popup.id, url: action.value });
                    window.open(action.value, '_blank', 'noopener noreferrer');
                }
                break;

            case 'whatsapp': {
                const phone = action.value.replace(/\D/g, '');
                const url = `https://wa.me/${phone}`;
                track('popup_whatsapp', { popup_id: popup.id, phone });
                window.open(url, '_blank', 'noopener noreferrer');
                break;
            }

            case 'webhook':
                if (action.value) {
                    fetch(action.value, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ popup_id: popup.id, timestamp: Date.now() }),
                        keepalive: true,
                    }).catch(() => { /* silencia — não bloqueia UX */ });
                    track('popup_webhook', { popup_id: popup.id, url: action.value });
                }
                break;

            case 'scroll_to':
                if (action.value) {
                    const el = document.querySelector(action.value);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                break;

            case 'none':
            default:
                break;
        }
    }
}

'use strict';

/**
 * popup/actions.ts
 * Executa as ações configuradas em um popup após interação do usuário.
 */

import { Popup, LeadProfile } from '../core/types';

type TrackFn = (event: string, props: Record<string, unknown>) => void;

export function executeActions(popup: Popup, track: TrackFn, profile?: LeadProfile): void {
    const action = popup.actions_config;
    if (!action) return;

    switch (action.type) {
        case 'redirect':
            if (action.redirect?.url) {
                let finalUrl = action.redirect.url;

                // Add UTMS if configured
                const utms = action.redirect.utms;
                if (utms && (utms.source || utms.medium || utms.campaign)) {
                    const urlObj = new URL(finalUrl, window.location.origin);
                    if (utms.source) urlObj.searchParams.set('utm_source', utms.source);
                    if (utms.medium) urlObj.searchParams.set('utm_medium', utms.medium);
                    if (utms.campaign) urlObj.searchParams.set('utm_campaign', utms.campaign);
                    if (utms.term) urlObj.searchParams.set('utm_term', utms.term);
                    if (utms.content) urlObj.searchParams.set('utm_content', utms.content);
                    finalUrl = urlObj.toString();
                }

                track('popup_redirect', { popup_id: popup.id, url: finalUrl });
                if (action.redirect.openInNewTab) {
                    window.open(finalUrl, '_blank', 'noopener noreferrer');
                } else {
                    window.location.href = finalUrl;
                }
            }
            break;

        case 'whatsapp': {
            if (action.whatsapp?.number) {
                const phone = action.whatsapp.number.replace(/\D/g, '');
                let url = `https://wa.me/${phone}`;
                if (action.whatsapp.message) {
                    url += `?text=${encodeURIComponent(action.whatsapp.message)}`;
                }
                track('popup_whatsapp', { popup_id: popup.id, phone });
                window.open(url, '_blank', 'noopener noreferrer');
            }
            break;
        }

        case 'webhook':
            if (action.webhook?.url) {
                fetch(action.webhook.url, {
                    method: action.webhook.method || 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        popup_id: popup.id,
                        timestamp: Date.now(),
                        lead: profile?.lead || null,
                        visitor_id: profile?.visitor_id || null,
                        session_id: profile?.session_id || null
                    }),
                    keepalive: true,
                }).catch(() => { /* silencia — não bloqueia UX */ });
                track('popup_webhook', { popup_id: popup.id, url: action.webhook.url });
            }
            break;

        case 'success_message':
            // The renderer handles showing the message visually if needed,
            // we just track it here.
            track('popup_success', { popup_id: popup.id });
            break;

        case 'close':
        default:
            break;
    }
}

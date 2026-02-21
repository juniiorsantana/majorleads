'use strict';

/**
 * tracker.js — LeadSense / MajorLeads
 * Entry point principal. Inicializa o SDK e todos os collectors.
 */

import { initIdentity, isOptedOut, setOptOut, clearOptOut, saveProfile } from './identity';
import { collectSession } from './session';
import { fetchConfig, invalidateConfig } from './config';
import { enqueue, flush, setupBeforeUnloadFlush } from './queue';
import { LeadSenseSDK, LeadProfile, LeadSenseEvent, Popup, SessionData } from './types';
import { initScrollCollector } from '../collectors/scroll';
import { initClickCollector } from '../collectors/clicks';
import { initTimeCollector } from '../collectors/time';
import { initExitIntentCollector } from '../collectors/exit-intent';
import { initFormCollector } from '../collectors/forms';
import { initSpaCollector } from '../collectors/spa';
import { shouldShowPopup } from '../popup/rules-engine';
import { canShow, markShown } from '../popup/frequency';
import { renderPopup } from '../popup/renderer';

declare const window: Window & { LeadSense: LeadSenseSDK };

// ─── Estado Global ────────────────────────────────────────────────
let token = '';
let profile: LeadProfile | null = null;
let sessionData: SessionData | null = null;
let onIdentifyCallback: ((lead: LeadProfile['lead']) => void) | null = null;
let isDebug = false;
let activePopups: Popup[] = [];
let scrollDepth = 0;
let getElapsedFn = () => 0;
let popupLocked = false; // evita exibir múltiplos popups ao mesmo tempo

// ─── Utilitários ─────────────────────────────────────────────────
function log(...args: unknown[]): void {
    if (isDebug) console.log('[LeadSense]', ...args);
}

function safe<T>(fn: () => T, context: string): T | undefined {
    try { return fn(); }
    catch (e) { log('Error in', context, e); return undefined; }
}

// ─── Track ───────────────────────────────────────────────────────
function track(event: string, props: Record<string, unknown> = {}): void {
    if (isOptedOut() || !profile) return;

    const lsEvent: LeadSenseEvent = {
        event,
        visitor_id: profile.visitor_id,
        session_id: profile.session_id,
        token,
        timestamp: Date.now(),
        url: location.href,
        path: location.pathname,
        properties: props,
    };

    log('Track:', event, props);
    enqueue(lsEvent);
}

// ─── Avaliação do Popup Engine ────────────────────────────────────
function evaluateTriggers(triggerEvent: Record<string, unknown>): void {
    if (!profile || !sessionData || popupLocked) return;
    if (!activePopups.length) return;

    const ctx = {
        trigger: triggerEvent,
        session: sessionData,
        profile,
        scrollDepth,
        timeOnPage: getElapsedFn(),
    };

    for (const popup of activePopups) {
        const freqRule = popup.config.frequency?.show_once_per || 'session';
        if (!canShow(popup.id, freqRule, profile.session_id)) {
            log('Popup bloqueado por frequência:', popup.name);
            continue;
        }

        if (shouldShowPopup(popup, ctx)) {
            popupLocked = true;
            markShown(popup.id, profile.session_id);
            renderPopup(popup, profile, track, () => {
                setTimeout(() => { popupLocked = false; }, 2000);
            });
            log('Popup exibido:', popup.name);
            break; // exibe apenas um popup por vez
        }
    }
}

// ─── Identify ────────────────────────────────────────────────────
function identify(data: Partial<LeadProfile['lead']> & Record<string, unknown>): void {
    if (!profile) return;
    profile.lead = {
        name: (data.name as string) || profile.lead.name,
        email: (data.email as string) || profile.lead.email,
        whatsapp: (data.whatsapp as string) || profile.lead.whatsapp,
    };
    profile.identified = true;
    saveProfile(profile);
    track('lead_identified', { ...data });
    onIdentifyCallback?.(profile.lead);
}

// ─── SDK Público ──────────────────────────────────────────────────
function buildSDK(): LeadSenseSDK {
    const preQueue = (window.LeadSense?._queue || []) as unknown[];

    const sdk: LeadSenseSDK = {
        _token: token,
        _queue: [],
        _ready: false,
        track,
        identify,
        showPopup: (id: string) => {
            const popup = activePopups.find(p => p.id === id);
            if (popup && profile) {
                renderPopup(popup, profile, track, () => { popupLocked = false; });
            }
        },
        isIdentified: () => profile?.identified ?? false,
        getProfile: () => profile,
        optOut: () => { setOptOut(); flush(); log('Opt-out ativado'); },
        optIn: () => { clearOptOut(); log('Opt-in ativado'); },
        onIdentify: (cb) => { onIdentifyCallback = cb; },
    };

    preQueue.forEach(args => {
        if (Array.isArray(args)) {
            const [method, ...rest] = args as [string, ...unknown[]];
            if (method === 'identify') sdk.identify(rest[0] as Record<string, unknown>);
            else if (method === 'track') sdk.track(rest[0] as string, rest[1] as Record<string, unknown>);
        }
    });

    return sdk;
}

// ─── Init ────────────────────────────────────────────────────────
async function init(): Promise<void> {
    const scriptEl = document.currentScript as HTMLScriptElement | null;
    token = scriptEl?.getAttribute('data-token') || window.LeadSense?._token || '';

    if (!token) {
        console.warn('[LeadSense] Token não encontrado. Adicione data-token ao script.');
        return;
    }

    if (isOptedOut()) { log('Opt-out ativo. Nenhum dado coletado.'); return; }
    if (/bot|crawler|spider|prerender/i.test(navigator.userAgent)) { log('Bot — modo silencioso.'); return; }

    isDebug = new URLSearchParams(location.search).has('ls_debug');
    log('Inicializando... Token:', token.slice(0, 8) + '...');

    const { profile: p } = initIdentity();
    profile = p;

    window.LeadSense = buildSDK();
    window.LeadSense._ready = true;

    // Sessão e page_view
    safe(() => {
        const session = collectSession();
        sessionData = session;
        track('page_view', {
            title: session.title,
            referrer: session.referrer,
            utm_source: session.utm_source,
            utm_medium: session.utm_medium,
            utm_campaign: session.utm_campaign,
            device_type: session.device_type,
            os: session.os,
            browser: session.browser,
        });
        // Trigger page_load para popups
        evaluateTriggers({ type: 'page_view' });
    }, 'collectSession');

    let getMaxScrollFn = () => 0;

    // Scroll — atualiza scrollDepth para o engine
    safe(() => {
        const { cleanup, getMaxScroll } = initScrollCollector((evt, props) => {
            if (evt === 'scroll_depth') scrollDepth = props.depth as number;
            track(evt, props);
            evaluateTriggers({ type: 'scroll_depth', depth: props.depth });
        });
        getMaxScrollFn = getMaxScroll;
        window.addEventListener('beforeunload', cleanup, { once: true });
    }, 'scroll');

    safe(() => initClickCollector(track), 'clicks');

    const { getElapsed } = initTimeCollector((evt, props) => {
        track(evt, props);
        if (evt === 'time_on_page') evaluateTriggers({ type: 'time_on_page', seconds: props.seconds });
        if (evt === 'idle') evaluateTriggers({ type: 'idle' });
    });
    getElapsedFn = getElapsed;

    safe(() => initFormCollector(track), 'forms');
    safe(() => initExitIntentCollector(track, getElapsed, evaluateTriggers), 'exit-intent');
    safe(() => initSpaCollector(track, () => {
        invalidateConfig();
        fetchConfig(token).then(cfg => {
            activePopups = cfg.popups.filter(p => p.status.toLowerCase() === 'active');
            sessionData = collectSession();
            evaluateTriggers({ type: 'page_view' });
        });
    }), 'spa');

    window.addEventListener('beforeunload', () => {
        track('page_leave', {
            time_on_page: getElapsedFn(),
            scroll_percentage: getMaxScrollFn(),
        });
    }, { once: true });

    setupBeforeUnloadFlush();

    // Config de popups
    safe(async () => {
        const cfg = await fetchConfig(token);
        activePopups = cfg.popups.filter(p => p.status.toLowerCase() === 'active');
        log('Config carregada:', activePopups.length, 'popups ativos');
    }, 'fetchConfig');

    log('✅ Tracker pronto. visitor_id:', profile.visitor_id);
}

// ─── Execução ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => safe(() => init(), 'init'));
} else {
    safe(() => init(), 'init');
}

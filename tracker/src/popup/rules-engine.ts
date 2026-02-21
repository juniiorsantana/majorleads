'use strict';

/**
 * popup/rules-engine.ts
 * Avalia triggers e conditions de um popup contra o estado atual da sessão.
 */

import { Popup, PopupTrigger, PopupCondition, SessionData, LeadProfile } from '../core/types';

interface EvalContext {
    trigger: Record<string, unknown>;
    session: SessionData;
    profile: LeadProfile;
    scrollDepth: number;
    timeOnPage: number;
}

// ─── Triggers ────────────────────────────────────────────────────
function evalTrigger(trigger: PopupTrigger, ctx: EvalContext): boolean {
    const { type, value } = trigger;
    const evtType = ctx.trigger.type as string;

    switch (type) {
        case 'exit_intent':
            return evtType === 'exit_intent' || evtType === 'back_button' || evtType === 'tab_hidden';

        case 'time_on_page':
            return ctx.timeOnPage >= (value || 0);

        case 'scroll_depth':
            return ctx.scrollDepth >= (value || 0);

        case 'page_load':
            return evtType === 'page_view';

        case 'idle':
            return evtType === 'idle';

        case 'tab_hidden':
            return evtType === 'tab_hidden';

        default:
            return false;
    }
}

// ─── Conditions ──────────────────────────────────────────────────
function compare(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
        case 'equals': return String(actual) === String(expected);
        case 'not_equals': return String(actual) !== String(expected);
        case 'contains': return String(actual).includes(String(expected));
        case 'not_contains': return !String(actual).includes(String(expected));
        case 'starts_with': return String(actual).startsWith(String(expected));
        case 'gte': return Number(actual) >= Number(expected);
        case 'lte': return Number(actual) <= Number(expected);
        case 'gt': return Number(actual) > Number(expected);
        case 'lt': return Number(actual) < Number(expected);
        case 'is_set': return actual !== null && actual !== undefined && actual !== '';
        case 'is_not_set': return actual === null || actual === undefined || actual === '';
        default: return false;
    }
}

function evalCondition(condition: PopupCondition, ctx: EvalContext): boolean {
    const { type, operator, value } = condition;
    const { session, profile } = ctx;

    switch (type) {
        case 'utm_source': return compare(session.utm_source, operator, value);
        case 'utm_medium': return compare(session.utm_medium, operator, value);
        case 'utm_campaign': return compare(session.utm_campaign, operator, value);

        case 'referrer': return compare(session.referrer_domain, operator, value);
        case 'referrer_domain': return compare(session.referrer_domain, operator, value);

        case 'url': return compare(session.url, operator, value);
        case 'path': return compare(session.path, operator, value);

        case 'device_type': return compare(session.device_type, operator, value);
        case 'browser': return compare(session.browser, operator, value);
        case 'language': return compare(session.language, operator, value);

        case 'session_count': return compare(profile.session_count, operator, value);
        case 'is_returning': return compare(profile.is_returning, operator, value);
        case 'is_identified': return compare(profile.identified, operator, value);

        case 'scroll_depth': return compare(ctx.scrollDepth, operator, value);
        case 'time_on_page': return compare(ctx.timeOnPage, operator, value);

        default: return true; // condição desconhecida = não bloqueia
    }
}

// ─── Evaluator Principal ─────────────────────────────────────────
export function shouldShowPopup(popup: Popup, ctx: EvalContext): boolean {
    const { triggers, conditions } = popup.config;

    // Pelo menos um trigger deve ser satisfeito
    const triggerMet = triggers.length === 0 || triggers.some(t => evalTrigger(t, ctx));
    if (!triggerMet) return false;

    // Todas as conditions devem ser satisfeitas (AND)
    const conditionsMet = conditions.every(c => evalCondition(c, ctx));
    return conditionsMet;
}

'use strict';

/**
 * popup/rules-engine.ts
 * Avalia triggers e conditions de um popup contra o estado atual da sessão.
 */

import { Popup, TriggerConfig, SessionData, LeadProfile } from '../core/types';

interface EvalContext {
    triggerType: string;
    session: SessionData;
    profile: LeadProfile;
    scrollDepth: number;
    timeOnPage: number;
}

// ─── Triggers ────────────────────────────────────────────────────
function evalTriggerType(config: TriggerConfig, ctx: EvalContext): boolean {
    const { type, value } = config;
    const evtType = ctx.triggerType;

    switch (type) {
        case 'exit_intent':
            return evtType === 'exit_intent' || evtType === 'back_button' || evtType === 'tab_hidden';
        case 'time_on_page':
            return ctx.timeOnPage >= (value || 0);
        case 'scroll_depth':
            return ctx.scrollDepth >= (value || 0);
        case 'inactivity':
            return evtType === 'idle';
        default:
            return false;
    }
}

// ─── Conditions Evaluation (Targeting & URL Rules) ───────────────
function evalTargetAudience(config: TriggerConfig, ctx: EvalContext): boolean {
    const { device, visitorType } = config.targetAudience;

    // Check device match
    if (device !== 'all') {
        const isMobile = ctx.session.screen_width < 768; // simple responsive check, could use session.device_type too
        if (device === 'mobile' && !isMobile) return false;
        if (device === 'desktop' && isMobile) return false;
    }

    // Check visitor type match
    if (visitorType !== 'all') {
        const isReturning = ctx.profile.is_returning;
        if (visitorType === 'new' && isReturning) return false;
        if (visitorType === 'returning' && !isReturning) return false;
    }

    return true;
}

function evalUrlRules(config: TriggerConfig, ctx: EvalContext): boolean {
    const { urlRules } = config;
    if (!urlRules || urlRules.length === 0) return true; // Default to allow if no rules

    const currentUrl = ctx.session.url || '';
    const currentPath = ctx.session.path || '';

    // Logic: If there are URL rules, it must satisfy ALL condition blocks (AND logic for now based on previous engine)
    // Wait, typical popup builders use OR logic between URL rules if it's "Show on". We'll treat the array as OR.
    // Meaning: If ANY rule matches, we show it.

    for (const rule of urlRules) {
        let matches = false;
        const target = rule.value.toLowerCase();
        const urlLower = currentUrl.toLowerCase();
        const pathLower = currentPath.toLowerCase();

        switch (rule.condition) {
            case 'equals':
                matches = urlLower === target || pathLower === target || pathLower === `/${target}`;
                break;
            case 'contains':
                matches = urlLower.includes(target);
                break;
            case 'starts_with':
                matches = pathLower.startsWith(target.startsWith('/') ? target : `/${target}`);
                break;
        }

        if (matches) return true;
    }

    // If there were rules but none matched, do not show
    return false;
}

// ─── Evaluator Principal ─────────────────────────────────────────
export function shouldShowPopup(popup: Popup, ctx: EvalContext): boolean {
    const config = popup.trigger_config;

    if (!config) return false;

    // Deve satisfazer o tipo de trigger + valor (ex: scroll 50%)
    if (!evalTriggerType(config, ctx)) return false;

    // Restrições de audiência
    if (!evalTargetAudience(config, ctx)) return false;

    // Regras de URL
    if (!evalUrlRules(config, ctx)) return false;

    return true;
}

import { describe, it, expect } from 'vitest';
import { shouldShowPopup } from '../rules-engine';
import { Popup, SessionData, LeadProfile } from '../../core/types';

describe('Popup Rules Engine', () => {
    const defaultSession: SessionData = {
        title: 'Home',
        referrer: '',
        referrer_domain: '',
        url: 'https://example.com/home',
        path: '/home',
        device_type: 'desktop',
        os: 'macOS',
        browser: 'Chrome',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
        language: 'pt-BR',
        screen_width: 1920,
        screen_height: 1080,
        connection_type: '4g',
    };

    const defaultProfile: LeadProfile = {
        visitor_id: 'v1',
        session_id: 's1',
        is_returning: false,
        session_count: 1,
        first_seen: Date.now().toString(),
        last_seen: Date.now().toString(),
        identified: false,
        lead: { name: '', email: '', whatsapp: '' },
        events: []
    };

    const createCtx = (triggerType: string, overrides?: Record<string, unknown>) => ({
        trigger: { type: triggerType, ...overrides },
        session: defaultSession,
        profile: defaultProfile,
        scrollDepth: 0,
        timeOnPage: 0,
    });

    const createPopup = (triggers: any[] = [], conditions: any[] = []): Popup => ({
        id: 'p1',
        name: 'Test Popup',
        status: 'active',
        config: {
            triggers,
            conditions,
            template: { type: 'modal', position: 'center', animation: 'fade', content: { html: '', css: '' } },
            frequency: { show_once_per: 'session' }
        }
    });

    describe('Triggers', () => {
        it('should show if no triggers are defined', () => {
            const popup = createPopup();
            expect(shouldShowPopup(popup, createCtx('page_view'))).toBe(true);
        });

        it('should trigger on time_on_page', () => {
            const popup = createPopup([{ type: 'time_on_page', value: 30 }]);

            // Not enough time
            expect(shouldShowPopup(popup, { ...createCtx('time_on_page'), timeOnPage: 10 })).toBe(false);

            // Enough time
            expect(shouldShowPopup(popup, { ...createCtx('time_on_page'), timeOnPage: 30 })).toBe(true);
            expect(shouldShowPopup(popup, { ...createCtx('time_on_page'), timeOnPage: 35 })).toBe(true);
        });

        it('should trigger on exit_intent', () => {
            const popup = createPopup([{ type: 'exit_intent' }]);

            expect(shouldShowPopup(popup, createCtx('exit_intent'))).toBe(true);
            expect(shouldShowPopup(popup, createCtx('mouse_move'))).toBe(false);
        });

        it('should trigger on scroll_depth', () => {
            const popup = createPopup([{ type: 'scroll_depth', value: 50 }]);

            expect(shouldShowPopup(popup, { ...createCtx('scroll_depth'), scrollDepth: 25 })).toBe(false);
            expect(shouldShowPopup(popup, { ...createCtx('scroll_depth'), scrollDepth: 50 })).toBe(true);
        });
    });

    describe('Conditions', () => {
        it('should block if utm_source does not match', () => {
            const popup = createPopup([], [{ type: 'utm_source', operator: 'equals', value: 'facebook' }]);

            const ctxFail = createCtx('page_view');
            ctxFail.session = { ...defaultSession, utm_source: 'google' };
            expect(shouldShowPopup(popup, ctxFail)).toBe(false);

            const ctxPass = createCtx('page_view');
            ctxPass.session = { ...defaultSession, utm_source: 'facebook' };
            expect(shouldShowPopup(popup, ctxPass)).toBe(true);
        });

        it('should allow containing URLs', () => {
            const popup = createPopup([], [{ type: 'url', operator: 'contains', value: '/checkout' }]);

            const ctxFail = createCtx('page_view');
            expect(shouldShowPopup(popup, ctxFail)).toBe(false); // /home

            const ctxPass = createCtx('page_view');
            ctxPass.session = { ...defaultSession, url: 'https://example.com/checkout/step-1' };
            expect(shouldShowPopup(popup, ctxPass)).toBe(true);
        });

        it('should evaluate mathematical conditions (gte, lte)', () => {
            const popup = createPopup([], [{ type: 'session_count', operator: 'gte', value: 2 }]);

            const ctxFail = createCtx('page_view');
            ctxFail.profile = { ...defaultProfile, session_count: 1 };
            expect(shouldShowPopup(popup, ctxFail)).toBe(false);

            const ctxPass = createCtx('page_view');
            ctxPass.profile = { ...defaultProfile, session_count: 3 };
            expect(shouldShowPopup(popup, ctxPass)).toBe(true);
        });

        it('should block if any one condition fails (AND logic)', () => {
            const popup = createPopup([], [
                { type: 'device_type', operator: 'equals', value: 'desktop' },
                { type: 'utm_source', operator: 'equals', value: 'tiktok' }
            ]);

            // Only desktop passes
            const ctxPartial = createCtx('page_view');
            ctxPartial.session = { ...defaultSession, device_type: 'desktop', utm_source: 'instagram' };
            expect(shouldShowPopup(popup, ctxPartial)).toBe(false);

            // Both pass
            const ctxPass = createCtx('page_view');
            ctxPass.session = { ...defaultSession, device_type: 'desktop', utm_source: 'tiktok' };
            expect(shouldShowPopup(popup, ctxPass)).toBe(true);
        });
    });
});

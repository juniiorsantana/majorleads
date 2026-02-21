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
    } as any;

    const defaultProfile: LeadProfile = {
        visitor_id: 'v1',
        session_id: 's1',
        is_returning: false,
        session_count: 1,
        first_seen: Date.now().toString(),
        last_seen: Date.now().toString(),
        identified: false,
        lead: { name: '', email: '', whatsapp: '' }
    };

    const createCtx = (triggerType: string, overrides?: Record<string, unknown>) => ({
        triggerType,
        session: { ...defaultSession, ...overrides },
        profile: defaultProfile,
        scrollDepth: 0,
        timeOnPage: 0,
    });

    const createPopup = (configOverrides: any = {}): Popup => ({
        id: 'p1',
        name: 'Test Popup',
        status: 'active',
        type: 'modal',
        layers: [],
        actions_config: { type: 'close' },
        trigger_config: {
            type: 'time_on_page',
            value: 10,
            frequency: 'session',
            targetAudience: { device: 'all', visitorType: 'all' },
            urlRules: [],
            ...configOverrides
        }
    });

    describe('Triggers Type & Value', () => {
        it('should trigger on time_on_page properly', () => {
            const popup = createPopup({ type: 'time_on_page', value: 30 });

            // Not enough time
            expect(shouldShowPopup(popup, { ...createCtx('time_on_page'), timeOnPage: 10 })).toBe(false);

            // Enough time
            expect(shouldShowPopup(popup, { ...createCtx('time_on_page'), timeOnPage: 30 })).toBe(true);
        });

        it('should trigger on exit_intent', () => {
            const popup = createPopup({ type: 'exit_intent' });

            expect(shouldShowPopup(popup, createCtx('exit_intent'))).toBe(true);
            expect(shouldShowPopup(popup, createCtx('mouse_move'))).toBe(false);
        });

        it('should trigger on scroll_depth', () => {
            const popup = createPopup({ type: 'scroll_depth', value: 50 });

            expect(shouldShowPopup(popup, { ...createCtx('scroll_depth'), scrollDepth: 25 })).toBe(false);
            expect(shouldShowPopup(popup, { ...createCtx('scroll_depth'), scrollDepth: 50 })).toBe(true);
        });
    });

    describe('Target Audience', () => {
        it('should block if device does not match', () => {
            const popup = createPopup({ targetAudience: { device: 'mobile', visitorType: 'all' } });

            // Desktop viewport fails
            expect(shouldShowPopup(popup, createCtx('time_on_page', { screen_width: 1920 }))).toBe(false);

            // Mobile viewport passes
            expect(shouldShowPopup(popup, createCtx('time_on_page', { screen_width: 375 }))).toBe(true);
        });

        it('should block if visitor type does not match', () => {
            const popup = createPopup({ targetAudience: { device: 'all', visitorType: 'returning' } });

            const ctxNew = createCtx('time_on_page');
            ctxNew.profile = { ...defaultProfile, is_returning: false };
            expect(shouldShowPopup(popup, ctxNew)).toBe(false);

            const ctxReturning = createCtx('time_on_page');
            ctxReturning.profile = { ...defaultProfile, is_returning: true };
            expect(shouldShowPopup(popup, ctxReturning)).toBe(true);
        });
    });

    describe('URL Rules', () => {
        it('should allow if no rules are defined', () => {
            const popup = createPopup({ urlRules: [] });
            expect(shouldShowPopup(popup, createCtx('time_on_page'))).toBe(true);
        });

        it('should match any rule (OR logic)', () => {
            const popup = createPopup({
                urlRules: [
                    { id: '1', condition: 'contains', value: 'checkout' },
                    { id: '2', condition: 'equals', value: '/pricing' }
                ]
            });

            // Fails all
            expect(shouldShowPopup(popup, createCtx('time_on_page', { url: 'https://site.com/home', path: '/home' }))).toBe(false);

            // Matches first
            expect(shouldShowPopup(popup, createCtx('time_on_page', { url: 'https://site.com/checkout/pay', path: '/checkout/pay' }))).toBe(true);

            // Matches second
            expect(shouldShowPopup(popup, createCtx('time_on_page', { url: 'https://site.com/pricing', path: '/pricing' }))).toBe(true);
        });
    });
});

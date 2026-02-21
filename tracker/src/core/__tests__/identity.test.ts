import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadProfile, isOptedOut, setOptOut, clearOptOut, initIdentity } from '../identity';

describe('Identity Tracking', () => {
    beforeEach(() => {
        // Clear localStorage and document.cookie before each test
        localStorage.clear();
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: '',
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize a new visitor id and session id if none exist', () => {
        const { visitorId, sessionId, profile } = initIdentity();
        expect(visitorId).toBeDefined();
        expect(sessionId).toBeDefined();
        expect(profile.visitor_id).toBe(visitorId);
        expect(profile.session_id).toBe(sessionId);
        expect(profile.session_count).toBe(1);
        expect(profile.is_returning).toBe(false);
    });

    it('should recognize a returning session using visitor id', () => {
        // initialize first time
        const { visitorId, sessionId } = initIdentity();

        // mimic a new session but same visitor
        loadProfile(visitorId, 'new-session-id');

        // next initialization
        const result2 = loadProfile(visitorId, 'new-session-id');

        expect(result2.visitor_id).toBe(visitorId);
        expect(result2.session_id).toBe('new-session-id');
        expect(result2.session_count).toBe(2);
        expect(result2.is_returning).toBe(true);
    });

    it('handle opt-out correctly', () => {
        expect(isOptedOut()).toBe(false);

        setOptOut();
        expect(isOptedOut()).toBe(true);
        expect(localStorage.getItem('_ls_optout')).toBe('1');

        clearOptOut();
        expect(isOptedOut()).toBe(false);
        expect(localStorage.getItem('_ls_optout')).toBeNull();
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canShow, markShown, getShowCount } from '../frequency';

describe('Popup Frequency Control', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should always allow if rule is always', () => {
        expect(canShow('p1', 'always', 's1')).toBe(true);
        markShown('p1', 's1');
        expect(canShow('p1', 'always', 's1')).toBe(true);
    });

    it('should block if shown in the same session', () => {
        expect(canShow('p1', 'session', 's1')).toBe(true);
        markShown('p1', 's1');

        // Same session
        expect(canShow('p1', 'session', 's1')).toBe(false);
        // Different session
        expect(canShow('p1', 'session', 's2')).toBe(true);
    });

    it('should block if shown in the same day (day rule)', () => {
        expect(canShow('p1', 'day', 's1')).toBe(true);
        markShown('p1', 's1');

        // Blocked immediately after
        expect(canShow('p1', 'day', 's1')).toBe(false);

        // Still blocked after 12 hours
        vi.advanceTimersByTime(12 * 60 * 60 * 1000);
        expect(canShow('p1', 'day', 's1')).toBe(false);

        // Allowed after 24h+
        vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1);
        expect(canShow('p1', 'day', 's1')).toBe(true);
    });

    it('should block if shown in the same week (week rule)', () => {
        expect(canShow('p1', 'week', 's1')).toBe(true);
        markShown('p1', 's1');

        // Blocked after 6 days
        vi.advanceTimersByTime(6 * 24 * 60 * 60 * 1000);
        expect(canShow('p1', 'week', 's1')).toBe(false);

        // Allowed after 7 days
        vi.advanceTimersByTime(1 * 24 * 60 * 60 * 1000 + 1);
        expect(canShow('p1', 'week', 's1')).toBe(true);
    });

    it('should correctly increment show count', () => {
        expect(getShowCount('p1')).toBe(0);
        markShown('p1', 's1');
        expect(getShowCount('p1')).toBe(1);

        vi.advanceTimersByTime(100);
        markShown('p1', 's2');
        expect(getShowCount('p1')).toBe(2);
    });
});

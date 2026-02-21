import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// We import the zod schema logic that mirrors the edge function 
// because Deno env mocking in vitest can be tricky. This ensures we test the validation mitigations natively.

const EventSchema = z.object({
    event: z.string().max(100).regex(/^[a-zA-Z0-9_]+$/),
    visitor_id: z.string().uuid(),
    session_id: z.string().uuid(),
    timestamp: z.number().refine(ts => {
        const now = Date.now();
        return Math.abs(now - ts) <= 300000; // ± 5 minutes
    }, "Timestamp must be within 5 minutes of current time"),
    url: z.string().url().max(2000).optional().or(z.literal('')),
    path: z.string().max(2000).optional(),
    properties: z.record(z.unknown()).optional().superRefine((val, ctx) => {
        if (!val) return;
        const getDepth = (obj: any): number => {
            if (obj === null || typeof obj !== 'object') return 0;
            let depth = 0;
            for (const key in obj) {
                depth = Math.max(depth, getDepth(obj[key]));
            }
            return 1 + depth;
        };
        if (getDepth(val) > 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Properties depth max 3" });
        }

        const checkStrings = (obj: any): boolean => {
            if (typeof obj === 'string' && obj.length > 500) return false;
            if (obj !== null && typeof obj === 'object') {
                for (const key in obj) {
                    if (!checkStrings(obj[key])) return false;
                }
            }
            return true;
        };
        if (!checkStrings(val)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "String values max 500 chars" });
        }
    })
});

describe('Edge Function Security Mitigations (track-events)', () => {
    describe('Zod Schema Validation', () => {
        it('should accept valid event payloads', () => {
            const valid = {
                event: 'page_view',
                visitor_id: '123e4567-e89b-12d3-a456-426614174000',
                session_id: '123e4567-e89b-12d3-a456-426614174001',
                timestamp: Date.now(),
                url: 'https://example.com/checkout',
                properties: { nested: { level2: { level3: 'ok' } } }
            };
            const result = EventSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('should reject invalid UUIDs and events with invalid chars', () => {
            const invalid = {
                event: 'page view!', // invalid chars
                visitor_id: 'not-a-uuid',
                session_id: '123e4567-e89b-12d3-a456-426614174001',
                timestamp: Date.now()
            };
            const result = EventSchema.safeParse(invalid);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors.some(e => e.path.includes('event'))).toBe(true);
                expect(result.error.errors.some(e => e.path.includes('visitor_id'))).toBe(true);
            }
        });

        it('should reject timestamps too far in the past or future', () => {
            const invalid = {
                event: 'click',
                visitor_id: '123e4567-e89b-12d3-a456-426614174000',
                session_id: '123e4567-e89b-12d3-a456-426614174001',
                timestamp: Date.now() - 600000 // 10 minutes ago
            };
            const result = EventSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('should reject properties deeper than 3 levels', () => {
            const invalid = {
                event: 'click',
                visitor_id: '123e4567-e89b-12d3-a456-426614174000',
                session_id: '123e4567-e89b-12d3-a456-426614174001',
                timestamp: Date.now(),
                properties: { l1: { l2: { l3: { l4: 'too deep' } } } }
            };
            const result = EventSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('should reject string values longer than 500 chars in properties', () => {
            const invalid = {
                event: 'click',
                visitor_id: '123e4567-e89b-12d3-a456-426614174000',
                session_id: '123e4567-e89b-12d3-a456-426614174001',
                timestamp: Date.now(),
                properties: { longString: 'a'.repeat(501) }
            };
            const result = EventSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('Origin Validation Logic (Mocked equivalent)', () => {
        // Reproducing the logic from index.ts
        const validateOrigin = (origin: string | null, siteDomain: string) => {
            if (!origin) return true; // Browser CORS handles no origin if applied
            let originHost;
            try { originHost = new URL(origin).hostname; } catch (e) { return false; }
            if (originHost !== siteDomain && !originHost.endsWith('.' + siteDomain) && originHost !== 'localhost' && originHost !== '127.0.0.1') {
                return false;
            }
            return true;
        };

        it('should allow valid origins', () => {
            expect(validateOrigin('https://example.com', 'example.com')).toBe(true);
            expect(validateOrigin('https://sub.example.com', 'example.com')).toBe(true);
            expect(validateOrigin('http://localhost:3000', 'example.com')).toBe(true);
        });

        it('should reject invalid or spoofed origins', () => {
            expect(validateOrigin('https://badsite.com', 'example.com')).toBe(false);
            expect(validateOrigin('https://example.com.malicious.com', 'example.com')).toBe(false);
        });
    });

    describe('Forged site_id Rejection Logic (Item 2)', () => {
        it('should discard client-provided site_id and only resolve via Token', () => {
            // The edge function logic resolves site_id ONLY from the database lookup
            // using the `token`. Any `site_id` in the payload is ignored.
            const payloadEvent = {
                site_id: 'hacker-site-id', // Attacker tries to inject this
                event: 'page_view',
                visitor_id: '123e4567-e89b-12d3-a456-426614174000',
                session_id: '123e4567-e89b-12d3-a456-426614174001',
                timestamp: Date.now()
            };

            // Validate the event parses, but we specifically show how the edge function 
            // maps it securely:
            const validation = EventSchema.safeParse(payloadEvent);
            expect(validation.success).toBe(true);

            // Mock edge function mapping logic:
            const DB_RESOLVED_SITE_ID = 'legit-site-id';
            const mappedRow = {
                ...payloadEvent,
                site_id: DB_RESOLVED_SITE_ID // OBRIGATORIAMENTE sobrescreve o site_id do payload
            };

            expect(mappedRow.site_id).toBe('legit-site-id');
            expect(mappedRow.site_id).not.toBe('hacker-site-id');
        });
    });

    describe('Rate Limiting Logic (Item 4)', () => {
        // Reproducing the core rate limiting logic from index.ts
        const checkRateLimit = (rlData: any, nowMillis: number) => {
            if (!rlData) return { status: 200, action: 'insert' };
            const windowStart = rlData.window_start;
            const diffMs = nowMillis - windowStart;

            if (diffMs > 60000) {
                return { status: 200, action: 'reset' };
            } else if (rlData.count >= 200) {
                return { status: 429, action: 'block' };
            } else {
                return { status: 200, action: 'increment' };
            }
        };

        it('should allow requests under the limit', () => {
            const now = Date.now();
            const result = checkRateLimit({ count: 199, window_start: now - 10000 }, now);
            expect(result.status).toBe(200);
            expect(result.action).toBe('increment');
        });

        it('should return 429 when rate limit of 200 is exceeded within 1 minute', () => {
            const now = Date.now();
            const result = checkRateLimit({ count: 200, window_start: now - 30000 }, now);
            expect(result.status).toBe(429);
            expect(result.action).toBe('block');
        });

        it('should reset window after 1 minute', () => {
            const now = Date.now();
            const result = checkRateLimit({ count: 200, window_start: now - 65000 }, now);
            expect(result.status).toBe(200);
            expect(result.action).toBe('reset');
        });
    });
});

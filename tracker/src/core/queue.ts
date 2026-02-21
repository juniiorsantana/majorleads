'use strict';

import { LeadSenseEvent } from './types';

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;
const BASE_URL = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1';

let queue: LeadSenseEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function enqueue(event: LeadSenseEvent): void {
    queue.push(event);
    if (queue.length >= BATCH_SIZE) {
        flush(); // envia imediatamente
    } else if (!flushTimer) {
        flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
    }
}

export function flush(): void {
    if (!queue.length) return;

    const batch = queue.splice(0, queue.length);

    clearTimer();

    // Usa Beacon API primeiro (funciona mesmo no beforeunload)
    if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(
            `${BASE_URL}/track-events`,
            JSON.stringify({ events: batch })
        );
        if (success) return;
    }

    // Fallback: fetch com retry
    sendWithRetry(batch);
}

async function sendWithRetry(events: LeadSenseEvent[], attempt = 0): Promise<void> {
    const MAX_ATTEMPTS = 3;
    const backoff = [1000, 2000, 4000];

    try {
        await fetch(`${BASE_URL}/track-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
            keepalive: true,
        });
    } catch {
        if (attempt < MAX_ATTEMPTS - 1) {
            setTimeout(() => sendWithRetry(events, attempt + 1), backoff[attempt]);
        }
        // Após 3 tentativas, descarta para não travar UX
    }
}

function clearTimer(): void {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
}

export function setupBeforeUnloadFlush(): void {
    window.addEventListener('beforeunload', () => flush(), { once: true });
}

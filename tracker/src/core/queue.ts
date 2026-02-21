'use strict';

import { LeadSenseEvent } from './types';

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;
const BASE_URL = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheHF1bWVwamZiZmF4a2xla3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTM1MDIsImV4cCI6MjA4NzA4OTUwMn0.GxpK2m9OGYxGOZZOLDOT6DIqoyGSHRRVqPjnGxQTRm4';

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

    // fetch com keepalive garante envio mesmo no beforeunload (sem CORS issues do sendBeacon)
    sendWithRetry(batch);
}

async function sendWithRetry(events: LeadSenseEvent[], attempt = 0): Promise<void> {
    const MAX_ATTEMPTS = 3;
    const backoff = [1000, 2000, 4000];

    try {
        await fetch(`${BASE_URL}/track-events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
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

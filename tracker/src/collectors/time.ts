'use strict';

/**
 * collector: time.ts
 * Rastreia time_on_page (15, 30, 60, 120, 300s) e idle (30s sem interação).
 */

type TrackFn = (event: string, props: Record<string, unknown>) => void;

const TIME_THRESHOLDS = [15, 30, 60, 120, 300]; // segundos
const IDLE_THRESHOLD = 30_000; // 30 segundos sem interação

export function initTimeCollector(track: TrackFn): { getElapsed: () => number } {
    const startTime = Date.now();
    const fired = new Set<number>();
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleFired = false;

    // ── Time on Page ────────────────────────────────────
    const timerId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        for (const threshold of TIME_THRESHOLDS) {
            if (elapsed >= threshold && !fired.has(threshold)) {
                fired.add(threshold);
                track('time_on_page', { seconds: threshold });
            }
        }
    }, 5000); // verifica a cada 5s

    // ── Idle Detection ───────────────────────────────────
    function resetIdle(): void {
        idleFired = false;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (!idleFired) {
                idleFired = true;
                track('idle', { idle_seconds: 30 });
            }
        }, IDLE_THRESHOLD);
    }

    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, resetIdle, { passive: true })
    );

    resetIdle(); // inicializa timer ao carregar

    return {
        getElapsed: () => Math.floor((Date.now() - startTime) / 1000),
    };
}

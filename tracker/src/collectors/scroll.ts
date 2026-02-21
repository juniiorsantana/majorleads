'use strict';

/**
 * collector: scroll.ts
 * Rastreia scroll_depth em thresholds: 25, 50, 75, 90, 100%
 * Usa rAF para evitar layout thrashing.
 */

type TrackFn = (event: string, props: Record<string, unknown>) => void;

const THRESHOLDS = [25, 50, 75, 90, 100];

export function initScrollCollector(track: TrackFn): { cleanup: () => void, getMaxScroll: () => number } {
    let maxScroll = 0;
    const fired = new Set<number>();
    let ticking = false;

    function getScrollPercent(): number {
        const scrolled = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        if (height <= 0) return 100;
        return Math.min(Math.round((scrolled / height) * 100), 100);
    }

    function onScroll(): void {
        if (!ticking) {
            requestAnimationFrame(() => {
                const pct = getScrollPercent();
                if (pct > maxScroll) maxScroll = pct;

                for (const threshold of THRESHOLDS) {
                    if (pct >= threshold && !fired.has(threshold)) {
                        fired.add(threshold);
                        track('scroll_depth', { depth: threshold });
                    }
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Retorna função de cleanup e getter do maxScroll
    return {
        cleanup: () => window.removeEventListener('scroll', onScroll),
        getMaxScroll: () => maxScroll,
    };
}

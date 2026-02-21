'use strict';

/**
 * collector: exit-intent.ts
 * Desktop: detecta cursor saindo pelo topo (mouseleave)
 * Mobile: detecta visibilitychange e scroll rápido para cima
 */

type TrackFn = (event: string, props: Record<string, unknown>) => void;
type ContextFn = () => Record<string, unknown>;

const MIN_TIME_BEFORE_EXIT = 5; // segundos mínimos antes de disparar

export function initExitIntentCollector(
    track: TrackFn,
    getElapsed: () => number,
    evaluateTriggers: (event: Record<string, unknown>) => void
): void {
    let exitFired = false;

    // ── Desktop: cursor sai pelo topo ─────────────────────
    document.addEventListener('mouseleave', (e: MouseEvent) => {
        if (exitFired) return;
        if (e.clientY > 0) return; // só pelo topo
        if (e.relatedTarget !== null) return;
        if (getElapsed() < MIN_TIME_BEFORE_EXIT) return;

        exitFired = true;
        track('exit_intent', {
            scroll_at_exit: getScrollPercent(),
            time_on_page: getElapsed(),
        });
        evaluateTriggers({ type: 'exit_intent' });
    });

    // ── Mobile: tab oculta (minimizar / trocar de aba) ────
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            track('tab_hidden', { visible_for_seconds: getElapsed() });
            evaluateTriggers({ type: 'tab_hidden' });
        } else {
            track('tab_visible', {});
        }
    });

    // ── Mobile: scroll rápido para cima ─────────────────
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const delta = lastScrollY - window.scrollY;
        if (delta > 80 && !exitFired) {
            evaluateTriggers({ type: 'scroll_up_fast' });
        }
        lastScrollY = window.scrollY;
    }, { passive: true });

    // ── Back Button intercept ─────────────────────────────
    history.pushState({ _ls_sentinel: true }, '', location.href);
    window.addEventListener('popstate', (e) => {
        if (e.state?._ls_sentinel) {
            track('back_button', { from_url: location.href });
            evaluateTriggers({ type: 'back_button' });
            history.pushState({ _ls_sentinel: true }, '', location.href);
        }
    });
}

function getScrollPercent(): number {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return 100;
    return Math.min(Math.round((window.scrollY / h) * 100), 100);
}

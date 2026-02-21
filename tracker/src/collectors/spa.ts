'use strict';

/**
 * collector: spa.ts
 * Detecta navegação em SPAs (React, Vue, Next.js, Nuxt)
 * via interceptação da History API e evento popstate.
 */

type TrackFn = (event: string, props: Record<string, unknown>) => void;
type RefreshFn = () => void;

export function initSpaCollector(track: TrackFn, onRouteChange: RefreshFn): void {
    let currentPath = location.pathname;

    function handleRouteChange(newUrl: string): void {
        const newPath = new URL(newUrl, location.origin).pathname;
        if (newPath === currentPath) return;

        const from = currentPath;
        currentPath = newPath;

        track('spa_navigation', { from_path: from, to_path: newPath });
        track('page_view', { url: newUrl, title: document.title });

        onRouteChange(); // re-avalia popups para nova rota
    }

    // Intercepta pushState
    const originalPush = history.pushState.bind(history);
    history.pushState = function (...args) {
        originalPush(...args);
        handleRouteChange(location.href);
    };

    // Intercepta replaceState (alguns frameworks usam isso)
    const originalReplace = history.replaceState.bind(history);
    history.replaceState = function (...args) {
        originalReplace(...args);
        handleRouteChange(location.href);
    };

    // Botão voltar/avançar do browser
    window.addEventListener('popstate', () => {
        handleRouteChange(location.href);
    });
}

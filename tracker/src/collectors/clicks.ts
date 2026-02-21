'use strict';

/**
 * collector: clicks.ts
 * Rastreia cliques em elementos relevantes (botões, links, CTAs).
 */

type TrackFn = (event: string, props: Record<string, unknown>) => void;

function getSelector(el: Element): string {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
        return `${el.tagName.toLowerCase()}.${cls}`;
    }
    return el.tagName.toLowerCase();
}

function getTextContent(el: Element): string {
    return (el.textContent || '').trim().slice(0, 100);
}

export function initClickCollector(track: TrackFn): () => void {
    function onDocumentClick(e: MouseEvent): void {
        const target = (e.target as Element).closest('a, button, [role="button"], input[type="submit"]');
        if (!target) return;

        const tag = target.tagName.toUpperCase();
        const href = tag === 'A' ? (target as HTMLAnchorElement).href : undefined;
        const text = getTextContent(target);
        const selector = getSelector(target);
        const classes = Array.from(target.classList).slice(0, 5);

        track('click', {
            tag,
            text,
            href: href || null,
            selector,
            classes,
        });
    }

    document.addEventListener('click', onDocumentClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onDocumentClick, { capture: true });
}

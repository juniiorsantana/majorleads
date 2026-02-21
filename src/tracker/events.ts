
// src/tracker/events.ts
import tracker from './core';

export function setupEventListeners() {
    // Click tracking
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
            tracker.track('click', {
                tagName: target.tagName,
                id: target.id,
                className: target.className,
                text: target.innerText?.substring(0, 50),
                href: (target as HTMLAnchorElement).href
            });
        }
    }, true);

    // Scroll depth (simplified)
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const percent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        if (percent > maxScroll && percent % 25 === 0) {
            maxScroll = percent;
            tracker.track('scroll_depth', { depth: maxScroll });
        }
    }, { passive: true });
}

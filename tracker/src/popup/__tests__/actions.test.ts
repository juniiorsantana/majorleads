import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeActions } from '../actions';
import { Popup } from '../../core/types';

describe('Popup Actions', () => {
    let trackMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        trackMock = vi.fn();
        // Mock window methods
        vi.spyOn(window, 'open').mockImplementation(() => null);

        // Mock location
        Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost/' },
            writable: true
        });

        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createPopupWithAction = (actionType: string, actionValue: string): Popup => ({
        id: 'p1',
        name: 'Action Test',
        status: 'active',
        config: {
            triggers: [],
            conditions: [],
            frequency: { show_once_per: 'always' },
            actions: [{ type: actionType, value: actionValue }],
            template: { type: 'modal', position: 'center', animation: 'fade', content: { html: '', css: '' } }
        }
    });


    it('should handle redirect action', () => {
        const popup = createPopupWithAction('redirect', '/thanks');
        executeActions(popup, trackMock);

        expect(trackMock).toHaveBeenCalledWith('popup_redirect', { popup_id: 'p1', url: '/thanks' });
        expect(window.location.href).toBe('/thanks');
    });

    it('should handle open_tab action', () => {
        const popup = createPopupWithAction('open_tab', 'https://example.com');
        executeActions(popup, trackMock);

        expect(trackMock).toHaveBeenCalledWith('popup_open_tab', { popup_id: 'p1', url: 'https://example.com' });
        expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener noreferrer');
    });

    it('should handle whatsapp action (formatting number)', () => {
        const popup = createPopupWithAction('whatsapp', '+55 (11) 99999-9999');
        executeActions(popup, trackMock);

        expect(trackMock).toHaveBeenCalledWith('popup_whatsapp', { popup_id: 'p1', phone: '5511999999999' });
        expect(window.open).toHaveBeenCalledWith('https://wa.me/5511999999999', '_blank', 'noopener noreferrer');
    });

    it('should handle webhook action', () => {
        const popup = createPopupWithAction('webhook', 'https://hook.site/api');
        executeActions(popup, trackMock);

        expect(trackMock).toHaveBeenCalledWith('popup_webhook', { popup_id: 'p1', url: 'https://hook.site/api' });
        expect(global.fetch).toHaveBeenCalledWith('https://hook.site/api', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"popup_id":"p1"')
        }));
    });

    it('should handle scroll_to action', () => {
        document.body.innerHTML = '<div id="target">Target</div>';
        const target = document.getElementById('target');

        target!.scrollIntoView = vi.fn();

        const popup = createPopupWithAction('scroll_to', '#target');
        executeActions(popup, trackMock);

        expect(target!.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });
});

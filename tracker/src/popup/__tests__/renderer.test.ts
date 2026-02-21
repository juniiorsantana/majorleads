import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderPopup, closeActivePopup } from '../renderer';
import { Popup, LeadProfile } from '../../core/types';

describe('Popup DOM Renderer', () => {
    let trackMock: ReturnType<typeof vi.fn>;
    let closeMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '';

        // Mock remove for older JSDOM versions or when it gets detached weirdly
        const originalRemove = Element.prototype.remove;
        Element.prototype.remove = function () {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            } else {
                originalRemove.call(this);
            }
        };

        trackMock = vi.fn();
        closeMock = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockProfile: LeadProfile = {
        visitor_id: 'v1',
        session_id: 's1',
        is_returning: false,
        session_count: 5,
        first_seen: Date.now().toString(),
        last_seen: Date.now().toString(),
        identified: true,
        lead: {
            name: 'John Doe Silva',
            email: 'john@example.com',
            whatsapp: ''
        }
    };

    const mockPopup: Popup = {
        id: 'popup_123',
        name: 'Test Modal',
        status: 'active',
        config: {
            triggers: [],
            conditions: [],
            actions: [],
            frequency: { show_once_per: 'always' },
            template: {
                type: 'modal',
                position: 'center',
                animation: 'fade',
                content: {
                    html: `
                        <div class="content">
                            <h1>Hello {{ first_name }}!</h1>
                            <p>Email: {{email}}</p>
                            <p>Visits: {{ session_count }}</p>
                            <button data-ls-action="submit">Claim Offer</button>
                        </div>
                    `,
                    css: '.content { color: red; }'
                }
            },
        }
    };

    it('should inject popup into Shadow DOM', () => {
        renderPopup(mockPopup, mockProfile, trackMock, closeMock);

        const host = document.getElementById('__ls_popup_host__');
        expect(host).toBeTruthy();

        const shadow = host?.shadowRoot;
        expect(shadow).toBeTruthy();

        // Check CSS
        const style = shadow?.querySelector('style');
        expect(style?.textContent).toContain('.content { color: red; }');
        expect(style?.textContent).toContain('@keyframes ls-fade-in');

        // Check HTML content
        const inner = shadow?.querySelector('.__ls-popup-inner');
        expect(inner).toBeTruthy();
    });

    it('should interpolate template variables correctly', () => {
        renderPopup(mockPopup, mockProfile, trackMock, closeMock);

        const shadow = document.getElementById('__ls_popup_host__')?.shadowRoot;
        const html = shadow?.innerHTML || '';

        expect(html).toContain('Hello John!'); // {{ first_name }}
        expect(html).toContain('Email: john@example.com'); // {{email}}
        expect(html).toContain('Visits: 5'); // {{ session_count }}
    });

    it('should sanitize HTML and remove malicious tags and attributes (XSS protection)', () => {
        const maliciousPopup: Popup = {
            ...mockPopup,
            config: {
                ...mockPopup.config,
                template: {
                    ...mockPopup.config.template,
                    content: {
                        html: `
                            <div class="content">
                                <h1 onmouseover="alert(1)">Hello</h1>
                                <script>alert('xss')</script>
                                <img src="x" onerror="stealCookie()">
                                <a href="javascript:alert('xss')">Click Me</a>
                            </div>
                        `,
                        css: ''
                    }
                }
            }
        };

        renderPopup(maliciousPopup, mockProfile, trackMock, closeMock);

        const shadow = document.getElementById('__ls_popup_host__')?.shadowRoot;
        const html = shadow?.innerHTML || '';

        // Should not contain the script tag
        expect(html).not.toContain('<script>');
        expect(html).not.toContain("alert('xss')");

        // Should have removed onerror and onmouseover attributes
        expect(html).not.toContain('onmouseover');
        expect(html).not.toContain('onerror');

        // Should have removed javascript: pseudo-protocols
        expect(html).not.toContain('javascript:alert');
    });

    it('should track popup_shown event when rendered', () => {
        renderPopup(mockPopup, mockProfile, trackMock, closeMock);

        expect(trackMock).toHaveBeenCalledWith('popup_shown', {
            popup_id: 'popup_123',
            popup_name: 'Test Modal',
            type: 'modal'
        });
    });

    it('should close popup via overlay click and track popup_closed', () => {
        renderPopup(mockPopup, mockProfile, trackMock, closeMock);

        const shadow = document.getElementById('__ls_popup_host__')?.shadowRoot;
        const overlay = shadow?.querySelector('[data-ls-close-overlay]') as HTMLElement;

        expect(overlay).toBeTruthy();
        overlay.click();

        expect(trackMock).toHaveBeenCalledWith('popup_closed', expect.objectContaining({ popup_id: 'popup_123' }));
        expect(closeMock).toHaveBeenCalled();
        expect(document.getElementById('__ls_popup_host__')).toBeNull(); // ensures node was removed
    });


    it('should close popup via close button click', () => {
        renderPopup(mockPopup, mockProfile, trackMock, closeMock);

        const shadow = document.getElementById('__ls_popup_host__')?.shadowRoot;
        const closeBtn = shadow?.querySelector('[data-ls-close]') as HTMLButtonElement;

        expect(closeBtn).toBeTruthy();
        closeBtn.click();

        expect(document.getElementById('__ls_popup_host__')).toBeNull();
    });

    it('should trigger actions when submit CTA is clicked', () => {
        const popupWithAction: Popup = {
            ...mockPopup,
            config: {
                ...mockPopup.config,
                actions: [{ type: 'webhook', value: 'https://example.com/hook' }]
            }
        };

        // Mock fetch to prevent actual network request
        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        renderPopup(popupWithAction, mockProfile, trackMock, closeMock);

        const shadow = document.getElementById('__ls_popup_host__')?.shadowRoot;
        const submitBtn = shadow?.querySelector('[data-ls-action="submit"]') as HTMLButtonElement;

        expect(submitBtn).toBeTruthy();
        submitBtn.click();

        expect(trackMock).toHaveBeenCalledWith('popup_cta_click', { popup_id: 'popup_123' });
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/hook', expect.any(Object));

        // Modal should close after submit
        expect(document.getElementById('__ls_popup_host__')).toBeNull();
    });
});

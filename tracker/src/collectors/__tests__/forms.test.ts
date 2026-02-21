import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initFormCollector } from '../forms';

describe('Forms Collector (Allowlist)', () => {
    let trackMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        document.body.innerHTML = `
            <form id="test-form" action="/submit">
                <input type="text" name="first_name" value="John" />
                <input type="email" id="user-email" value="john@example.com" />
                <input type="tel" autocomplete="tel" value="5511999999999" />
                <input type="password" name="pwd" value="secret" />
                <input type="hidden" name="csrf" value="123" />
                <input type="text" name="credit_card_pan" value="4111222233334444" />
                <input type="text" name="notes" value="Some notes" />
                <input type="text" name="whatsapp_number" value="5511888888888" data-ls-ignore />
                <button type="submit">Send</button>
            </form>
        `;
        trackMock = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('should only capture allowlisted fields and ignore PII/blocked/ignored fields on blur', () => {
        initFormCollector(trackMock);

        const form = document.getElementById('test-form') as HTMLFormElement;

        // Blur first name (Allowed: first -> name)
        const nameInput = form.querySelector('[name="first_name"]') as HTMLInputElement;
        nameInput.dispatchEvent(new Event('blur'));

        expect(trackMock).toHaveBeenCalledWith('form_field_blur', expect.objectContaining({
            field_name: 'first_name',
            field_type: 'name'
        }));

        // Blur email (Allowed: email -> email)
        const emailInput = form.querySelector('[id="user-email"]') as HTMLInputElement;
        emailInput.dispatchEvent(new Event('blur'));

        expect(trackMock).toHaveBeenCalledWith('form_field_blur', expect.objectContaining({
            field_name: 'user-email',
            field_type: 'email'
        }));

        // Blur password (Ignored by type)
        const pwdInput = form.querySelector('[name="pwd"]') as HTMLInputElement;
        pwdInput.dispatchEvent(new Event('blur'));

        expect(trackMock).not.toHaveBeenCalledWith('form_field_blur', expect.objectContaining({
            field_name: 'pwd'
        }));

        // Blur credit card (Blocked by name match 'card' or 'pan')
        const ccInput = form.querySelector('[name="credit_card_pan"]') as HTMLInputElement;
        ccInput.dispatchEvent(new Event('blur'));

        expect(trackMock).not.toHaveBeenCalledWith('form_field_blur', expect.objectContaining({
            field_name: 'credit_card_pan'
        }));

        // Blur data-ls-ignore field
        const ignoreInput = form.querySelector('[name="whatsapp_number"]') as HTMLInputElement;
        ignoreInput.dispatchEvent(new Event('blur'));

        expect(trackMock).not.toHaveBeenCalledWith('form_field_blur', expect.objectContaining({
            field_name: 'whatsapp_number'
        }));
    });
});

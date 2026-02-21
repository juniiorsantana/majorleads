'use strict';

/**
 * collector: forms.ts
 * Detecta formulários automaticamente (incluindo dinâmicos via MutationObserver)
 * Captura campos por heurística de nome/id/placeholder sem armazenar valores PII.
 */

type TrackFn = (event: string, props: Record<string, unknown>) => void;

const ALLOWED_MATCHERS = ['name', 'email', 'tel', 'phone', 'whatsapp', 'first', 'last', 'fname', 'lname'];
const BLOCKED_MATCHERS = ['card', 'cvv', 'cc', 'cpf', 'ssn', 'pan'];
const IGNORED_TYPES = new Set(['password', 'hidden', 'submit', 'button', 'file', 'image', 'reset']);

function detectFieldType(input: HTMLInputElement): string | null {
    if (input.hasAttribute('data-ls-ignore') || IGNORED_TYPES.has(input.type)) return null;

    const attrs = [
        input.name,
        input.id,
        input.autocomplete
    ].filter(Boolean).map(v => v!.toLowerCase());

    // 1. Blocklist for highly sensitive data
    for (const attr of attrs) {
        for (const block of BLOCKED_MATCHERS) {
            if (attr.includes(block)) return null;
        }
    }

    // 2. Allowlist for tracking
    for (const attr of attrs) {
        for (const allowed of ALLOWED_MATCHERS) {
            if (attr.includes(allowed)) {
                return allowed === 'email' ? 'email'
                    : (allowed === 'tel' || allowed === 'phone' || allowed === 'whatsapp') ? 'whatsapp'
                        : 'name';
            }
        }
    }

    return null;
}

function getFormId(form: HTMLFormElement): string {
    return form.id || form.getAttribute('name') || form.action?.split('/').pop() || 'unknown';
}

function attachFormListener(form: HTMLFormElement, track: TrackFn): void {
    if ((form as HTMLFormElement & { _lsAttached?: boolean })._lsAttached) return;
    (form as HTMLFormElement & { _lsAttached?: boolean })._lsAttached = true;

    const formId = getFormId(form);
    const capturedTypes = new Set<string>();
    let started = false;

    // ── Blur em cada campo (captura parcial) ────────────
    form.addEventListener('focusin', (e) => {
        const input = e.target as HTMLInputElement;
        if (IGNORED_TYPES.has(input.type) || input.hasAttribute('data-ls-ignore')) return;
        if (!detectFieldType(input)) return;

        if (!started) {
            started = true;
            track('form_start', {
                form_id: formId,
                form_action: form.action,
                field_name: input.name || input.id,
            });
        }
    });

    form.addEventListener('blur', (e) => {
        const input = e.target as HTMLInputElement;
        if (IGNORED_TYPES.has(input.type) || input.hasAttribute('data-ls-ignore')) return;

        const fieldType = detectFieldType(input);
        if (!fieldType) return;

        track('form_field_blur', {
            form_id: formId,
            field_name: input.name || input.id,
            field_type: fieldType,
            has_value: !!input.value,
        });

        capturedTypes.add(fieldType);
    }, true);

    // ── Submit (captura completa) ────────────────────────
    form.addEventListener('submit', () => {
        const leadData: Record<string, string> = {};

        // Varredura final para campos preenchidos antes do submit
        form.querySelectorAll<HTMLInputElement>('input, select, textarea').forEach(input => {
            if (IGNORED_TYPES.has(input.type) || input.hasAttribute('data-ls-ignore') || !input.value) return;
            const fieldType = detectFieldType(input);
            if (fieldType) {
                capturedTypes.add(fieldType);
                if (['name', 'email', 'whatsapp', 'company'].includes(fieldType)) {
                    leadData[fieldType] = input.value.trim();
                }
            }
        });

        track('form_submit', {
            form_id: formId,
            form_action: form.action,
            captured_fields: Array.from(capturedTypes),
        });

        if (Object.keys(leadData).length > 0) {
            if (typeof window !== 'undefined' && (window as any).LeadSense?.identify) {
                (window as any).LeadSense.identify(leadData);
            }
        }
    });
}

export function initFormCollector(track: TrackFn): void {
    // Scan inicial
    document.querySelectorAll<HTMLFormElement>('form').forEach(f => attachFormListener(f, track));

    // MutationObserver para formulários dinâmicos (SPA, popups)
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node instanceof Element) {
                    node.querySelectorAll<HTMLFormElement>('form').forEach(f => attachFormListener(f, track));
                    if (node instanceof HTMLFormElement) attachFormListener(node, track);
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

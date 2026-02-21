import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('LeadSense Capture Flow', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
    });

    test('should initialize and identify visitor', async ({ page }) => {
        // 1. Mock do enrichment de IP
        await page.route('**/functions/v1/enrich-ip', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    country: 'Brazil',
                    state: 'SP',
                    city: 'São Paulo',
                    is_bot: false
                })
            });
        });

        // 2. Mock do track-events
        const trackRequests: any[] = [];
        await page.route('**/functions/v1/track-events', async (route) => {
            const postData = route.request().postDataJSON();
            trackRequests.push(...postData.events);
            await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
        });

        // 3. Carregar página de teste
        // Note: Usamos o servidor do Vite rodando em 5173 conforme playwright.config.ts
        // Precisamos servir o e2e/fixtures/test.html
        // Como o vite serve 'public', vamos mover o fixture para public/test-e2e.html temporariamente ou configurar o vite
        await page.goto('/test-e2e.html');

        // 4. Verificar se o SDK foi carregado
        const isReady = await page.evaluate(() => window.LeadSense?._ready);
        expect(isReady).toBe(true);

        // 5. Verificar o evento session_start
        await expect.poll(() => trackRequests.find(e => e.event === 'page_view'), {
            timeout: 10000
        }).toBeTruthy();
    });

    test('should capture form submission and track lead', async ({ page }) => {
        // Mock identify-lead
        let identifyRequest: any = null;
        await page.route('**/functions/v1/identify-lead', async (route) => {
            identifyRequest = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ success: true, lead: { id: 'lead-123', email: 'test@example.com' } })
            });
        });

        await page.goto('/test-e2e.html');

        // Preencher formulário
        await page.fill('#name', 'E2E Tester');
        await page.fill('#email', 'e2e@test.com');

        // Disparar submit
        await page.click('button[type="submit"]');

        // Verificar se o identify foi chamado com os dados corretos
        await expect.poll(() => identifyRequest).toBeTruthy();
        expect(identifyRequest.lead.email).toBe('e2e@test.com');
        expect(identifyRequest.lead.name).toBe('E2E Tester');
    });
});

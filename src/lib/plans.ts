export type PlanId = 'starter' | 'pro' | 'agency';

export interface PlanLimits {
    id: PlanId;
    name: string;
    max_sites: number;
    max_pageviews: number;
    max_active_popups: number;
    max_leads: number;
    max_domains: number;
    price_brl: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
    starter: {
        id: 'starter',
        name: 'Starter',
        max_sites: 1,
        max_pageviews: 20_000,
        max_active_popups: 3,
        max_leads: 1_000,
        max_domains: 1,
        price_brl: 9700,
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        max_sites: 5,
        max_pageviews: 100_000,
        max_active_popups: 10,
        max_leads: 5_000,
        max_domains: 5,
        price_brl: 29700,
    },
    agency: {
        id: 'agency',
        name: 'Agência',
        max_sites: 999,
        max_pageviews: 500_000,
        max_active_popups: 999,
        max_leads: 50_000,
        max_domains: 999,
        price_brl: 69700,
    },
};

export function getPlanDisplayName(planId: string | null | undefined): string {
    const id = (planId || 'starter') as PlanId;
    return PLAN_LIMITS[id]?.name ?? 'Starter';
}

export function getPlanLimits(planId: string | null | undefined): PlanLimits {
    const id = (planId || 'starter') as PlanId;
    return PLAN_LIMITS[id] ?? PLAN_LIMITS.starter;
}

export function formatPriceBRL(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
}

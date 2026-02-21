import { Lock } from 'lucide-react';

const plans = [
    {
        name: 'STARTER',
        price: '97',
        period: '/mês',
        featured: false,
        features: [
            '1 site conectado',
            'Até 20.000 pageviews/mês',
            '3 popups ativos',
            'Dashboard básico',
            'Suporte por e-mail'
        ]
    },
    {
        name: 'PRO',
        price: '297',
        period: '/mês',
        featured: true,
        badge: 'MAIS POPULAR',
        features: [
            '5 sites conectados',
            'Até 100.000 pageviews/mês',
            '10 popups ativos',
            'Enriquecimento por IP',
            'Webhooks e integrações',
            'Relatórios avançados',
            'Suporte prioritário'
        ]
    },
    {
        name: 'AGÊNCIA',
        price: '697',
        period: '/mês',
        featured: false,
        features: [
            'Sites ilimitados',
            '500.000 pageviews/mês',
            'Popups ilimitados',
            'Multi-tenant por cliente',
            'White-label disponível',
            'API pública completa',
            'Suporte dedicado'
        ]
    }
];

export function PricingSection() {
    return (
        <section id="precos" className="w-full bg-[#080B10] py-[120px] px-[24px] md:px-[60px] border-t border-border-subtle">
            <div className="max-w-7xl mx-auto flex flex-col items-center animate-fadeUp">

                <div className="text-center mb-20 max-w-2xl">
                    <div className="inline-flex items-center gap-2 border border-accent-green/30 px-4 py-1.5 uppercase tracking-[0.12em] text-[0.7rem] mb-6 text-accent-green">
                        Planos
                    </div>
                    <h2 className="font-syne font-extrabold text-[clamp(2.5rem,6vw,4rem)] leading-[1] tracking-[-0.04em] text-white">
                        Simples. <span className="text-text-muted">Sem surpresas.</span>
                    </h2>
                    <p className="font-mono text-[0.95rem] leading-[1.7] text-text-muted mt-6">
                        14 dias grátis em todos os planos. Sem cartão de crédito.
                    </p>
                </div>

                {/* 1px gap grid for border effect */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-border-subtle border border-border-subtle">

                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative flex flex-col p-10 transition-colors duration-300 animate-fadeUp ${plan.featured
                                ? 'bg-[#0D1117] border border-accent-green z-10 shadow-[0_0_30px_rgba(0,196,122,0.15)] animate-glow'
                                : 'bg-[#080B10]'
                                }`}
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >

                            {plan.badge && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-green text-[#080B10] font-syne font-bold text-[0.6rem] px-[14px] py-[4px] uppercase tracking-widest whitespace-nowrap">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-text-muted mb-4">
                                {plan.name}
                            </div>

                            <div className="flex items-end gap-1 mb-8">
                                <span className="font-syne font-extrabold text-[1rem] leading-none text-text-main mb-2">R$</span>
                                <span className="font-syne font-extrabold text-[3rem] tracking-[-0.04em] leading-[1] text-text-main">
                                    {plan.price}
                                </span>
                                <span className="font-mono text-[0.8rem] text-text-muted mb-1">{plan.period}</span>
                            </div>

                            <ul className="flex flex-col gap-4 mb-12 flex-1">
                                {plan.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="font-mono text-[0.78rem] text-[#CBD5E1] flex items-start gap-3">
                                        <span className="text-accent-green font-bold shrink-0 mt-0.5">→</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full font-syne font-bold text-[0.8rem] py-4 transition-all duration-300 uppercase tracking-widest ${plan.featured
                                    ? 'bg-accent-green text-[#080B10] hover:opacity-85'
                                    : 'bg-transparent border border-border-subtle text-text-main hover:border-accent-green hover:text-accent-green'
                                    }`}
                            >
                                Começar grátis {plan.featured ? '→' : ''}
                            </button>
                        </div>
                    ))}

                </div>

                <div className="mt-12 flex items-center justify-center gap-3 text-text-muted font-mono text-[0.7rem] uppercase tracking-widest animate-fadeUp">
                    <Lock size={14} className="text-accent-green" />
                    <span className="hidden sm:inline">Pagamento seguro | Cancele quando quiser | 14 dias grátis sem cartão</span>
                    <span className="sm:hidden text-center">14 dias grátis sem cartão<br />Cancele quando quiser</span>
                </div>

            </div>
        </section >
    );
}

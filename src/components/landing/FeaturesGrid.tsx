import { Zap, BrainCircuit, Target, BarChart2, Link as LinkIcon, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: <Zap size={24} />,
        title: 'Script leve e universal',
        desc: 'Um snippet JavaScript com menos de 5KB que cabe em qualquer site. Assíncrono, sem dependências e com impacto zero na performance da sua página.',
        specs: [
            '< 5KB de tamanho inicial',
            'Carregamento async/defer',
            'Vanilla JS — sem frameworks',
            'Compatível com todos os navegadores modernos'
        ]
    },
    {
        icon: <BrainCircuit size={24} />,
        title: 'Enriquecimento por IP',
        desc: 'Identifica cidade, estado, operadora e tipo de conexão automaticamente, sem o visitante preencher nada. Sabe se é residencial, empresarial, mobile ou VPN.',
        specs: [
            'Geolocalização: país, estado, cidade',
            'ISP e tipo de conexão',
            'Detecção de VPN/proxy',
            'Associado ao perfil do visitante em tempo real'
        ]
    },
    {
        icon: <Target size={24} />,
        title: 'Popups com gatilhos inteligentes',
        desc: 'Exit Intent, scroll, tempo de permanência e inatividade. Configure regras de URL, dispositivo e UTM. Cada gatilho dispara no momento psicologicamente certo.',
        specs: [
            'Exit Intent (desktop + mobile)',
            'Scroll depth percentual',
            'Tempo na página configurável',
            'Inatividade / idle detection'
        ]
    },
    {
        icon: <BarChart2 size={24} />,
        title: 'Dashboard em tempo real',
        desc: 'Leads capturados, UTM sources, dispositivos, CTR dos popups e feed de atividade recente — sem precisar sair da plataforma ou cruzar com analytics externo.',
        specs: [
            'Filtros de 7d, 30d, 90d',
            'Gráfico de leads por dia',
            'Top UTM sources e dispositivos',
            'Feed de atividade ao vivo'
        ]
    },
    {
        icon: <LinkIcon size={24} />,
        title: 'Ações de conversão completas',
        desc: 'Redirecione para WhatsApp com mensagem pré-preenchida, URLs customizadas com UTM builder integrado, ou dispare webhooks para o seu CRM favorito.',
        specs: [
            'Abrir WhatsApp (número + mensagem)',
            'Redirect com UTM builder',
            'Webhook para CRM externo',
            'Mensagem de sucesso customizável'
        ]
    },
    {
        icon: <ShieldCheck size={24} />,
        title: 'Conformidade LGPD nativa',
        desc: 'Banner de consentimento configurável, modos de anonimização de IP, controle de retenção de dados e opt-out por visitante. Tudo dentro da plataforma, sem plugins extras.',
        specs: [
            'Banner de consentimento integrado',
            'Anonimização de IP opcional',
            'Retenção de dados configurável',
            'Opt-out por visitante (cookie)'
        ]
    }
];

export function FeaturesGrid() {
    return (
        <section id="funcionalidades" className="w-full bg-[#080B10] py-[120px] px-[24px] md:px-[60px]">
            <div className="max-w-7xl mx-auto flex flex-col items-center">

                <div className="text-center mb-16 max-w-2xl animate-fadeUp">
                    <div className="inline-flex items-center gap-2 border border-accent-green/30 px-4 py-1.5 uppercase tracking-[0.12em] text-[0.7rem] mb-6 text-accent-green">
                        Funcionalidades
                    </div>
                    <h2 className="font-syne font-extrabold text-[clamp(2rem,5vw,3.5rem)] leading-[1] tracking-[-0.04em] text-white">
                        Tudo que você<br className="hidden md:block" />
                        <span className="text-text-muted">sempre precisou.</span>
                    </h2>
                    <p className="font-mono text-[0.95rem] leading-[1.7] text-text-muted mt-6">
                        Uma plataforma completa de inteligência de conversão, sem curva de aprendizado.
                    </p>
                </div>

                {/* CSS Grid with 1px gaps simulating borders */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-border-subtle border border-border-subtle">
                    {features.map((feat, idx) => (
                        <div
                            key={idx}
                            className="group relative bg-[#080B10] p-[40px] hover:bg-surface-2 transition-colors duration-300 overflow-hidden animate-fadeUp"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            {/* Top border hover line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent-green to-accent-blue scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                            <div className="text-text-muted mb-6 group-hover:text-accent-green group-hover:scale-110 transition-all duration-300 origin-left w-fit">
                                {feat.icon}
                            </div>

                            <h3 className="font-syne font-bold text-[1.05rem] tracking-[-0.02em] text-text-main mb-3">
                                {feat.title}
                            </h3>

                            <p className="font-mono text-[0.78rem] leading-[1.75] text-text-muted mb-8">
                                {feat.desc}
                            </p>

                            <ul className="flex flex-col gap-3">
                                {feat.specs.map((spec, sIdx) => (
                                    <li key={sIdx} className="font-mono text-[0.75rem] text-[#4B5563] flex gap-2">
                                        <span className="text-accent-green shrink-0">→</span>
                                        <span>{spec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

            </div>
        </section >
    );
}

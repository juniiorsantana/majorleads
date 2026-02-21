import { Rocket, TrendingUp, ShoppingCart } from 'lucide-react';

const personas = [
    {
        icon: <Rocket size={24} className="text-text-muted group-hover:text-white transition-colors" />,
        role: 'INFOPRODUTOR',
        name: 'Rodrigo',
        pain: 'Gasta R$15k/mês em tráfego e não sabe quais UTMs geram leads quentes.',
        solution: 'Agora sabe exatamente de onde vêm os leads que compram — e recupera quem saiu sem converter com popup de saída personalizado.',
    },
    {
        icon: <TrendingUp size={24} className="text-text-muted group-hover:text-white transition-colors" />,
        role: 'GESTORA DE TRÁFEGO',
        name: 'Camila',
        pain: 'Gerencia 12 clientes ao mesmo tempo e precisa de dados claros para otimizar.',
        solution: 'Agora tem relatórios de comportamento prontos para apresentar aos clientes e tomar decisões de campanha com dados reais.',
    },
    {
        icon: <ShoppingCart size={24} className="text-text-muted group-hover:text-white transition-colors" />,
        role: 'DONO DE E-COMMERCE',
        name: 'Marcos',
        pain: '3.000 visitas por dia e alta taxa de abandono de carrinho sem conseguir reagir.',
        solution: 'Agora intercepta o visitante antes de sair com uma oferta personalizada — e captura o contato mesmo quando não finaliza a compra.',
    }
];

export function PersonasSection() {
    return (
        <section className="w-full bg-[#080B10] py-[120px] px-[24px] md:px-[60px] border-t border-border-subtle">
            <div className="max-w-7xl mx-auto flex flex-col items-center">

                <div className="text-center mb-16 animate-fadeUp">
                    <div className="inline-flex items-center gap-2 border border-accent-green/30 px-4 py-1.5 uppercase tracking-[0.12em] text-[0.7rem] mb-6 text-accent-green">
                        Para quem é
                    </div>
                    <h2 className="font-syne font-extrabold text-[clamp(2rem,5vw,3.5rem)] leading-[1] tracking-[-0.04em] text-white">
                        Feito para quem<br />
                        <span className="text-text-muted">vive de resultado.</span>
                    </h2>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                    {personas.map((persona, idx) => (
                        <div
                            key={idx}
                            className="group bg-[#080B10] border border-border-subtle p-8 hover:border-accent-green/30 transition-colors duration-300 animate-fadeUp flex flex-col"
                            style={{ animationDelay: `${idx * 120}ms` }}
                        >
                            <div className="w-12 h-12 bg-surface-2 flex items-center justify-center mb-8 group-hover:scale-105 group-hover:rotate-6 transition-transform duration-300">
                                {persona.icon}
                            </div>

                            <div className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-accent-green mb-2">
                                {persona.role}
                            </div>

                            <h3 className="font-syne font-bold text-[1.1rem] text-text-main mb-6">
                                {persona.name}
                            </h3>

                            <p className="font-mono text-[0.78rem] leading-[1.7] text-text-muted mb-6">
                                {persona.pain}
                            </p>

                            <div className="w-full h-px bg-border-subtle mb-6" />

                            <p className="font-mono text-[0.78rem] leading-[1.7] text-[#E8EDF5] mt-auto">
                                {persona.solution}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </section >
    );
}

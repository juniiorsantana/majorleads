import { useState } from 'react';
import { Plus } from 'lucide-react';

const faqs = [
    {
        q: 'Funciona com qualquer site?',
        a: 'Sim. O MajorLeads é um script JavaScript puro que funciona em qualquer plataforma que aceite código customizado: WordPress, Shopify, Hotmart, Kiwify, Webflow, Wix, HTML puro, Next.js, React, Vue e qualquer outra. Se você consegue colar um código no <head>, já funciona.'
    },
    {
        q: 'Preciso saber programar para usar?',
        a: 'Não. A instalação é copiar e colar uma linha de código. A criação de popups é 100% visual com editor drag-and-drop. Você não precisa tocar em código nenhum depois da instalação inicial.'
    },
    {
        q: 'O script afeta a velocidade do meu site?',
        a: 'Não. O script é assíncrono (carrega sem bloquear a página) e tem menos de 5KB. Em auditorias do PageSpeed, o impacto é menor que 2 pontos — praticamente imperceptível.'
    },
    {
        q: 'Meus dados ficam seguros? E a LGPD?',
        a: 'Seus dados e os dos seus visitantes ficam armazenados em servidores no Brasil. O MajorLeads tem banner de consentimento integrado, modo de anonimização de IP e opt-out por visitante, tudo em conformidade com a LGPD.'
    },
    {
        q: 'Posso usar em vários sites?',
        a: 'Depende do plano. O Starter suporta 1 site, o Pro suporta 5 e o plano Agência suporta sites ilimitados com gestão multi-tenant por cliente.'
    },
    {
        q: 'Como funciona o período de testes?',
        a: 'Você cria sua conta e tem 14 dias completos com todas as funcionalidades do plano escolhido, sem inserir cartão de crédito. Se não gostar, não paga nada.'
    }
];

export function FaqSection() {
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    const toggle = (idx: number) => {
        setOpenIdx(openIdx === idx ? null : idx);
    };

    return (
        <section className="w-full bg-[#080B10] py-[120px] px-[24px] md:px-[60px]">
            <div className="max-w-4xl mx-auto flex flex-col items-center">

                <div className="text-center mb-16 animate-fadeUp">
                    <div className="inline-flex items-center gap-2 border border-accent-green/30 px-4 py-1.5 uppercase tracking-[0.12em] text-[0.7rem] mb-6 text-accent-green">
                        FAQ
                    </div>
                    <h2 className="font-syne font-extrabold text-[clamp(2rem,5vw,3.5rem)] leading-[1] tracking-[-0.04em] text-white">
                        Dúvidas? <span className="text-text-muted">A gente resolve.</span>
                    </h2>
                </div>

                <div className="w-full flex flex-col animate-fadeUp [animation-delay:200ms]">
                    {faqs.map((faq, idx) => {
                        const isOpen = openIdx === idx;
                        return (
                            <div
                                key={idx}
                                className="w-full border-b border-border-subtle py-[24px] cursor-pointer group"
                                onClick={() => toggle(idx)}
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <h3 className={`font-syne font-semibold text-[1rem] transition-colors duration-200 ${isOpen ? 'text-accent-green' : 'text-[#E8EDF5] group-hover:text-accent-green'}`}>
                                        {faq.q}
                                    </h3>
                                    <div className={`text-text-muted transition-transform duration-250 ${isOpen ? 'rotate-45 text-accent-green' : ''}`}>
                                        <Plus size={20} />
                                    </div>
                                </div>

                                <div
                                    className={`grid transition-all duration-350 ease-in-out ${isOpen ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="font-mono text-[0.82rem] leading-[1.7] text-text-muted pb-2">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}

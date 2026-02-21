import { useEffect, useState } from 'react';

const steps = [
    {
        num: '01',
        title: 'Instale o script em 30 segundos',
        desc: 'Cole uma linha de JavaScript no <head> do seu site. Funciona em qualquer plataforma que aceite código customizado. Nenhuma dependência, nenhum framework necessário.'
    },
    {
        num: '02',
        title: 'Rastreamos e enriquecemos os dados',
        desc: 'Capturamos UTMs, comportamento, IP, dispositivo e histórico de sessão. Cada visitante ganha um perfil único e enriquecido automaticamente — sem ele preencher nada.'
    },
    {
        num: '03',
        title: 'Popups inteligentes convertem',
        desc: 'Configure gatilhos por intenção de saída, scroll, tempo na página ou inatividade. A mensagem certa aparece para o perfil certo, na hora certa.'
    },
    {
        num: '04',
        title: 'Dashboard com insights reais',
        desc: 'Veja leads capturados, UTM sources, dispositivos, conversão por popup e feed de atividade recente — tudo em tempo real, sem precisar de analytics externo.'
    }
];

export function HowItWorksSection() {
    const [activeStep, setActiveStep] = useState<number | null>(0);

    const toggleStep = (idx: number) => {
        setActiveStep(activeStep === idx ? null : idx);
    };

    return (
        <section id="como-funciona" className="w-full bg-[#0D1117] border-y border-border-subtle py-[100px] px-[24px] md:px-[60px]">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-[80px]">

                {/* Left Col - Steps */}
                <div className="flex-1 flex flex-col w-full">
                    {steps.map((step, idx) => (
                        <div
                            key={step.num}
                            className={`group flex gap-6 pb-6 pt-6 border-b border-border-subtle last:border-0 transition-colors duration-300 cursor-pointer ${activeStep === idx ? 'bg-accent-green/5' : 'hover:bg-accent-green/5'
                                }`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => toggleStep(idx)}
                        >
                            <div className={`font-mono text-[0.65rem] font-bold mt-1 transition-transform origin-top-left ${activeStep === idx ? 'text-accent-green scale-110' : 'text-text-muted group-hover:text-accent-green group-hover:scale-110'}`}>
                                {step.num}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-syne font-bold text-[1rem] transition-colors ${activeStep === idx ? 'text-accent-green mb-2' : 'text-text-main group-hover:text-accent-green'}`}>
                                    {step.title}
                                </h3>
                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${activeStep === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="font-mono text-[0.8rem] leading-[1.7] text-text-muted pb-2">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Col - Code Card */}
                <div className="flex-1 w-full animate-fadeUp [animation-delay:400ms]">
                    <div className="w-full bg-surface-2 rounded-lg overflow-hidden border border-border-subtle shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent-green to-accent-blue" />

                        {/* Window Controls */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                        </div>

                        {/* Code Content */}
                        <div className="p-6 font-courier text-[0.85rem] leading-[1.6] overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-all md:break-words">
                                <span className="text-gray-500">{`// Cole no <head> do seu site`}</span>
                                <span className="text-[#A78BFA]">&lt;script&gt;</span>
                                window.MajorLeads = {`{`} token: <span className="text-[#34D399]">"SEU_TOKEN"</span> {`}`};
                                <span className="text-[#A78BFA]">&lt;/script&gt;</span>
                                <span className="text-[#A78BFA]">&lt;script</span> <span className="text-[#60A5FA]">async src</span>=<span className="text-[#34D399]">"cdn.majorleads.io/tracker.js"</span><span className="text-[#A78BFA]">&gt;</span>
                                <span className="text-[#A78BFA]">&lt;/script&gt;</span>

                                <span className="text-gray-500">{`// Identificar lead manualmente`}</span>
                                MajorLeads.<span className="text-[#60A5FA]">identify</span>({`{`}
                                name:  <span className="text-[#34D399]">"João Silva"</span>,
                                email: <span className="text-[#34D399]">"joao@email.com"</span>,
                                {`}`});<span className="animate-blink inline-block w-2 bg-text-main ml-1 h-3 align-middle" />
                            </pre>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

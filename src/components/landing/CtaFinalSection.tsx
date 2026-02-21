import { useEffect } from 'react';

export function CtaFinalSection() {

    // Subtle Parallax effect on mouse move
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            const gradient = document.getElementById('cta-gradient');
            if (gradient) {
                gradient.style.transform = `translate(${x}px, ${y}px)`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section className="relative w-full bg-[#0D1117] py-[120px] px-[24px] md:px-[60px] border-t border-border-subtle overflow-hidden">

            {/* Radial Gradient Background */}
            <div
                id="cta-gradient"
                className="absolute w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none transition-transform duration-300 ease-out z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)',
                    top: '50%',
                    left: '50%',
                    marginTop: '-300px', // Center Y
                    marginLeft: '-300px', // Center X
                    transformOrigin: 'center center'
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">

                <div className="animate-fadeUp opacity-0 [animation-delay:0ms] inline-flex items-center gap-2 border border-accent-green/30 px-4 py-1.5 uppercase tracking-[0.12em] text-[0.7rem] mb-8 text-accent-green">
                    Pronto para começar?
                </div>

                <h2 className="animate-fadeUp opacity-0 [animation-delay:150ms] font-syne font-extrabold text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.04em] text-white">
                    Seu próximo lead<br />
                    já está no seu site.<br />
                    <span className="font-instrument italic text-accent-green pr-2">Só falta você ver.</span>
                </h2>

                <p className="animate-fadeUp opacity-0 [animation-delay:300ms] font-mono text-[0.88rem] leading-[1.7] text-text-muted mt-8 max-w-[440px]">
                    Instale o script, configure um popup e comece a capturar leads com inteligência — em menos de 5 minutos.
                </p>

                <div className="animate-fadeUp opacity-0 [animation-delay:450ms] mt-12">
                    <button className="bg-accent-green text-[#080B10] font-syne font-bold px-11 py-5 hover:-translate-y-[2px] hover:shadow-[0_0_60px_rgba(0,229,160,0.2)] transition-all duration-300">
                        Criar conta gratuita →
                    </button>
                </div>

            </div>
        </section>
    );
}

import { useEffect } from 'react';

export function HeroSection() {

    // Parallax effect on mouse move
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            const gradient = document.getElementById('hero-gradient');
            if (gradient) {
                gradient.style.transform = `translate(${x}px, ${y}px)`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-[140px] pb-[80px] px-10 overflow-hidden">

            {/* Radial Gradient Background */}
            <div
                id="hero-gradient"
                className="absolute w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none transition-transform duration-300 ease-out z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)',
                    top: '50%',
                    left: '50%',
                    marginTop: '-400px', // Center Y
                    marginLeft: '-400px', // Center X
                    transformOrigin: 'center center'
                }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">

                {/* Badge */}
                <div className="animate-fadeUp opacity-0 [animation-delay:0s] flex items-center gap-2 border border-accent-green/30 px-4 py-1.5 uppercase tracking-[0.12em] text-[0.7rem] mb-8 text-accent-green">
                    <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulseBadge shadow-[0_0_8px_rgba(0,196,122,0.8)]" />
                    Plataforma de Inteligência de Visitantes
                </div>

                {/* Headline */}
                <h1 className="animate-fadeUp opacity-0 [animation-delay:100ms] font-syne font-extrabold text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.95] tracking-[-0.04em] text-white">
                    Cada visitante<br />
                    <span className="font-instrument italic text-accent-green pr-2">tem um nome.</span><br />
                    Descubra qual.
                </h1>

                {/* Subtitle */}
                <p className="animate-fadeUp opacity-0 [animation-delay:200ms] font-mono text-[0.95rem] leading-[1.7] text-text-muted mt-8 max-w-[520px]">
                    MajorLeads rastreia, enriquece e converte visitantes anônimos em leads identificados — com popups inteligentes que aparecem na hora certa, para a pessoa certa.
                </p>

                {/* CTA Actions */}
                <div className="animate-fadeUp opacity-0 [animation-delay:300ms] mt-12 flex flex-col sm:flex-row items-center gap-4">
                    <button className="bg-accent-green text-[#080B10] font-syne font-bold px-9 py-4 hover:opacity-[0.88] hover:-translate-y-[2px] hover:shadow-[0_0_40px_rgba(0,229,160,0.15)] transition-all duration-300">
                        Testar 14 dias grátis →
                    </button>

                    <a href="#como-funciona" className="font-mono text-[0.85rem] text-text-muted hover:text-text-main transition-colors px-6 py-4">
                        ↓ Ver como funciona
                    </a>
                </div>

            </div>
        </section>
    );
}

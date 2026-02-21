import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "Em 3 dias com o MajorLeads eu já sabia quais campanhas do Meta traziam leads que compravam vs. leads que só curiosos. Economizei R$8k no mês seguinte cortando o que não funcionava.",
        name: "Rodrigo M.",
        role: "Infoprodutor — Curso de Finanças"
    },
    {
        quote: "Finalmente consigo mostrar para meu cliente não só quantas visitas vieram, mas o que cada visitante fez na página. O dashboard é exatamente o que eu precisava para justificar minhas otimizações.",
        name: "Camila S.",
        role: "Gestora de Tráfego — 12 clientes"
    },
    {
        quote: "O popup de exit intent recupera em média 4% dos visitantes que iam embora. Com 3.000 visitas por dia, isso é 120 leads extras por dia que eu não tinha antes. Setup levou 20 minutos.",
        name: "Marcos T.",
        role: "E-commerce — Shopify 3k visitas/dia"
    }
];

export function TestimonialsSection() {
    return (
        <section className="w-full bg-[#0D1117] py-[120px] px-[24px] md:px-[60px] border-t border-border-subtle relative overflow-hidden">

            <div className="max-w-7xl mx-auto flex flex-col items-center">

                <div className="text-center mb-16 animate-fadeUp">
                    <div className="inline-flex items-center gap-2 border border-accent-green/30 px-4 py-1.5 uppercase tracking-[0.12em] text-[0.7rem] mb-6 text-accent-green">
                        O que dizem nossos clientes
                    </div>
                    <h2 className="font-syne font-extrabold text-[clamp(2rem,5vw,3.5rem)] leading-[1] tracking-[-0.04em] text-white">
                        Resultados que<br />
                        <span className="text-text-muted">falam por si.</span>
                    </h2>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 snap-x snap-mandatory overflow-x-auto pb-4 md:overflow-visible md:pb-0 no-scrollbar">
                    {testimonials.map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="group min-w-[85vw] md:min-w-0 snap-center bg-[#0D1117] border border-border-subtle p-9 hover:shadow-[0_0_0_1px_rgba(0,196,122,0.2)] transition-shadow duration-300 animate-fadeUp flex flex-col relative"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <div className="absolute top-6 right-6 font-syne text-[4rem] leading-none text-accent-green/10 pointer-events-none">
                                "
                            </div>

                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill="#FBBF24" color="#FBBF24" />
                                ))}
                            </div>

                            <blockquote className="font-mono text-[0.82rem] italic leading-[1.7] text-[#CBD5E1] mb-8 z-10">
                                "{testimonial.quote}"
                            </blockquote>

                            <div className="w-[40px] h-[1px] bg-border-subtle mb-6 mt-auto" />

                            <div>
                                <p className="font-syne font-semibold text-[0.9rem] text-[#E8EDF5]">
                                    {testimonial.name}
                                </p>
                                <p className="font-mono text-[0.75rem] text-text-muted mt-1">
                                    {testimonial.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section >
    );
}

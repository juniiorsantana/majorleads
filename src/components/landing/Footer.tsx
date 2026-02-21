export function Footer() {
    return (
        <footer className="w-full bg-[#080B10] border-t border-border-subtle py-[40px] px-[24px] md:px-[60px]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

                {/* Lado Esquerdo */}
                <div className="flex flex-col items-center md:items-start">
                    <div className="font-syne font-extrabold text-[1rem] tracking-tight mb-1">
                        <span className="text-white">Major</span>
                        <span className="text-accent-green">Leads</span>
                    </div>
                    <span className="font-mono text-[0.7rem] text-text-muted">
                        Plataforma de Inteligência de Visitantes
                    </span>
                </div>

                {/* Lado Direito */}
                <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                    <span className="font-mono text-[0.7rem] text-[#6B7A8F]">
                        © 2026 MajorLeads. Todos os direitos reservados.
                    </span>
                    <div className="flex gap-4 font-mono text-[0.7rem] text-text-muted">
                        <a href="#" className="hover:text-text-main transition-colors duration-200">
                            Política de Privacidade
                        </a>
                        <span>|</span>
                        <a href="#" className="hover:text-text-main transition-colors duration-200">
                            Termos de Uso
                        </a>
                        <span>|</span>
                        <a href="#" className="hover:text-text-main transition-colors duration-200">
                            LGPD
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
}

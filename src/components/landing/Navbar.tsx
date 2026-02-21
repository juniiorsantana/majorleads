import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-[100] transition-shadow duration-300 ${scrolled
                ? 'bg-[#080B10]/85 backdrop-blur-[20px] shadow-[0_4px_32px_rgba(0,0,0,0.4)] border-b border-border-subtle'
                : 'bg-transparent border-b border-transparent'
                }`}
        >
            <div className="w-full px-[24px] md:px-[60px] h-[68px] flex items-center justify-between">

                {/* Logo */}
                <div className="font-syne font-extrabold text-xl tracking-tight transition-opacity duration-200 hover:opacity-80 cursor-pointer">
                    <span className="text-white">Major</span>
                    <span className="text-accent-green">Leads</span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#como-funciona" className="text-[0.75rem] font-mono tracking-[0.08em] uppercase text-text-muted hover:text-text-main transition-colors duration-200">
                        Como funciona
                    </a>
                    <a href="#funcionalidades" className="text-[0.75rem] font-mono tracking-[0.08em] uppercase text-text-muted hover:text-text-main transition-colors duration-200">
                        Funcionalidades
                    </a>
                    <a href="#precos" className="text-[0.75rem] font-mono tracking-[0.08em] uppercase text-text-muted hover:text-text-main transition-colors duration-200">
                        Preços
                    </a>
                </div>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        to="/login"
                        className="text-[0.8rem] font-syne font-bold text-text-main hover:text-accent-green transition-colors"
                    >
                        Login
                    </Link>
                    <button className="bg-accent-green text-[#080B10] font-syne font-bold text-[0.8rem] px-6 py-2 rounded-none hover:opacity-85 hover:-translate-y-[1px] transition-all">
                        Começar grátis
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-text-main"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-[68px] left-0 w-full bg-[#080B10] border-b border-border-subtle flex flex-col items-center py-6 gap-6 shadow-2xl">
                    <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="text-sm font-mono tracking-widest uppercase text-text-muted hover:text-text-main">
                        Como funciona
                    </a>
                    <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="text-sm font-mono tracking-widest uppercase text-text-muted hover:text-text-main">
                        Funcionalidades
                    </a>
                    <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="text-sm font-mono tracking-widest uppercase text-text-muted hover:text-text-main">
                        Preços
                    </a>
                    <div className="flex flex-col items-center w-[90%] gap-4 mt-2">
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-text-main font-syne font-bold hover:text-accent-green transition-colors"
                        >
                            Login
                        </Link>
                        <button className="bg-accent-green text-[#080B10] font-syne font-bold text-sm px-8 py-3 w-full">
                            Começar grátis
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}

import { useEffect } from 'react';
import Lenis from 'lenis';

import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { StatsBar } from '../components/landing/StatsBar';
import { TickerSection } from '../components/landing/TickerSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { PersonasSection } from '../components/landing/PersonasSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FaqSection } from '../components/landing/FaqSection';
import { CtaFinalSection } from '../components/landing/CtaFinalSection';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
    useEffect(() => {
        const lenis = new Lenis({
            autoRaf: true,
            duration: 1.4, // Heavy/smooth feel
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <div className="bg-[#080B10] text-[#E8EDF5] min-h-screen font-mono overflow-x-hidden selection:bg-accent-green selection:text-[#080B10]">
            <Navbar />
            <HeroSection />
            <StatsBar />
            <TickerSection />
            <HowItWorksSection />
            <FeaturesGrid />
            <PersonasSection />
            <TestimonialsSection />
            <PricingSection />
            <FaqSection />
            <CtaFinalSection />
            <Footer />
        </div>
    );
}

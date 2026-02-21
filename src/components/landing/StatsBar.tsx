import { useState, useEffect, useRef } from 'react';

function useCounter(endValue: number, prefix: string = '', suffix: string = '', duration: number = 1500) {
    const [value, setValue] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );
        if (domRef.current) observer.observe(domRef.current);
        return () => observer.disconnect();
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible) return;
        let startTimestamp: number;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            setValue(Math.floor(easeProgress * endValue));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setValue(endValue);
            }
        };
        window.requestAnimationFrame(step);
    }, [isVisible, endValue, duration]);

    const displayValue = `${prefix}${value}${suffix}`;

    return { displayValue, domRef };
}

function StatItem({
    value,
    prefix = '',
    suffix = '',
    label
}: {
    value: number;
    prefix?: string;
    suffix?: string;
    label: string;
}) {
    const { displayValue, domRef } = useCounter(value, prefix, suffix);

    return (
        <div ref={domRef} className="flex flex-col items-center sm:items-start group">
            <div className="font-syne font-extrabold text-[2rem] text-accent-green tracking-[-0.03em] transition-transform duration-300 group-hover:scale-[1.03] group-hover:-translate-y-1 origin-left">
                {displayValue}
            </div>
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-text-muted mt-1 whitespace-nowrap">
                {label}
            </div>
        </div>
    );
}

export function StatsBar() {
    return (
        <div className="w-full bg-surface-1 border-y border-border-subtle px-[24px] md:px-[60px] py-[32px] animate-fadeUp opacity-0 [animation-delay:500ms]">
            <div className="max-w-7xl mx-auto flex flex-wrap justify-center sm:justify-between items-center gap-[40px] md:gap-[80px]">
                <StatItem prefix="+" value={20} suffix="%" label="Taxa de conversão média" />
                <StatItem prefix="> " value={40} suffix="%" label="Visitas com perfil enriquecido" />
                <StatItem prefix="> " value={8} suffix="%" label="CTR dos popups" />
                <StatItem value={500} suffix="+" label="Sites com script ativo" />
            </div>
        </div>
    );
}

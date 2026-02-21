export function TickerSection() {
    const platforms = [
        "WordPress", "Shopify", "Hotmart", "Kiwify", "Webflow",
        "Wix", "HTML puro", "Next.js", "Nuxt", "React"
    ];

    // Duplicate for seamless loop
    const tickerContent = [...platforms, ...platforms];

    return (
        <div className="w-full bg-surface-2 border-y border-border-subtle py-[14px] overflow-hidden relative">
            <div
                className="absolute inset-y-0 left-0 w-24 z-10"
                style={{ backgroundImage: 'linear-gradient(to right, #141922, transparent)' }}
            />
            <div
                className="absolute inset-y-0 right-0 w-24 z-10"
                style={{ backgroundImage: 'linear-gradient(to left, #141922, transparent)' }}
            />

            <div className="flex w-max animate-ticker">
                <div className="flex gap-8 items-center pr-8">
                    {tickerContent.map((platform, idx) => (
                        <div key={`${platform}-${idx}`} className="flex items-center gap-8 whitespace-nowrap">
                            <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-text-muted">
                                {platform}
                            </span>
                            {(idx !== tickerContent.length - 1) && (
                                <span className="text-accent-green text-[0.5rem]">✦</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

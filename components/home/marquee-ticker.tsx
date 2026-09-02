const ITEMS = [
    'MÚSICA EN VIVO',
    'GASTRONOMÍA',
    'FESTIVALES',
    'PROMOS DE HOY',
    'VIDA NOCTURNA',
    'ACTIVIDADES FAMILIARES',
    'DEPORTES',
] as const;

function TickerContent() {
    return (
        <span className="text-sm font-bold tracking-[0.04em] text-white">
            {ITEMS.map((item, i) => (
                <span key={i}>
                    <span style={{ color: i % 2 === 1 ? '#C8E64E' : '#FFFFFF' }}>{item}</span>
                    <span className="mx-3 text-white/40">•</span>
                </span>
            ))}
        </span>
    );
}

export function MarqueeTicker() {
    return (
        <div className="mt-8 overflow-hidden whitespace-nowrap bg-[#111111] py-3 md:mt-12">
            <div className="marquee-track">
                <TickerContent />
                <TickerContent />
            </div>
        </div>
    );
}

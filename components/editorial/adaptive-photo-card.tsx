import Link from 'next/link';

type CardItem = {
    id: string;
    photo_url?: string | null;
    photo_orientation?: 'portrait' | 'landscape' | null;
    title?: string | null;
    places?: { slug?: string | null; name?: string | null } | null;
    badges?: string[] | null;
    editorial_text?: string | null;
};

function badgeCls(badge: string): string {
    if (badge.includes('LO MEJOR')) return 'bg-[#0A0A0A] text-white';
    if (badge.includes('PEDÍ ESTO')) return 'bg-[#E11D2E] text-white';
    if (badge.includes('ESTÁ BIEN')) return 'border border-gray-300 text-gray-500';
    if (badge.includes('PICANTE')) return 'bg-[#FDF0F1] text-[#A32D2D]';
    if (badge.includes('CARBÓN') || badge.includes('AHUMADO')) return 'bg-[#FBEBDD] text-[#8A4B16]';
    if (badge.includes('QUESO') || badge.includes('GENEROSA')) return 'bg-[#FBEFD8] text-[#8A5A00]';
    if (badge.includes('ATÚN') || badge.includes('MARISCO')) return 'bg-[#E6F1FB] text-[#185FA5]';
    if (badge.includes('CRUJIENTE') || badge.includes('CREMOSO')) return 'bg-[#F3ECE2] text-[#6B4A2A]';
    if (badge.includes('MARINADO')) return 'bg-[#FBEBDD] text-[#8A4B16]';
    return 'bg-[#F1EFE8] text-[#5F5E5A]';
}

// Ítems pares: imagen izquierda, texto derecha.
// Ítems impares: imagen derecha, texto izquierda (flex-row-reverse).
// Mobile: siempre apilado (imagen arriba, texto abajo).
export function AdaptivePhotoCard({ ep, index = 0 }: { ep: CardItem; index?: number }) {
    const imageRight = index % 2 === 1;
    const name = ep.title || ep.places?.name;
    const badges = ep.badges ?? [];

    const nameEl = ep.places?.slug ? (
        <Link
            href={`/lugar/${ep.places.slug}`}
            className="font-serif text-xl leading-snug text-foreground hover:text-[#E11D2E] transition-colors"
        >
            {name}
        </Link>
    ) : (
        <span className="font-serif text-xl leading-snug text-foreground">{name}</span>
    );

    return (
        <div className="flex flex-col gap-5 border-b border-border py-6 last:border-0 md:flex-row md:items-start md:gap-8">
            {ep.photo_url && (
                <div
                    className={`h-[450px] shrink-0 overflow-hidden rounded-[10px] bg-[#F0EFE9] md:h-[480px] md:w-[420px] ${
                        imageRight ? 'md:order-last' : 'md:order-first'
                    }`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ep.photo_url} alt={name ?? ''} className="w-full h-full object-cover" />
                </div>
            )}
            <div
                className={`flex-1 md:pt-2 ${
                    imageRight ? 'md:order-first' : 'md:order-last'
                }`}
            >
                {nameEl}
                {badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {badges.map(badge => (
                            <span
                                key={badge}
                                className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeCls(badge)}`}
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                )}
                {ep.editorial_text && (
                    <p className="mt-3 text-sm leading-relaxed text-foreground/70">{ep.editorial_text}</p>
                )}
            </div>
        </div>
    );
}

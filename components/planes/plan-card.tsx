import Link from 'next/link';
import { formatPlanBadge, type PlanCard as PlanCardData } from '@/lib/plans';

// Badge de patrocinio — amarillo a propósito para no confundirse con el rojo de acento.
export function SponsoredBadge({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-block rounded bg-[#FFE36E] px-2 py-1 text-[10px] font-bold tracking-[0.12em] text-[#0A0A0A] ${className}`}>
            PATROCINADO
        </span>
    );
}

function DateBadge({ plan }: { plan: PlanCardData }) {
    if (plan.kind !== 'ocasion' || !plan.starts_at || !plan.ends_at) return null;
    const label = formatPlanBadge(plan.starts_at, plan.ends_at);
    const isToday = label.startsWith('HOY');
    return (
        <span
            className={`absolute left-3.5 top-3.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold tracking-[0.1em] ${
                isToday ? 'bg-[#E11D2E] text-white' : 'bg-white text-[#0A0A0A]'
            }`}
        >
            {label}
        </span>
    );
}

// Tarjeta alta con foto de fondo — carrusel del home.
export function PlanPosterCard({ plan }: { plan: PlanCardData }) {
    return (
        <Link
            href={`/planes/${plan.slug}`}
            className="group relative flex h-[400px] w-[280px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl bg-[#141414] text-white"
        >
            {plan.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={plan.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-[1.03]" />
            )}
            <DateBadge plan={plan} />
            {plan.sponsored && <SponsoredBadge className="absolute right-3.5 top-3.5" />}
            <div className="relative flex flex-col gap-2 bg-gradient-to-t from-[#0A0A0A]/90 to-transparent p-[18px]">
                <span className="font-serif text-[26px] font-bold leading-[1.1]">{plan.title}</span>
                {plan.subtitle && <span className="line-clamp-2 text-[13px] text-[#DDDDDD]">{plan.subtitle}</span>}
                <span className="mt-1 text-[13px] font-bold">Ver el plan →</span>
            </div>
        </Link>
    );
}

// Tarjeta de listado — /planes (ocasión).
export function PlanListCard({ plan }: { plan: PlanCardData }) {
    return (
        <Link href={`/planes/${plan.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] transition-colors hover:border-[#0A0A0A]">
            <div className="relative h-[190px] bg-[#141414] md:h-[220px]">
                {plan.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={plan.cover} alt="" className="h-full w-full object-cover" />
                )}
                <DateBadge plan={plan} />
                {plan.sponsored && <SponsoredBadge className="absolute right-3 top-3" />}
            </div>
            <div className="flex flex-col gap-1.5 px-4 pb-4 pt-3.5">
                <span className="font-serif text-[22px] font-bold leading-[1.15] text-[#0A0A0A]">{plan.title}</span>
                {plan.subtitle && <span className="text-sm text-[#444444]">{plan.subtitle}</span>}
            </div>
        </Link>
    );
}

// Tarjeta chica — /planes ('siempre') y "Más planes" en la ficha.
export function PlanCompactCard({ plan }: { plan: PlanCardData }) {
    return (
        <Link href={`/planes/${plan.slug}`} className="group flex flex-col gap-2">
            <div className="relative h-[150px] overflow-hidden rounded-xl bg-[#F5F4F0] md:h-[180px]">
                {plan.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={plan.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                )}
                {plan.sponsored && <SponsoredBadge className="absolute right-2 top-2" />}
            </div>
            <span className="text-[11px] font-bold tracking-[0.12em] text-[#666666]">
                {plan.kind === 'ocasion' && plan.starts_at && plan.ends_at ? formatPlanBadge(plan.starts_at, plan.ends_at) : 'SIEMPRE'}
            </span>
            <span className="font-serif text-lg font-bold leading-[1.15] text-[#0A0A0A] group-hover:underline">{plan.title}</span>
        </Link>
    );
}

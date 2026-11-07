import Link from 'next/link';
import { PlanPosterCard } from '@/components/planes/plan-card';
import type { PlanCard } from '@/lib/plans';

// "Planes de la semana" — mismo encabezado que la sección Editorial del home. Scroll
// manual con snap (sin auto-avance): son pocas tarjetas y la gente llega a leerlas.
// Si no hay planes vigentes, la sección no se renderiza.
export function PlansCarousel({ plans }: { plans: PlanCard[] }) {
    if (plans.length === 0) return null;
    return (
        <section className="mx-auto mt-6 max-w-[1400px] border-t-[0.5px] border-[#E5E5E5] pb-6">
            <div className="flex items-end justify-between px-6 pb-4 pt-[0.85rem] md:px-10">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">Planes de la semana</p>
                    <div className="mt-1.5 h-[2px] w-7 bg-[#E11D2E]" />
                    <h2 className="mt-3 font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.01em] text-[#0A0A0A]">
                        Ya te armamos el plan
                    </h2>
                </div>
                <Link href="/planes" className="whitespace-nowrap pb-1 text-xs font-semibold text-[#E11D2E]">
                    Ver todos →
                </Link>
            </div>
            <div className="flex snap-x snap-mandatory scroll-px-6 gap-3.5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:scroll-px-10 md:px-10">
                {plans.map(plan => (
                    <PlanPosterCard key={plan.id} plan={plan} />
                ))}
            </div>
        </section>
    );
}

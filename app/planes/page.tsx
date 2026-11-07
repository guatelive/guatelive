import { createClient } from '@supabase/supabase-js';
import { Breadcrumb } from '@/components/breadcrumb';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { PlanCompactCard, PlanListCard } from '@/components/planes/plan-card';
import { buildBreadcrumbSchema } from '@/lib/schema-builders';
import { SITE_URL } from '@/lib/site-config';
import { getActivePlans } from '@/lib/plans';

// Corto a propósito: un plan de ocasión tiene que salir del listado poco después de
// su ends_at (ver app/planes/[slug]/page.tsx).
export const revalidate = 600;

const DESCRIPTION = 'Lugares, eventos y actividades que juntamos para una ocasión: qué hacer hoy, este finde o cualquier día en Guate.';

export const metadata = {
    title: 'Planes en Guatemala | GuateLive',
    description: DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/planes` },
    openGraph: {
        title: 'Planes en Guatemala | GuateLive',
        description: DESCRIPTION,
        url: `${SITE_URL}/planes`,
        images: [{ url: '/og-home.jpg', width: 1200, height: 630 }],
    },
};

export default async function PlanesPage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const plans = await getActivePlans(supabase);
    const ocasion = plans.filter(p => p.kind === 'ocasion');
    const siempre = plans.filter(p => p.kind === 'siempre');

    const breadcrumbItems = [
        { name: 'Inicio', url: SITE_URL },
        { name: 'Planes', url: `${SITE_URL}/planes` },
    ];

    return (
        <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-10">
            <SchemaMarkup schema={buildBreadcrumbSchema(breadcrumbItems)} />
            <Breadcrumb items={breadcrumbItems} className="mb-5" />

            <header className="flex flex-col gap-2.5">
                <p className="text-[11px] font-semibold tracking-[0.25em] text-[#E11D2E]">PLANES</p>
                <div className="h-[2px] w-7 bg-[#E11D2E]" />
                <h1 className="mt-1.5 font-serif text-[34px] font-bold leading-[1.1] text-[#0A0A0A] sm:text-5xl">
                    ¿Qué hacemos? Ya te armamos el plan
                </h1>
                <p className="text-[15px] leading-[1.45] text-[#444444]">
                    Lugares, eventos y actividades que juntamos para una ocasión.
                </p>
            </header>

            {plans.length === 0 && (
                <p className="mt-10 rounded-2xl bg-[#F5F4F0] p-6 text-[15px] text-[#333333]">
                    Estamos armando los próximos planes. Volvé pronto.
                </p>
            )}

            {ocasion.length > 0 && (
                <section className="flex flex-col gap-3.5 pt-8">
                    <h2 className="font-display text-xl font-extrabold text-[#0A0A0A]">Próximos</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {ocasion.map(plan => (
                            <PlanListCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                </section>
            )}

            {siempre.length > 0 && (
                <section className="flex flex-col gap-3.5 pt-10">
                    <h2 className="font-display text-xl font-extrabold text-[#0A0A0A]">Para cualquier día</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                        {siempre.map(plan => (
                            <PlanCompactCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

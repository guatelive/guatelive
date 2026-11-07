import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { ShareButton } from '@/components/evento/share-button';
import { PlanCompactCard, SponsoredBadge } from '@/components/planes/plan-card';
import { buildBreadcrumbSchema } from '@/lib/schema-builders';
import { SITE_URL } from '@/lib/site-config';
import {
    PLAN_FIELDS,
    PLAN_ITEM_FIELDS,
    formatPlanDate,
    formatPlanTimeRange,
    getActivePlans,
    groupPlanItems,
    isPlanActive,
    resolvePlanItems,
    type DbPlan,
    type PlanItemRow,
    type ResolvedPlanItem,
} from '@/lib/plans';

// Más corto que las demás fichas (3600): un plan de ocasión tiene que pasar a
// "Este plan ya pasó" poco después de ends_at, no hasta una hora más tarde.
export const revalidate = 600;

type Params = Promise<{ slug: string }>;

function createSb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function generateStaticParams() {
    const supabase = createSb();
    const { data } = await supabase.from('plans').select('slug').eq('status', 'published');
    return (data ?? []).map(({ slug }: { slug: string }) => ({ slug }));
}

export async function generateMetadata(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();
    const { data: plan } = await supabase
        .from('plans')
        .select('title, subtitle, intro_text, cover_image_url')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

    if (!plan) return { title: 'Plan no encontrado' };

    const description = plan.subtitle ?? plan.intro_text?.slice(0, 160) ?? `${plan.title} — un plan de GuateLive`;
    return {
        title: `${plan.title} — GuateLive`,
        description,
        alternates: { canonical: `${SITE_URL}/planes/${slug}` },
        openGraph: {
            title: plan.title,
            description,
            url: `${SITE_URL}/planes/${slug}`,
            images: plan.cover_image_url ? [{ url: plan.cover_image_url }] : [{ url: '/og-home.jpg', width: 1200, height: 630 }],
            type: 'website',
        },
    };
}

function ItemNumber({ n }: { n: number }) {
    return (
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#0A0A0A] font-display text-[15px] font-extrabold text-white">
            {n}
        </span>
    );
}

function ItemLabel({ label, sponsored }: { label: string | null; sponsored: boolean }) {
    if (!label && !sponsored) return null;
    return (
        <div className="flex items-center justify-between gap-2">
            {label ? <p className="text-[11px] font-bold tracking-[0.14em] text-[#E11D2E]">{label.toUpperCase()}</p> : <span />}
            {sponsored && <SponsoredBadge />}
        </div>
    );
}

function SingleItem({ item, n }: { item: ResolvedPlanItem; n: number }) {
    return (
        <li className="flex gap-3.5 border-b-[0.5px] border-[#E5E5E5] py-5">
            <ItemNumber n={n} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <ItemLabel label={item.label} sponsored={item.sponsored} />
                <h2 className="font-serif text-[22px] font-bold leading-[1.2] text-[#0A0A0A]">{item.title}</h2>
                {item.subtitle && <p className="text-sm text-[#666666]">{item.subtitle}</p>}
                {item.note && <p className="text-[15px] leading-[1.5] text-[#333333]">{item.note}</p>}
                {item.link && (
                    <Link
                        href={item.link.href}
                        className="mt-1 flex min-h-11 items-center gap-3 rounded-xl border border-[#E5E5E5] p-2.5 transition-colors hover:border-[#0A0A0A]"
                    >
                        {item.link.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.link.image} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
                        ) : (
                            <span className="h-16 w-16 flex-none rounded-lg bg-[#F5F4F0]" />
                        )}
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-sm font-semibold text-[#0A0A0A]">{item.title}</span>
                            {item.link.meta && <span className="truncate text-xs text-[#666666]">{item.link.meta}</span>}
                        </span>
                        <span className="whitespace-nowrap text-[13px] font-semibold text-[#E11D2E]">{item.link.cta} →</span>
                    </Link>
                )}
            </div>
        </li>
    );
}

function CustomListItem({ label, items, n }: { label: string; items: ResolvedPlanItem[]; n: number }) {
    return (
        <li className="flex gap-3.5 border-b-[0.5px] border-[#E5E5E5] py-5">
            <ItemNumber n={n} />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <ItemLabel label={label} sponsored={items.some(i => i.sponsored)} />
                <ul className="flex flex-col overflow-hidden rounded-xl border border-[#E5E5E5]">
                    {items.map(item => (
                        <li key={item.id} className="flex flex-col gap-0.5 border-b border-[#F0F0F0] px-3.5 py-3 last:border-0">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[15px] font-semibold text-[#0A0A0A]">{item.title}</span>
                                {item.subtitle && <span className="whitespace-nowrap text-xs text-[#666666]">{item.subtitle}</span>}
                            </div>
                            {item.note && <span className="text-[13px] text-[#555555]">{item.note}</span>}
                        </li>
                    ))}
                </ul>
            </div>
        </li>
    );
}

export default async function PlanPage(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();

    const { data } = await supabase
        .from('plans')
        .select(`${PLAN_FIELDS}, plan_items(${PLAN_ITEM_FIELDS})`)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

    if (!data) notFound();

    const plan = data as unknown as DbPlan & { plan_items: PlanItemRow[] };
    const active = isPlanActive(plan);
    const items = resolvePlanItems(plan.plan_items ?? []);
    const groups = groupPlanItems(items);
    // Sin portada: la foto del primer item que tenga una (mismo criterio que las tarjetas).
    const cover = plan.cover_image_url ?? items.find(i => i.link?.image)?.link?.image ?? null;
    const morePlans = await getActivePlans(supabase, { excludeId: plan.id, limit: 4 });

    const isOcasion = plan.kind === 'ocasion' && plan.starts_at && plan.ends_at;
    const dateLabel = isOcasion ? formatPlanDate(plan.starts_at!, plan.ends_at!) : null;
    const timeRange = isOcasion ? formatPlanTimeRange(plan.starts_at!, plan.ends_at!) : null;

    const url = `${SITE_URL}/planes/${plan.slug}`;
    const breadcrumbItems = [
        { name: 'Inicio', url: SITE_URL },
        { name: 'Planes', url: `${SITE_URL}/planes` },
        { name: plan.title, url },
    ];
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${plan.title} — ${url}`)}`;

    return (
        <div className="min-h-screen bg-white">
            <SchemaMarkup schema={buildBreadcrumbSchema(breadcrumbItems)} />
            <article className="mx-auto max-w-2xl px-5 py-6 sm:px-6 sm:py-8">
                <Breadcrumb items={breadcrumbItems} className="mb-4" />

                <div className="relative h-[300px] overflow-hidden rounded-2xl bg-[#141414] sm:h-[380px]">
                    {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={cover}
                            alt=""
                            className={`h-full w-full object-cover ${active ? 'opacity-90' : 'opacity-45 grayscale'}`}
                        />
                    )}
                    {active ? (
                        <div className="absolute left-3.5 top-3.5 flex gap-2">
                            {plan.kind === 'ocasion' && (
                                <span className="rounded-md bg-[#E11D2E] px-2.5 py-1.5 text-[11px] font-bold tracking-[0.12em] text-white">
                                    PLAN DE OCASIÓN
                                </span>
                            )}
                            {plan.sponsored && <SponsoredBadge className="py-1.5" />}
                        </div>
                    ) : (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] whitespace-nowrap rounded-lg bg-white px-4 py-2.5 font-display text-lg font-extrabold tracking-[0.04em] text-[#0A0A0A]">
                            YA PASÓ
                        </span>
                    )}
                </div>

                <header className="flex flex-col gap-2.5 pt-6">
                    {dateLabel && (
                        <>
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.25em] ${active ? 'text-[#E11D2E]' : 'text-[#666666]'}`}>
                                {dateLabel}
                            </p>
                            {active && <div className="h-[2px] w-7 bg-[#E11D2E]" />}
                        </>
                    )}
                    <h1 className={`mt-1 font-serif text-[34px] font-bold leading-[1.1] sm:text-[44px] ${active ? 'text-[#0A0A0A]' : 'text-[#555555]'}`}>
                        {plan.title}
                    </h1>
                    {active && plan.subtitle && <p className="text-base leading-[1.45] text-[#444444]">{plan.subtitle}</p>}
                    {active && (timeRange || plan.theme_tags.length > 0) && (
                        <div className="mt-1 flex flex-wrap gap-2">
                            {timeRange && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F4F0] px-3 py-1.5 text-[13px] text-[#0A0A0A]">
                                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                    {timeRange}
                                </span>
                            )}
                            {plan.theme_tags.map(tag => (
                                <span key={tag} className="rounded-full bg-[#F5F4F0] px-3 py-1.5 text-[13px] text-[#0A0A0A]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    {active && plan.intro_text && (
                        <p className="mt-2.5 whitespace-pre-line font-serif text-lg italic leading-[1.5] text-[#222222]">{plan.intro_text}</p>
                    )}
                </header>

                {active ? (
                    <>
                        <div className="mt-6 h-[0.5px] bg-[#E5E5E5]" />
                        <ol className="flex flex-col pt-2">
                            {groups.map((group, i) =>
                                group.kind === 'single' ? (
                                    <SingleItem key={group.item.id} item={group.item} n={i + 1} />
                                ) : (
                                    <CustomListItem key={group.items[0].id} label={group.label} items={group.items} n={i + 1} />
                                )
                            )}
                        </ol>

                        <div className="mt-7 flex flex-col gap-3 rounded-2xl bg-[#0A0A0A] p-5 text-white">
                            <p className="font-serif text-xl font-bold">¿Le pasás el plan a tu grupo?</p>
                            <div className="flex flex-wrap gap-2.5">
                                <a
                                    href={whatsappHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#E11D2E] px-4 text-sm font-semibold text-white hover:bg-[#c91827]"
                                >
                                    Compartir por WhatsApp
                                </a>
                                <ShareButton
                                    url={url}
                                    title={plan.title}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#555555] px-4 text-sm font-semibold text-white hover:bg-white/10"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-[#F5F4F0] p-5">
                            <p className="font-serif text-[22px] font-bold text-[#0A0A0A]">Este plan ya pasó</p>
                            <p className="text-[15px] leading-[1.45] text-[#333333]">
                                {morePlans.length > 0
                                    ? 'Llegaste tarde a este, pero tenemos otros planes armados para estos días.'
                                    : 'Llegaste tarde a este. Pronto armamos el próximo.'}
                            </p>
                            <Link
                                href="/planes"
                                className="mt-1.5 inline-flex min-h-11 items-center self-start rounded-full bg-[#E11D2E] px-5 text-sm font-semibold text-white hover:bg-[#c91827]"
                            >
                                Ver planes vigentes
                            </Link>
                        </div>
                        {items.some(i => i.link) && (
                            <details className="mt-4 rounded-xl border border-[#E5E5E5] px-4 py-3.5">
                                <summary className="cursor-pointer text-sm font-semibold text-[#0A0A0A]">Ver lo que tenía el plan</summary>
                                <ul className="mt-2.5 flex flex-col gap-1.5">
                                    {items.filter(i => i.link).map(item => (
                                        <li key={item.id}>
                                            <Link href={item.link!.href} className="text-sm text-[#333333] underline-offset-2 hover:underline">
                                                {item.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </>
                )}

                {morePlans.length > 0 && (
                    <section className="flex flex-col gap-3.5 pt-8">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.25em] text-[#E11D2E]">
                                    {active ? 'MÁS PLANES' : 'PLANES VIGENTES'}
                                </p>
                                <div className="mt-1.5 h-[2px] w-7 bg-[#E11D2E]" />
                            </div>
                            <Link href="/planes" className="text-xs font-semibold text-[#E11D2E]">
                                Ver todos →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {morePlans.map(p => (
                                <PlanCompactCard key={p.id} plan={p} />
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </div>
    );
}

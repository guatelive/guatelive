import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = getSupabase();
    const { data: edition } = await supabase
        .from('editions')
        .select('title, subtitle, meta_title, meta_description, number')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!edition) return { title: 'Edición no encontrada — GuateLive' };

    return {
        title: edition.meta_title || `${edition.title} — GuateLive Edición Nº ${edition.number}`,
        description: edition.meta_description || edition.subtitle,
    };
}

export async function generateStaticParams() {
    const supabase = getSupabase();
    const { data: editions } = await supabase
        .from('editions')
        .select('slug')
        .eq('status', 'published');

    return (editions || []).map((e) => ({ slug: e.slug }));
}

function RatingDiamonds({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: full }).map((_, i) => (
                <span key={`f${i}`} className="text-[#E11D2E]">◆</span>
            ))}
            {hasHalf && <span className="text-[#E11D2E] opacity-50">◆</span>}
            {Array.from({ length: empty }).map((_, i) => (
                <span key={`e${i}`} className="text-gray-600">◇</span>
            ))}
            <span className="ml-2 font-serif text-lg">{rating} / 5</span>
        </div>
    );
}

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = getSupabase();

    const { data: edition, error } = await supabase
        .from('editions')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error || !edition) notFound();

    const { data: editionPlaces } = await supabase
        .from('edition_places')
        .select(`
      id, mention_type, editorial_text, order_index,
      photo_url, title, badges,
      places ( id, name, slug, zone, rating, primary_category, address, price_range, place_photos(url, is_primary, order_index) )
    `)
        .eq('edition_id', edition.id)
        .order('order_index', { ascending: true });

    const highlighted = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'highlighted');
    const mentioned = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'mentioned');
    const notRecommended = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'not_recommended');

    const publishDate = edition.published_at
        ? new Date(edition.published_at).toLocaleDateString('es-GT', {
            year: 'numeric', month: 'long', day: 'numeric',
        })
        : null;

    return (
        <SiteLayout>
            <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio
                </Link>

                {/* Header */}
                <div className="mb-12">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                        Edición Nº {edition.number}
                    </p>
                    <div className="mt-2 h-[2px] w-8 bg-[#E11D2E]" />
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">
                        {edition.title}
                    </h1>
                    {edition.subtitle && (
                        <p className="mt-3 text-lg text-muted-foreground">{edition.subtitle}</p>
                    )}
                    {publishDate && (
                        <p className="mt-4 text-sm text-muted-foreground">{publishDate}</p>
                    )}
                </div>

                {/* Índice */}
                <nav className="mb-12 rounded-lg border border-border p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-4">
                        En esta edición
                    </p>
                    <div className="space-y-2">
                        {highlighted.length > 0 && (
                            <a href="#la-seleccion" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                → La selección
                            </a>
                        )}
                        {mentioned.length > 0 && (
                            <a href="#tambien-vale" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                → También vale la pena
                            </a>
                        )}
                        {edition.summary && (
                            <a href="#la-cuenta" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                → La cuenta
                            </a>
                        )}
                        {edition.food_rating && (
                            <a href="#la-comida" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                → La comida
                            </a>
                        )}
                        {edition.place_rating && (
                            <a href="#el-lugar" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                → El lugar
                            </a>
                        )}
                        {notRecommended.length > 0 && (
                            <a href="#no-recomendamos" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                → No recomendamos
                            </a>
                        )}
                    </div>
                </nav>

                {/* Cover */}
                {edition.cover_image_url && (
                    <div className="mb-12 overflow-hidden rounded-lg">
                        <img src={edition.cover_image_url} alt={edition.title} className="w-full h-auto object-cover" />
                    </div>
                )}

                {/* Intro */}
                {edition.intro_text && (
                    <div className="mb-12 font-serif text-lg leading-relaxed text-foreground/90 italic">
                        {edition.intro_text.split('\n').map((p: string, i: number) => (
                            <p key={i} className="mb-4">{p}</p>
                        ))}
                    </div>
                )}

                {/* La selección */}
                {highlighted.length > 0 && (
                    <section id="la-seleccion" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">
                            La selección
                        </p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-8" />
                        <div className="space-y-10">
                            {highlighted.map((ep: any) => (
                                <div key={ep.id} className="border-b border-border pb-8 last:border-0">
                                    {(() => {
                                        const photos: { url: string; is_primary: boolean; order_index: number }[] = ep.places?.place_photos ?? [];
                                        const placeSrc = photos.find((p: { is_primary: boolean }) => p.is_primary)?.url ?? [...photos].sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)[0]?.url ?? null;
                                        const src = ep.photo_url || placeSrc;
                                        return src ? (
                                            <div className="mb-4 overflow-hidden rounded-lg">
                                                <img
                                                    src={src}
                                                    alt={ep.title || ep.places?.name}
                                                    className="w-full h-[700px] object-cover"
                                                />
                                            </div>
                                        ) : null;
                                    })()}
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <Link
                                                href={`/lugar/${ep.places.slug}`}
                                                className="font-serif text-2xl text-foreground hover:text-[#E11D2E] transition-colors"
                                            >
                                                {ep.title || ep.places.name}
                                            </Link>
                                        </div>
                                    </div>
                                    {ep.badges?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {ep.badges.map((badge: string) => (
                                                <span
                                                    key={badge}
                                                    className={`inline-block rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badge.includes('LO MEJOR')
                                                        ? 'bg-[#0A0A0A] text-white'
                                                        : badge.includes('PEDÍ ESTO')
                                                            ? 'bg-[#E11D2E] text-white'
                                                            : badge.includes('ESTÁ BIEN')
                                                                ? 'border border-gray-300 text-gray-500'
                                                                : badge.includes('PICANTE')
                                                                    ? 'bg-[#FDF0F1] text-[#A32D2D]'
                                                                    : badge.includes('CARBÓN') || badge.includes('AHUMADO')
                                                                        ? 'bg-[#FBEBDD] text-[#8A4B16]'
                                                                        : badge.includes('QUESO') || badge.includes('GENEROSA')
                                                                            ? 'bg-[#FBEFD8] text-[#8A5A00]'
                                                                            : badge.includes('ATÚN') || badge.includes('MARISCO')
                                                                                ? 'bg-[#E6F1FB] text-[#185FA5]'
                                                                                : badge.includes('CRUJIENTE') || badge.includes('CREMOSO')
                                                                                    ? 'bg-[#F3ECE2] text-[#6B4A2A]'
                                                                                    : badge.includes('MARINADO')
                                                                                        ? 'bg-[#FBEBDD] text-[#8A4B16]'
                                                                                        : 'bg-[#F1EFE8] text-[#5F5E5A]'
                                                        }`}
                                                >
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {ep.editorial_text && (
                                        <p className="mt-4 leading-relaxed text-foreground/80">{ep.editorial_text}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* También vale la pena */}
                {mentioned.length > 0 && (
                    <section id="tambien-vale" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">
                            También vale la pena
                        </p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-8" />
                        <div className="space-y-8">
                            {mentioned.map((ep: any) => (
                                <div key={ep.id} className="border-b border-border pb-6 last:border-0">
                                    {ep.photo_url && (
                                        <div className="mb-4 overflow-hidden rounded-lg">
                                            <img src={ep.photo_url} alt={ep.title || ep.places.name} className="w-full h-[420px] object-cover" />
                                        </div>
                                    )}
                                    <Link
                                        href={`/lugar/${ep.places.slug}`}
                                        className="font-serif text-xl text-foreground hover:text-[#E11D2E] transition-colors"
                                    >
                                        {ep.title || ep.places.name}
                                    </Link>
                                    {ep.badges?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {ep.badges.map((badge: string) => (
                                                <span
                                                    key={badge}
                                                    className={`inline-block rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badge.includes('LO MEJOR')
                                                        ? 'bg-[#0A0A0A] text-white'
                                                        : badge.includes('PEDÍ ESTO')
                                                            ? 'bg-[#E11D2E] text-white'
                                                            : badge.includes('ESTÁ BIEN')
                                                                ? 'border border-gray-300 text-gray-500'
                                                                : badge.includes('PICANTE')
                                                                    ? 'bg-[#FDF0F1] text-[#A32D2D]'
                                                                    : badge.includes('CARBÓN') || badge.includes('AHUMADO')
                                                                        ? 'bg-[#FBEBDD] text-[#8A4B16]'
                                                                        : badge.includes('QUESO') || badge.includes('GENEROSA')
                                                                            ? 'bg-[#FBEFD8] text-[#8A5A00]'
                                                                            : badge.includes('ATÚN') || badge.includes('MARISCO')
                                                                                ? 'bg-[#E6F1FB] text-[#185FA5]'
                                                                                : badge.includes('CRUJIENTE') || badge.includes('CREMOSO')
                                                                                    ? 'bg-[#F3ECE2] text-[#6B4A2A]'
                                                                                    : badge.includes('MARINADO')
                                                                                        ? 'bg-[#FBEBDD] text-[#8A4B16]'
                                                                                        : 'bg-[#F1EFE8] text-[#5F5E5A]'
                                                        }`}
                                                >
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {ep.editorial_text && (
                                        <p className="mt-3 text-foreground/80">{ep.editorial_text}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* La cuenta */}
                {edition.summary && (
                    <section id="la-cuenta" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">
                            La cuenta
                        </p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-6" />
                        <div className="rounded-lg bg-foreground text-background p-6">
                            <div className="space-y-3">
                                {edition.summary.split('·').map((item: string, i: number, arr: string[]) => {
                                    const trimmed = item.trim();
                                    const isTotal = trimmed.toLowerCase().includes('total');
                                    return (
                                        <div key={i}>
                                            {isTotal && <div className="h-[1px] bg-[#E11D2E] my-3" />}
                                            <div className={`flex justify-between ${isTotal ? 'font-serif text-lg' : 'text-sm opacity-80'}`}>
                                                <span>{trimmed.split(':')[0]?.trim()}</span>
                                                <span>{trimmed.split(':')[1]?.trim()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* La comida */}
                {edition.food_rating && (
                    <section id="la-comida" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">
                            La comida
                        </p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-6" />
                        {edition.food_verdict && (
                            <p className="mb-4 font-serif text-lg leading-relaxed italic text-foreground/90">
                                {edition.food_verdict}
                            </p>
                        )}
                        <RatingDiamonds rating={edition.food_rating} />
                    </section>
                )}

                {/* El lugar */}
                {edition.place_rating && (
                    <section id="el-lugar" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">
                            El lugar
                        </p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-6" />
                        {edition.place_verdict && (
                            <p className="mb-4 font-serif text-lg leading-relaxed italic text-foreground/90">
                                {edition.place_verdict}
                            </p>
                        )}
                        <RatingDiamonds rating={edition.place_rating} />
                    </section>
                )}

                {/* No recomendamos */}
                {notRecommended.length > 0 && (
                    <section id="no-recomendamos" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-2">
                            No recomendamos
                        </p>
                        <div className="h-[2px] w-8 bg-border mb-6" />
                        <ul className="space-y-3">
                            {notRecommended.map((ep: any) => (
                                <li key={ep.id}>
                                    <span className="font-medium text-muted-foreground">{ep.title || ep.places.name}</span>
                                    {ep.editorial_text && (
                                        <span className="text-sm text-muted-foreground"> — {ep.editorial_text}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Cierre */}
                {edition.closing_text && (
                    <section className="mb-12 border-t border-border pt-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                            El aparte
                        </p>
                        <div className="font-serif text-lg leading-relaxed text-foreground/80 italic">
                            {edition.closing_text.split('\n').map((p: string, i: number) => (
                                <p key={i} className="mb-4">{p}</p>
                            ))}
                        </div>
                    </section>
                )}

                {/* Tags */}
                {edition.theme_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {edition.theme_tags.map((tag: string) => (
                            <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* CTA Newsletter */}
                <div className="rounded-2xl bg-foreground p-8 text-center text-background">
                    <p className="text-xs uppercase tracking-[0.2em] opacity-60">Newsletter</p>
                    <p className="mt-2 font-serif text-xl">
                        Cada jueves, una edición. Sin spam, sin patrocinios disfrazados.
                    </p>
                    <p className="mt-4 text-sm opacity-60">Próximamente</p>
                </div>
            </article>
        </SiteLayout>
    );
}
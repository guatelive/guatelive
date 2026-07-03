import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { AdaptivePhotoCard } from '@/components/editorial/adaptive-photo-card';

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

function Badges({ badges }: { badges: string[] }) {
    if (!badges?.length) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map(badge => (
                <span key={badge} className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeCls(badge)}`}>
                    {badge}
                </span>
            ))}
        </div>
    );
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
      photo_url, photo_orientation, title, badges,
      places ( id, name, slug, zone, rating, primary_category, address, price_range, place_photos(url, is_primary, order_index) )
    `)
        .eq('edition_id', edition.id)
        .order('order_index', { ascending: true });

    const highlighted = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'highlighted');
    const mentioned = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'mentioned');
    const placeNotes = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'place_note');
    const drinks = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'drinks');
    const desserts = (editionPlaces || []).filter((ep: any) => ep.mention_type === 'desserts');
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

                {/* Header — label + título ancho completo */}
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                        Edición Nº {edition.number}
                    </p>
                    <div className="mt-2 h-[2px] w-8 bg-[#E11D2E]" />
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">
                        {(() => {
                            const idx = edition.title.indexOf('? ');
                            if (idx < 0) return edition.title;
                            return (
                                <>
                                    <span className="block">{edition.title.slice(0, idx + 1)}</span>
                                    <span className="block">{edition.title.slice(idx + 2)}</span>
                                </>
                            );
                        })()}
                    </h1>
                </div>

                {/* Cover + meta + índice — desktop: imagen derecha, mobile: apilado */}
                <div className="mb-10 md:flex md:gap-10 md:items-start">
                    <div className="md:flex-1">
                        {edition.subtitle && (
                            <p className="text-lg text-muted-foreground">{edition.subtitle}</p>
                        )}
                        {publishDate && (
                            <p className="mt-3 text-sm text-muted-foreground">{publishDate}</p>
                        )}

                        {/* Índice — debajo de la fecha, junto a la foto en desktop */}
                        <nav className="mt-6 rounded-lg border border-border p-5">
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
                                {placeNotes.length > 0 && (
                                    <a href="#el-lugar-notas" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                        → El lugar (menciones)
                                    </a>
                                )}
                                {drinks.length > 0 && (
                                    <a href="#bebidas" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                        → Bebidas
                                    </a>
                                )}
                                {desserts.length > 0 && (
                                    <a href="#postres" className="block text-sm text-foreground/80 hover:text-[#E11D2E] transition-colors">
                                        → Postres
                                    </a>
                                )}
                                {edition.summary_items?.length > 0 && (
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
                    </div>

                    {/* Foto de portada */}
                    {edition.cover_image_url && (
                        <div className="mt-6 md:mt-0 md:w-[44%] md:shrink-0">
                            <div className="overflow-hidden rounded-2xl">
                                <img
                                    src={edition.cover_image_url}
                                    alt={edition.title}
                                    className="w-full h-auto md:max-h-[420px] object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 1. INTRO ── */}
                {edition.intro_text && (
                    <div className="mb-12 max-w-[680px] border-l-2 border-[#E11D2E] pl-5">
                        {edition.intro_text.split('\n').map((p: string, i: number) => (
                            <p key={i} className="mb-4 font-serif text-lg leading-relaxed italic text-foreground/90 last:mb-0">{p}</p>
                        ))}
                    </div>
                )}

                {/* ── 2. LA SELECCIÓN — grid 210px | 1fr ── */}
                {highlighted.length > 0 && (
                    <section id="la-seleccion" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">La selección</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-6" />
                        <div>
                            {highlighted.map((ep: any) => {
                                const photos: { url: string; is_primary: boolean; order_index: number }[] = ep.places?.place_photos ?? [];
                                const placeSrc = photos.find((p: { is_primary: boolean }) => p.is_primary)?.url
                                    ?? [...photos].sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)[0]?.url
                                    ?? null;
                                const src = ep.photo_url || placeSrc;
                                const name = ep.title || ep.places?.name;
                                return (
                                    <div key={ep.id} className="border-b border-border py-6 last:border-0">
                                        <div className="flex flex-col gap-5 md:grid md:grid-cols-[420px_1fr] md:gap-8 md:items-start">
                                            {src && (
                                                <div className="h-[540px] overflow-hidden rounded-[10px] bg-[#F5F4F0] md:h-[590px]">
                                                    <img src={src} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="md:pt-2">
                                                {ep.places?.slug ? (
                                                    <Link href={`/lugar/${ep.places.slug}`} className="font-serif text-2xl leading-snug text-foreground hover:text-[#E11D2E] transition-colors">
                                                        {name}
                                                    </Link>
                                                ) : (
                                                    <span className="font-serif text-2xl leading-snug text-foreground">{name}</span>
                                                )}
                                                <Badges badges={ep.badges} />
                                                {ep.editorial_text && (
                                                    <p className="mt-3 text-sm leading-relaxed text-foreground/70">{ep.editorial_text}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── 3. TAMBIÉN VALE LA PENA — alternating global ── */}
                {mentioned.length > 0 && (
                    <section id="tambien-vale" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">También vale la pena</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-2" />
                        <div>
                            {mentioned.map((ep: any, i: number) => (
                                <AdaptivePhotoCard key={ep.id} ep={ep} index={highlighted.length + i} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── 3b. EL LUGAR (menciones) — calcado de "también vale la pena" ── */}
                {placeNotes.length > 0 && (
                    <section id="el-lugar-notas" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">El lugar</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-2" />
                        <div>
                            {placeNotes.map((ep: any, i: number) => (
                                <AdaptivePhotoCard key={ep.id} ep={ep} index={highlighted.length + mentioned.length + i} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── 4a. BEBIDAS — alternating global ── */}
                {drinks.length > 0 && (
                    <section id="bebidas" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">Bebidas</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-2" />
                        <div>
                            {drinks.map((ep: any, i: number) => (
                                <AdaptivePhotoCard key={ep.id} ep={ep} index={highlighted.length + mentioned.length + placeNotes.length + i} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── 4b. POSTRES — alternating global ── */}
                {desserts.length > 0 && (
                    <section id="postres" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">Postres</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-2" />
                        <div>
                            {desserts.map((ep: any, i: number) => (
                                <AdaptivePhotoCard key={ep.id} ep={ep} index={highlighted.length + mentioned.length + placeNotes.length + drinks.length + i} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── 4. LA CUENTA ── */}
                {edition.summary_items?.length > 0 && (
                    <section id="la-cuenta" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">La cuenta</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-6" />
                        <div className="rounded-lg bg-foreground text-background p-6">
                            <div className="space-y-3">
                                {edition.summary_items.map((item: { label: string; value: string }, i: number) => {
                                    const isTotal = item.label.toLowerCase().includes('total');
                                    return (
                                        <div key={i}>
                                            {isTotal && <div className="h-[2px] bg-[#E11D2E] my-4" />}
                                            <div className={`flex justify-between ${isTotal ? 'font-serif text-xl' : 'text-sm opacity-80'}`}>
                                                <span>{item.label}</span>
                                                <span className={isTotal ? 'font-serif text-xl' : ''}>{item.value}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── 5. RATINGS — grid 2 col ── */}
                {(edition.food_rating || edition.place_rating) && (
                    <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {edition.food_rating && (
                            <section id="la-comida" className="scroll-mt-24 rounded-[6px] border border-border bg-[#FAFAFA] p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">La comida</p>
                                <div className="h-[2px] w-8 bg-[#E11D2E] mb-4" />
                                {edition.food_verdict && (
                                    <p className="mb-3 font-serif text-base leading-relaxed italic text-foreground/90">{edition.food_verdict}</p>
                                )}
                                <RatingDiamonds rating={edition.food_rating} />
                            </section>
                        )}
                        {edition.place_rating && (
                            <section id="el-lugar" className="scroll-mt-24 rounded-[6px] border border-border bg-[#FAFAFA] p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">El lugar</p>
                                <div className="h-[2px] w-8 bg-[#E11D2E] mb-4" />
                                {edition.place_verdict && (
                                    <p className="mb-3 font-serif text-base leading-relaxed italic text-foreground/90">{edition.place_verdict}</p>
                                )}
                                <RatingDiamonds rating={edition.place_rating} />
                            </section>
                        )}
                    </div>
                )}

                {/* No recomendamos */}
                {notRecommended.length > 0 && (
                    <section id="no-recomendamos" className="mb-12 scroll-mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-2">No recomendamos</p>
                        <div className="h-[2px] w-8 bg-border mb-6" />
                        <ul className="space-y-3">
                            {notRecommended.map((ep: any) => (
                                <li key={ep.id}>
                                    <span className="font-medium text-muted-foreground">{ep.title || ep.places?.name}</span>
                                    {ep.editorial_text && (
                                        <span className="text-sm text-muted-foreground"> — {ep.editorial_text}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ── 6. EL APARTE ── */}
                {edition.closing_text && (
                    <section className="mb-12">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-4">El aparte</p>
                        <div className="border-l-2 border-[#E11D2E] bg-[#FAFAFA] rounded-r-[6px] py-4 pl-5 pr-4">
                            {edition.closing_text.split('\n').map((p: string, i: number) => (
                                <p key={i} className="mb-4 font-serif text-lg leading-relaxed italic text-foreground/80 last:mb-0">{p}</p>
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
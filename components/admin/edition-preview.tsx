'use client';

import type { EditionItem } from './edition-items-editor';
import type { SummaryItem } from './summary-items-editor';
import { getBadgeStyle } from '@/lib/badge-colors';

interface PreviewProps {
    number: number;
    title: string;
    subtitle: string;
    intro_text: string;
    cover_preview: string | null;
    items: EditionItem[];
    summary_items: SummaryItem[];
    food_rating: string;
    food_verdict: string;
    place_rating: string;
    place_verdict: string;
    closing_text: string;
    mode?: 'mobile' | 'desktop';
}

function RatingDiamonds({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: full }).map((_, i) => <span key={`f${i}`} className="text-[#E11D2E]">◆</span>)}
            {hasHalf && <span className="text-[#E11D2E] opacity-50">◆</span>}
            {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-gray-600">◇</span>)}
            <span className="ml-2 font-serif text-lg">{rating} / 5</span>
        </div>
    );
}

function BadgeChip({ badge }: { badge: string }) {
    const s = getBadgeStyle(badge);
    const base = 'inline-block rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide';
    if (s.type === 'inline') {
        return <span className={base} style={{ backgroundColor: s.bg, color: s.text }}>{badge}</span>;
    }
    return <span className={`${base} ${s.cls}`}>{badge}</span>;
}

function SecondaryCard({ item, index, desktop }: { item: EditionItem; index: number; desktop?: boolean }) {
    const name = item.title || item.place_name;
    const imageRight = index % 2 === 1;
    const photoSrc = item.photo_preview ?? item.photo_url;

    if (desktop) {
        return (
            <div className={`flex gap-8 border-b border-gray-100 py-6 last:border-0 items-start ${imageRight ? 'flex-row-reverse' : 'flex-row'}`}>
                {photoSrc && (
                    <div className="h-[480px] w-[420px] shrink-0 overflow-hidden rounded-[10px] bg-[#F0EFE9]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-1 pt-2">
                    <p className="font-serif text-xl leading-snug text-[#0A0A0A]">
                        {name || <span className="text-gray-300 italic">Sin nombre</span>}
                    </p>
                    {item.badges.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.badges.map(b => <BadgeChip key={b} badge={b} />)}
                        </div>
                    )}
                    {item.editorial_text && (
                        <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A]/70">{item.editorial_text}</p>
                    )}
                </div>
            </div>
        );
    }

    // Mobile: imagen full-width arriba, texto abajo — igual que AdaptivePhotoCard en phone
    return (
        <div className="flex flex-col gap-4 border-b border-gray-100 py-6 last:border-0">
            {photoSrc && (
                <div className="h-[450px] w-full overflow-hidden rounded-[10px] bg-[#F0EFE9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                </div>
            )}
            <div>
                <p className="font-serif text-xl leading-snug text-[#0A0A0A]">
                    {name || <span className="text-gray-300 italic">Sin nombre</span>}
                </p>
                {item.badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.badges.map(b => <BadgeChip key={b} badge={b} />)}
                    </div>
                )}
                {item.editorial_text && (
                    <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A]/70">{item.editorial_text}</p>
                )}
            </div>
        </div>
    );
}

export function EditionPreview({
    number, title, subtitle, intro_text, cover_preview,
    items, summary_items, food_rating, food_verdict,
    place_rating, place_verdict, closing_text, mode = 'mobile',
}: PreviewProps) {
    const desktop = mode === 'desktop';
    const highlighted = items.filter(i => i.mention_type === 'highlighted');
    const mentioned = items.filter(i => i.mention_type === 'mentioned');
    const drinks = items.filter(i => i.mention_type === 'drinks');
    const desserts = items.filter(i => i.mention_type === 'desserts');
    const notRecommended = items.filter(i => i.mention_type === 'not_recommended');
    const foodRatingNum = parseFloat(food_rating);
    const placeRatingNum = parseFloat(place_rating);

    return (
        <article className={`py-6 text-[#0A0A0A] ${desktop ? 'px-8' : 'px-0 bg-[#FAFAFA]'}`}>
            {/* Desktop: contenido centrado max-w-3xl. Mobile: simula pantalla de 390px */}
            <div className={desktop ? 'mx-auto max-w-3xl' : 'mx-auto w-[390px] bg-white shadow-sm overflow-hidden px-4 py-8'}>
                {/* Pill de preview */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-dashed border-[#E11D2E] px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-[#E11D2E] animate-pulse" />
                    <span className="text-xs text-[#E11D2E]">Preview — borrador</span>
                </div>

                {/* Header + Cover — mismo layout que la página pública */}
                <div className={`mb-10 flex gap-6 ${desktop ? 'flex-row items-center gap-10' : 'flex-col'}`}>
                    <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                            Edición Nº {number || '?'}
                        </p>
                        <div className="mt-2 h-[2px] w-8 bg-[#E11D2E]" />
                        <h1 className={`mt-4 font-serif leading-tight text-[#0A0A0A] ${desktop ? 'text-4xl' : 'text-2xl'}`}>
                            {title || <span className="text-gray-300 italic">Sin título</span>}
                        </h1>
                        {subtitle && <p className={`mt-3 text-gray-500 ${desktop ? 'text-lg' : 'text-base'}`}>{subtitle}</p>}
                    </div>
                    {cover_preview && (
                        <div className={`shrink-0 ${desktop ? 'w-[44%]' : 'w-full'}`}>
                            <div className="overflow-hidden rounded-2xl">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={cover_preview}
                                    alt=""
                                    className={desktop ? 'w-full h-auto max-h-[420px] object-contain' : 'w-full h-auto'}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* En esta edición — índice nav */}
                {(highlighted.length > 0 || mentioned.length > 0 || drinks.length > 0 || desserts.length > 0 || summary_items.length > 0) && (
                    <nav className="mb-12 rounded-lg border border-gray-200 p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-4">En esta edición</p>
                        <div className="space-y-2">
                            {highlighted.length > 0 && <p className="text-sm text-[#0A0A0A]/70">→ La selección</p>}
                            {mentioned.length > 0 && <p className="text-sm text-[#0A0A0A]/70">→ También vale la pena</p>}
                            {drinks.length > 0 && <p className="text-sm text-[#0A0A0A]/70">→ Bebidas</p>}
                            {desserts.length > 0 && <p className="text-sm text-[#0A0A0A]/70">→ Postres</p>}
                            {summary_items.length > 0 && <p className="text-sm text-[#0A0A0A]/70">→ La cuenta</p>}
                            {!isNaN(foodRatingNum) && foodRatingNum > 0 && <p className="text-sm text-[#0A0A0A]/70">→ La comida</p>}
                            {!isNaN(placeRatingNum) && placeRatingNum > 0 && <p className="text-sm text-[#0A0A0A]/70">→ El lugar</p>}
                        </div>
                    </nav>
                )}

                {/* Intro */}
                {intro_text && (
                    <div className="mb-10 border-l-2 border-[#E11D2E] pl-5">
                        {intro_text.split('\n').map((p, i) => (
                            <p key={i} className="mb-3 font-serif text-base leading-relaxed italic text-[#0A0A0A]/80 last:mb-0">{p}</p>
                        ))}
                    </div>
                )}

                {/* La selección */}
                {highlighted.length > 0 && (
                    <section className="mb-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">La selección</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-4" />
                        <div>
                            {highlighted.map((item, i) => {
                                const photoSrc = item.photo_preview ?? item.photo_url;
                                return (
                                    <div key={i} className={`border-b border-gray-100 last:border-0 ${desktop ? 'py-6' : 'pb-6'}`}>
                                        <div className={desktop ? 'flex gap-8 items-start' : 'flex flex-col gap-4'}>
                                            {photoSrc && (
                                                <div className={`overflow-hidden rounded-[10px] shrink-0 ${desktop ? 'h-[590px] w-[420px]' : 'h-[540px] w-full'}`}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 pt-2">
                                                <p className={`font-serif leading-snug text-[#0A0A0A] ${desktop ? 'text-2xl' : 'text-xl'}`}>
                                                    {item.title || item.place_name || <span className="text-gray-300 italic">Sin nombre</span>}
                                                </p>
                                                {item.badges.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {item.badges.map(b => <BadgeChip key={b} badge={b} />)}
                                                    </div>
                                                )}
                                                {item.editorial_text && (
                                                    <p className="mt-2 text-sm leading-relaxed text-[#0A0A0A]/70">{item.editorial_text}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* También vale la pena */}
                {mentioned.length > 0 && (
                    <section className="mb-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">También vale la pena</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-5" />
                        <div>
                            {mentioned.map((item, i) => <SecondaryCard key={i} item={item} index={highlighted.length + i} desktop={desktop} />)}
                        </div>
                    </section>
                )}

                {/* Bebidas */}
                {drinks.length > 0 && (
                    <section className="mb-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">Bebidas</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-5" />
                        <div>
                            {drinks.map((item, i) => <SecondaryCard key={i} item={item} index={highlighted.length + mentioned.length + i} desktop={desktop} />)}
                        </div>
                    </section>
                )}

                {/* Postres */}
                {desserts.length > 0 && (
                    <section className="mb-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">Postres</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-5" />
                        <div>
                            {desserts.map((item, i) => <SecondaryCard key={i} item={item} index={highlighted.length + mentioned.length + drinks.length + i} desktop={desktop} />)}
                        </div>
                    </section>
                )}

                {/* La cuenta */}
                {summary_items.length > 0 && (
                    <section className="mb-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">La cuenta</p>
                        <div className="h-[2px] w-8 bg-[#E11D2E] mb-5" />
                        <div className="rounded-lg bg-[#0A0A0A] text-white p-5">
                            <div className="space-y-2">
                                {summary_items.map((item, i) => {
                                    const isTotal = item.label.toLowerCase().includes('total');
                                    return (
                                        <div key={i}>
                                            {isTotal && <div className="h-[2px] bg-[#E11D2E] my-4" />}
                                            <div className={`flex justify-between ${isTotal ? 'font-serif text-xl' : 'text-sm opacity-80'}`}>
                                                <span>{item.label}</span>
                                                <span>{item.value}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Ratings — grid 2 col */}
                {(!isNaN(foodRatingNum) && foodRatingNum > 0) || (!isNaN(placeRatingNum) && placeRatingNum > 0) ? (
                    <div className="mb-10 grid grid-cols-2 gap-4">
                        {!isNaN(foodRatingNum) && foodRatingNum > 0 && (
                            <section className="rounded-[6px] border border-gray-200 bg-[#FAFAFA] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">La comida</p>
                                <div className="h-[2px] w-8 bg-[#E11D2E] mb-4" />
                                {food_verdict && (
                                    <p className="mb-3 font-serif text-sm leading-relaxed italic text-[#0A0A0A]/80">{food_verdict}</p>
                                )}
                                <RatingDiamonds rating={foodRatingNum} />
                            </section>
                        )}
                        {!isNaN(placeRatingNum) && placeRatingNum > 0 && (
                            <section className="rounded-[6px] border border-gray-200 bg-[#FAFAFA] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E] mb-2">El lugar</p>
                                <div className="h-[2px] w-8 bg-[#E11D2E] mb-4" />
                                {place_verdict && (
                                    <p className="mb-3 font-serif text-sm leading-relaxed italic text-[#0A0A0A]/80">{place_verdict}</p>
                                )}
                                <RatingDiamonds rating={placeRatingNum} />
                            </section>
                        )}
                    </div>
                ) : null}

                {/* No recomendamos */}
                {notRecommended.length > 0 && (
                    <section className="mb-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">No recomendamos</p>
                        <div className="h-[2px] w-8 bg-gray-200 mb-5" />
                        <ul className="space-y-2">
                            {notRecommended.map((item, i) => (
                                <li key={i} className="text-sm text-gray-500">
                                    <span className="font-medium">{item.title || item.place_name}</span>
                                    {item.editorial_text && <span> — {item.editorial_text}</span>}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* El aparte */}
                {closing_text && (
                    <section className="mb-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400 mb-3">El aparte</p>
                        <div className="border-l-2 border-[#E11D2E] bg-[#FAFAFA] rounded-r-[6px] py-4 pl-5 pr-4">
                            {closing_text.split('\n').map((p, i) => (
                                <p key={i} className="mb-3 font-serif text-base leading-relaxed italic text-[#0A0A0A]/70 last:mb-0">{p}</p>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </article>
    );
}

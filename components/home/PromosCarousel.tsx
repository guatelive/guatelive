'use client';

import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DbBankPromotion } from '@/lib/types';
import type { PromoPlaceLink } from '@/lib/promo-place-match';
import { PromoDetailModal } from '@/components/cards/promo-detail-modal';
import { promoDescription } from '@/lib/promo-title';
import { getBankBrand } from '@/lib/bank-brand';
import { interleaveByBank } from '@/lib/promo-order';

const DURATION = 4000;

type PromoWithPlaces = DbBankPromotion & { places: PromoPlaceLink[] };

const arrowButtonStyle: CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: '50%',
    border: '1.5px solid #D4D4D4', background: '#fff', cursor: 'pointer',
};

// Coupon card (home v2): línea de perforación + badge de descuento rotado —
// ver design_handoff_home_v2/README.md sección 6. Vive acá (no en
// components/cards/promo-card.tsx) porque ese componente lo sigue usando
// /promos con su propio lenguaje visual, fuera del alcance de este rediseño.
function CouponCard({ promo }: { promo: PromoWithPlaces }) {
    const [detailOpen, setDetailOpen] = useState(false);
    const brand = getBankBrand(promo.bank);
    const description = promoDescription(promo.title);
    const validUntilLabel = promo.valid_until
        ? new Date(promo.valid_until).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })
        : null;

    return (
        <>
            <button
                onClick={() => setDetailOpen(true)}
                style={{
                    display: 'flex', flexDirection: 'column', width: '100%', height: 380,
                    background: '#fff', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)', textAlign: 'left', border: 'none', padding: 0,
                }}
            >
                {/* Altura del 62% (en vez de 56%) — muchas de las imágenes que mandan los
                    bancos (sobre todo Promerica) son gráficos cuadrados, no fotos panorámicas;
                    un marco menos alargado recorta menos el gráfico. */}
                <div style={{ position: 'relative', height: '62%', flexShrink: 0, background: '#F4F4F4' }}>
                    {promo.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- dominio del CDN del banco no está en next.config images.remotePatterns, mismo criterio que components/cards/promo-card.tsx
                        <img
                            src={promo.image_url}
                            alt={promo.merchant_name}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#999', padding: '0 16px', textAlign: 'center' }}>
                            {promo.merchant_name}
                        </div>
                    )}
                    <div style={{ position: 'absolute', top: 10, right: 10, background: '#fff', color: brand.accent, fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 4 }}>
                        {brand.label}
                    </div>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ flex: 1, borderTop: '2px dashed #333' }} />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', margin: '0 -8px' }} />
                    <div style={{
                        background: '#C8E64E', color: '#111', fontFamily: 'var(--font-display)', fontWeight: 800,
                        fontSize: promo.discount_pct !== null ? 18 : 12, padding: '8px 14px', borderRadius: 8,
                        transform: 'rotate(-4deg)', margin: '0 10px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
                    }}>
                        {promo.discount_pct !== null ? `-${promo.discount_pct}%` : promo.discount_label}
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', margin: '0 -8px' }} />
                    <div style={{ flex: 1, borderTop: '2px dashed #333' }} />
                </div>

                <div style={{ background: '#141414', color: '#fff', padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <div className="line-clamp-2" style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, marginBottom: 6 }}>
                        {promo.merchant_name}
                    </div>
                    <div className="line-clamp-2" style={{ color: '#bbb', fontSize: 12 }}>
                        {description}
                    </div>
                    {validUntilLabel && (
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>
                            Vence {validUntilLabel}
                        </div>
                    )}
                </div>
            </button>

            {detailOpen && (
                <PromoDetailModal
                    promo={promo}
                    places={promo.places}
                    description={description}
                    validUntilLabel={validUntilLabel}
                    onClose={() => setDetailOpen(false)}
                    variant="v2"
                />
            )}
        </>
    );
}

export function PromosCarousel({ promos: promosProp, lastUpdatedLabel }: { promos: PromoWithPlaces[]; lastUpdatedLabel?: string }) {
    // Reordenado solo para display — evita que el orden real (discount_pct
    // desc) deje varias promos del mismo banco consecutivas.
    const promos = interleaveByBank(promosProp);
    const [index, setIndex] = useState(0);
    const activeIndex = promos.length > 0 ? Math.min(index, promos.length - 1) : 0;

    const footerProgressRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pageStartRef = useRef(0);
    const pauseStartRef = useRef<number | null>(null);
    const isPausedRef = useRef(false);

    // RAF — actualiza la barra de progreso directamente (sin React state), mismo patrón que EventsGrid
    useEffect(() => {
        function tick() {
            if (!isPausedRef.current && pageStartRef.current > 0) {
                const elapsed = performance.now() - pageStartRef.current;
                const pct = Math.min((elapsed / DURATION) * 100, 100);
                if (footerProgressRef.current) footerProgressRef.current.style.width = `${pct}%`;
            }
            rafRef.current = requestAnimationFrame(tick);
        }
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    // scrollTo (no scrollIntoView) para nunca afectar el scroll vertical de la página
    const scrollToCard = useCallback((idx: number) => {
        const container = carouselRef.current;
        const card = container?.children[idx] as HTMLElement | undefined;
        if (!container || !card) return;
        container.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    }, []);

    const doAdvance = useCallback(() => {
        setIndex(i => {
            const len = promos.length || 1;
            const next = (i + 1) % len;
            scrollToCard(next);
            return next;
        });
    }, [promos.length, scrollToCard]);

    const startTimer = useCallback((remaining = DURATION) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        pageStartRef.current = performance.now() - (DURATION - remaining);
        if (remaining === DURATION) {
            if (footerProgressRef.current) footerProgressRef.current.style.width = '0%';
        }
        timerRef.current = setTimeout(() => doAdvance(), remaining);
    }, [doAdvance]);

    useEffect(() => {
        startTimer();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [activeIndex, startTimer]);

    function handleMouseEnter() {
        if (isPausedRef.current) return;
        isPausedRef.current = true;
        pauseStartRef.current = performance.now();
        if (timerRef.current) clearTimeout(timerRef.current);
    }

    function handleMouseLeave() {
        if (!isPausedRef.current) return;
        const pauseDuration = performance.now() - (pauseStartRef.current ?? performance.now());
        pageStartRef.current += pauseDuration;
        const elapsed = performance.now() - pageStartRef.current;
        isPausedRef.current = false;
        pauseStartRef.current = null;
        startTimer(Math.max(100, DURATION - elapsed));
    }

    function goTo(idx: number) {
        if (timerRef.current) clearTimeout(timerRef.current);
        const clamped = ((idx % promos.length) + promos.length) % promos.length;
        setIndex(clamped);
        scrollToCard(clamped);
    }

    if (promos.length === 0) return null;

    return (
        <section className="mx-auto mt-2 max-w-[1400px] px-6 md:px-10">
            {/* ── Header ── */}
            <div style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                paddingTop: '0.85rem', paddingBottom: '0.7rem',
            }}>
                <div>
                    <p style={{
                        fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                        color: '#E11D2E', letterSpacing: '0.25em', textTransform: 'uppercase',
                    }}>
                        PROMOS
                    </p>
                    <div style={{ width: 28, height: 2, backgroundColor: '#E11D2E', marginTop: 6 }} />
                    {lastUpdatedLabel && (
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#666666', marginTop: 4 }}>
                            {lastUpdatedLabel}
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link
                        href="/promos"
                        style={{
                            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                            color: '#E11D2E', letterSpacing: '0.02em', textDecoration: 'none',
                        }}
                    >
                        Ver todas →
                    </Link>
                    {promos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => goTo(activeIndex - 1)} aria-label="Anterior" style={arrowButtonStyle}>
                                <ChevronLeft size={14} color="#0A0A0A" />
                            </button>
                            <button onClick={() => goTo(activeIndex + 1)} aria-label="Siguiente" style={arrowButtonStyle}>
                                <ChevronRight size={14} color="#0A0A0A" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Carrousel (scroll-snap nativo — swipe táctil gratis, sin JS de touch) ── */}
            <div
                ref={carouselRef}
                className="no-scrollbar"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 2 }}
            >
                {promos.map(promo => (
                    <div
                        key={promo.id}
                        style={{ width: '82vw', maxWidth: 350, flexShrink: 0, scrollSnapAlign: 'start' }}
                    >
                        <CouponCard promo={promo} />
                    </div>
                ))}
            </div>

            {/* ── Footer ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                paddingTop: '0.55rem', paddingBottom: '0.9rem',
            }}>
                {promos.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {promos.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                aria-label={`Ir a ${i + 1}`}
                                style={{
                                    padding: 0,
                                    border: 'none',
                                    background: i === activeIndex ? '#E11D2E' : '#D4D4D4',
                                    borderRadius: i === activeIndex ? 2 : '50%',
                                    width: i === activeIndex ? 14 : 5,
                                    height: 5,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                )}
                <div style={{ flex: 1, height: 1.5, background: '#E5E5E5', borderRadius: 2, overflow: 'hidden' }}>
                    <div ref={footerProgressRef} style={{ height: '100%', background: '#E11D2E', width: '0%', borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#666666', flexShrink: 0 }}>
                    {activeIndex + 1} / {promos.length}
                </span>
            </div>
        </section>
    );
}

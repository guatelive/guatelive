'use client';

import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DbBankPromotion } from '@/lib/types';
import type { PromoPlaceLink } from '@/lib/promo-place-match';
import { PromoCard } from '@/components/cards/promo-card';
import { interleaveByBank } from '@/lib/promo-order';

const DURATION = 4000;

type PromoWithPlaces = DbBankPromotion & { places: PromoPlaceLink[] };

const arrowButtonStyle: CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: '50%',
    border: '1.5px solid #D4D4D4', background: '#fff', cursor: 'pointer',
};

export function PromosCarousel({ promos: promosProp }: { promos: PromoWithPlaces[] }) {
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
        <section className="mx-auto mt-2 max-w-6xl px-4 sm:px-6">
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
                        style={{ width: '82vw', maxWidth: 300, flexShrink: 0, scrollSnapAlign: 'start' }}
                    >
                        <PromoCard promo={promo} places={promo.places} />
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

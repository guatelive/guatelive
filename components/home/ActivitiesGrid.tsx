'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import type { DbActivity } from '@/lib/types';
import { eventLocation } from '@/lib/event-display';
import { priceDisplay } from '@/lib/event-display';

// Sticker wall (home v2): cinta adhesiva + tilt 3D en hover — ver
// design_handoff_home_v2/README.md sección 5. Auto-avanza carta por carta como
// el mobile de EventsGrid/PromosCarousel (decisión de Fredy 2026-10-04, antes era
// scroll manual); se pausa con hover/touch y no corre con prefers-reduced-motion.
// Ver ADR-023 en docs/decisions.md para el resto del razonamiento (tabla separada,
// sin scraper).
function rot(id: number, spread: number) {
    return ((id * 41) % (spread * 2 + 1)) - spread;
}

function handleTiltMove(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    const base = el.dataset.baseRotate || '';
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `${base} perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.03)`;
    el.style.boxShadow = '0 20px 40px rgba(0,0,0,0.25)';
    el.style.zIndex = '5';
}

function handleTiltLeave(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.transform = el.dataset.baseRotate || 'none';
    el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
    el.style.zIndex = '1';
}

// Barra de progreso chica debajo del sticker wall (mobile) — mismo mecanismo que
// BubbleScrollRow en bubble-search.tsx, para avisar que se puede seguir deslizando.
function useScrollThumb() {
    const ref = useRef<HTMLDivElement>(null);
    const [thumb, setThumb] = useState({ width: 100, left: 0 });

    const updateThumb = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        if (scrollWidth <= clientWidth) {
            setThumb({ width: 100, left: 0 });
            return;
        }
        const width = (clientWidth / scrollWidth) * 100;
        const maxScroll = scrollWidth - clientWidth;
        const left = (scrollLeft / maxScroll) * (100 - width);
        setThumb({ width, left });
    }, []);

    return { ref, thumb, updateThumb };
}

const DURATION = 4000;

// Posición de scroll de la carta `index` dentro del carrusel. Relativa a la primera
// carta: el contenedor no es offsetParent, así que offsetLeft solo no alcanza.
function cardScrollLeft(container: HTMLElement, index: number) {
    const first = container.children[0] as HTMLElement | undefined;
    const card = container.children[index] as HTMLElement | undefined;
    if (!first || !card) return null;
    return card.offsetLeft - first.offsetLeft;
}

// Índice de la carta más cercana al borde izquierdo del contenedor (para retomar
// el auto-avance desde donde el usuario dejó el scroll manual).
function nearestCardIndex(container: HTMLElement, count: number) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < count; i++) {
        const left = cardScrollLeft(container, i);
        if (left === null) break;
        const dist = Math.abs(left - container.scrollLeft);
        if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
}

export function ActivitiesGrid({ activities }: { activities: DbActivity[] }) {
    const { ref: scrollRef, thumb, updateThumb } = useScrollThumb();
    const indexRef = useRef(0);
    const pausedRef = useRef(false);

    useEffect(() => {
        updateThumb();
        window.addEventListener('resize', updateThumb);
        return () => window.removeEventListener('resize', updateThumb);
    }, [updateThumb, activities]);

    // Auto-avance: cada DURATION ms desliza a la siguiente actividad y vuelve a la
    // primera al final. scrollTo sobre el contenedor (no scrollIntoView) para nunca
    // mover el scroll vertical de la página. Pausado (hover/touch) se salta el tick.
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = setInterval(() => {
            const container = scrollRef.current;
            const count = activities.length;
            if (!container || pausedRef.current || count < 2) return;
            if (container.scrollWidth <= container.clientWidth) return;
            const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 4;
            const next = atEnd ? 0 : (indexRef.current + 1) % count;
            const left = cardScrollLeft(container, next);
            if (left !== null) container.scrollTo({ left, behavior: 'smooth' });
            indexRef.current = next;
        }, DURATION);
        return () => clearInterval(id);
    }, [activities.length, scrollRef]);

    function pause() {
        pausedRef.current = true;
    }

    // Al soltar, retoma desde la carta donde el usuario dejó el scroll manual.
    function resume() {
        pausedRef.current = false;
        const container = scrollRef.current;
        if (container) indexRef.current = nearestCardIndex(container, activities.length);
    }

    if (activities.length === 0) return null;

    return (
        <section className="mx-auto mt-2 max-w-[1400px] px-6 md:px-10">
            {/* ── Header ── */}
            <div style={{ paddingTop: '0.85rem', paddingBottom: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{
                            fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                            color: '#E11D2E', letterSpacing: '0.25em', textTransform: 'uppercase',
                        }}>
                            ACTIVIDADES
                        </p>
                        <div style={{ width: 28, height: 2, backgroundColor: '#E11D2E', marginTop: 6 }} />
                    </div>
                    <Link
                        href="/actividades"
                        style={{
                            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                            color: '#E11D2E', letterSpacing: '0.02em', textDecoration: 'none',
                            whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                    >
                        Ver más →
                    </Link>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666666', marginTop: 8 }}>
                    Planes que siempre están ahí, para cuando se te antoje.
                </p>
            </div>

            {/* ── Sticker wall ── */}
            <div
                ref={scrollRef}
                onScroll={updateThumb}
                onMouseEnter={pause}
                onMouseLeave={resume}
                onTouchStart={pause}
                onTouchEnd={resume}
                className="no-scrollbar"
                style={{
                    display: 'flex', gap: 24, overflowX: 'auto',
                    alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16,
                }}
            >
                {activities.map(activity => {
                    const baseRotate = rot(activity.id.charCodeAt(0) + activity.id.length, 3);
                    const price = priceDisplay(activity);
                    const location = eventLocation(activity);
                    const meta = [activity.recurrence_text, location].filter(Boolean).join(' · ');
                    return (
                        <Link
                            key={activity.id}
                            href={`/actividad/${activity.slug}`}
                            data-base-rotate={`rotate(${baseRotate}deg)`}
                            onMouseMove={handleTiltMove}
                            onMouseLeave={handleTiltLeave}
                            style={{
                                position: 'relative', width: 290, flexShrink: 0,
                                background: '#fff', border: '1px solid #eee', borderRadius: 4,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                                transform: `rotate(${baseRotate}deg)`,
                                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                textDecoration: 'none', display: 'block',
                            }}
                        >
                            {/* Cinta adhesiva */}
                            <div style={{
                                position: 'absolute', top: -10, left: '50%',
                                transform: 'translateX(-50%) rotate(-3deg)',
                                width: 56, height: 20, background: 'rgba(200,230,78,0.85)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            }} />

                            <div style={{ padding: '10px 10px 0', position: 'relative', height: 190 }}>
                                {activity.image_url ? (
                                    <ImageWithSkeleton
                                        src={activity.image_url}
                                        alt={activity.title}
                                        fill
                                        sizes="290px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#F4F4F4' }} />
                                )}
                            </div>

                            <div style={{ padding: '12px 14px 16px' }}>
                                <div
                                    className="line-clamp-2"
                                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 4, color: '#111111' }}
                                >
                                    {activity.title}
                                </div>
                                {meta && (
                                    <div className="line-clamp-1" style={{ color: '#777777', fontSize: 12, marginBottom: 6 }}>
                                        {meta}
                                    </div>
                                )}
                                {price.kind !== 'unknown' && (
                                    <div style={{ color: '#E11D2E', fontWeight: 800, fontSize: 14 }}>
                                        {price.kind === 'free' ? 'Gratis' : price.label}
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}

                {/* Placeholder de próxima actividad */}
                <div style={{ width: 290, height: 260, flexShrink: 0 }}>
                    <div style={{
                        border: '2px dashed #d0d0d0', borderRadius: 4, height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#b0b0b0', fontSize: 13, textAlign: 'center', padding: 16,
                    }}>
                        + Próxima actividad
                    </div>
                </div>
            </div>

            {/* Barra de progreso mobile: indica que se puede seguir deslizando */}
            <div className="bubble-scroll-track mobile-only">
                <div className="bubble-scroll-thumb" style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }} />
            </div>
        </section>
    );
}

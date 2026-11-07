'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ActivityCard, handleTiltLeave, handleTiltMove } from '@/components/cards/activity-card';
import { useCarouselTakeover } from '@/hooks/use-carousel-takeover';
import type { DbActivity } from '@/lib/types';

// Sticker wall (home v2): cinta adhesiva + tilt 3D en hover — ver
// design_handoff_home_v2/README.md sección 5. Auto-avanza carta por carta como
// el mobile de EventsGrid/PromosCarousel (decisión de Fredy 2026-10-04, antes era
// scroll manual). El hover en desktop solo pausa; en cuanto el usuario lo mueve a
// mano (touch, click/arrastre, rueda horizontal) el auto-avance se apaga para siempre
// — antes retomaba al soltar y volvía a la carta 1 al llegar al final, arrancándole
// el carrusel al usuario (feedback beta 2026-10-19, ver hooks/use-carousel-takeover.ts).
// No corre con prefers-reduced-motion. Ver ADR-023 en docs/decisions.md para el resto
// del razonamiento (tabla separada, sin scraper).

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

// El ref del hook alcanza: el intervalo lo lee en cada tick, no hace falta callback.
function noop() {}

// Posición de scroll de la carta `index` dentro del carrusel. Relativa a la primera
// carta: el contenedor no es offsetParent, así que offsetLeft solo no alcanza.
function cardScrollLeft(container: HTMLElement, index: number) {
    const first = container.children[0] as HTMLElement | undefined;
    const card = container.children[index] as HTMLElement | undefined;
    if (!first || !card) return null;
    return card.offsetLeft - first.offsetLeft;
}

export function ActivitiesGrid({ activities }: { activities: DbActivity[] }) {
    const { ref: scrollRef, thumb, updateThumb } = useScrollThumb();
    const indexRef = useRef(0);
    const pausedRef = useRef(false);
    const { tookControlRef, takeoverHandlers } = useCarouselTakeover(noop);

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
            // +1: la última parada es la carta de "Ver todas".
            const count = activities.length + 1;
            if (!container || pausedRef.current || tookControlRef.current) return;
            if (container.scrollWidth <= container.clientWidth) return;
            const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 4;
            const next = atEnd ? 0 : (indexRef.current + 1) % count;
            const left = cardScrollLeft(container, next);
            if (left !== null) container.scrollTo({ left, behavior: 'smooth' });
            indexRef.current = next;
        }, DURATION);
        return () => clearInterval(id);
    }, [activities.length, scrollRef, tookControlRef]);

    // Hover en desktop: solo pausa (el mouse encima no es "tomar el control").
    function pause() {
        pausedRef.current = true;
    }

    function resume() {
        pausedRef.current = false;
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
                        Ver todas →
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
                {...takeoverHandlers}
                className="no-scrollbar"
                style={{
                    display: 'flex', gap: 24, overflowX: 'auto',
                    alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16,
                }}
            >
                {activities.map(activity => <ActivityCard key={activity.id} activity={activity} width={290} />)}

                {/* Cierre del carrusel: lleva al listado completo */}
                <Link
                    href="/actividades"
                    data-base-rotate="rotate(2deg)"
                    onMouseMove={handleTiltMove}
                    onMouseLeave={handleTiltLeave}
                    style={{
                        position: 'relative', width: 290, flexShrink: 0, alignSelf: 'stretch',
                        background: '#E11D2E', borderRadius: 4,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        transform: 'rotate(2deg)',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                        textDecoration: 'none', padding: 24,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 8, textAlign: 'center', color: '#FFFFFF',
                    }}
                >
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, lineHeight: 1.15 }}>
                        Ver todas las actividades
                    </span>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>→</span>
                </Link>
            </div>

            {/* Barra de progreso mobile: indica que se puede seguir deslizando */}
            <div className="bubble-scroll-track mobile-only">
                <div className="bubble-scroll-thumb" style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }} />
            </div>
        </section>
    );
}

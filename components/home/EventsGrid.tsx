'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DbEvent } from '@/lib/types';
import { getCategoryStyle, formatEventDateTime, eventLocation } from '@/lib/event-display';

const DURATION = 4000;
const TRANSITION_MS = 350;
const PER_PAGE = 5;

function useIsDesktop() {
    return useSyncExternalStore(
        cb => {
            const mq = window.matchMedia('(min-width: 768px)');
            mq.addEventListener('change', cb);
            return () => mq.removeEventListener('change', cb);
        },
        () => window.matchMedia('(min-width: 768px)').matches,
        () => false,
    );
}

// ─── Cards ─────────────────────────────────────────────────────────────────

function GratisBadge({ dark, size }: { dark: boolean; size: number }) {
    return (
        <span style={{
            background: dark ? '#1a3a1a' : '#EFF4E8',
            color: dark ? '#6bcb6b' : '#4A6B22',
            padding: dark ? '3px 8px' : '2px 6px',
            borderRadius: dark ? 20 : 3,
            fontSize: size,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
            display: 'inline-block',
        }}>
            GRATIS
        </span>
    );
}

function MainCard({ event }: { event: DbEvent | null }) {
    if (!event) return <div />;
    const style = getCategoryStyle(event.category);
    const location = eventLocation(event);
    return (
        <Link href={`/evento/${event.slug}`} style={{
            display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
            borderRadius: 10, background: '#1A1A1A',
            width: '100%', height: '100%', minHeight: 370, textDecoration: 'none',
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: style.bar, zIndex: 3 }} />
            <div style={{ position: 'relative', overflow: 'hidden', height: 320, background: '#242424', flexShrink: 0 }}>
                {event.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <span style={{
                    position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 3,
                    background: style.pillBg, color: style.pillText,
                    fontSize: 12, fontWeight: 600, borderRadius: 999, padding: '4px 11px',
                    textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-sans)',
                }}>
                    {event.category}
                </span>
            </div>
            <div style={{ padding: '1.25rem' }}>
                <h3 style={{
                    fontFamily: 'var(--font-serif)', fontSize: 30, color: '#fff', lineHeight: 1.2,
                    marginBottom: '0.4rem',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {event.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#aaa', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                    {formatEventDateTime(event.date_start)}
                    {location && <><br />📍 {location}</>}
                </p>
                {event.is_free ? (
                    <GratisBadge dark size={11} />
                ) : event.price !== null ? (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#fff' }}>
                        Q{event.price}
                    </p>
                ) : null}
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#E11D2E', marginTop: '0.5rem' }}>
                    Ver detalles →
                </p>
            </div>
        </Link>
    );
}

function MediaCard({ event }: { event: DbEvent | null }) {
    if (!event) return <div />;
    const style = getCategoryStyle(event.category);
    const location = eventLocation(event);
    return (
        <Link href={`/evento/${event.slug}`} style={{
            display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
            borderRadius: 8, background: '#1A1A1A',
            width: '100%', height: '100%', minHeight: 180, textDecoration: 'none',
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: style.bar, zIndex: 3 }} />
            <div style={{ position: 'relative', overflow: 'hidden', flex: '1 1 0%', minHeight: 90, background: '#242424' }}>
                {event.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <span style={{
                    position: 'absolute', top: '0.55rem', left: '0.55rem', zIndex: 3,
                    background: style.pillBg, color: style.pillText,
                    fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '3px 9px',
                    textTransform: 'uppercase', fontFamily: 'var(--font-sans)',
                }}>
                    {event.category}
                </span>
                {event.is_free && (
                    <span style={{ position: 'absolute', top: '0.55rem', right: '0.55rem', zIndex: 3 }}>
                        <GratisBadge dark size={10} />
                    </span>
                )}
            </div>
            <div style={{ padding: '0.85rem 0.95rem', flexShrink: 0 }}>
                <h3 style={{
                    fontFamily: 'var(--font-serif)', fontSize: 18, color: '#fff', lineHeight: 1.2, marginBottom: 4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {event.title}
                </h3>
                <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: 12, color: '#aaa', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {formatEventDateTime(event.date_start)}{location ? ` · 📍 ${location}` : ''}
                </p>
                {!event.is_free && event.price !== null && (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                        Q{event.price}
                    </p>
                )}
            </div>
        </Link>
    );
}

function SmallCard({ event }: { event: DbEvent | null }) {
    if (!event) return <div />;
    const style = getCategoryStyle(event.category);
    const location = eventLocation(event);
    return (
        <Link href={`/evento/${event.slug}`} className="event-small-card" style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            borderRadius: 8, border: '0.5px solid #E5E5E5', background: '#FAFAFA',
            padding: '0.85rem 0.95rem', width: '100%', height: '100%', minHeight: 180,
            textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s ease',
        }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {event.category}
                    </span>
                </div>
                <h3 style={{
                    fontFamily: 'var(--font-serif)', fontSize: 18, color: '#0A0A0A', lineHeight: 1.25,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {event.title}
                </h3>
            </div>
            <div style={{ marginTop: 'auto' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666666', lineHeight: 1.5, marginBottom: 4 }}>
                    {formatEventDateTime(event.date_start)}
                    {location && <><br />📍 {location}</>}
                </p>
                {event.is_free ? (
                    <GratisBadge dark={false} size={10} />
                ) : event.price !== null ? (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
                        Q{event.price}
                    </p>
                ) : null}
            </div>
        </Link>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EventsGrid({ events }: { events: DbEvent[] }) {
    const isDesktop = useIsDesktop();
    const numPages = Math.max(1, Math.ceil(events.length / PER_PAGE));

    // Desktop: avanza por páginas de 5 (fade). Mobile: avanza carta por carta (scroll horizontal).
    const [page, setPage] = useState(0);
    const [mobileIndex, setMobileIndex] = useState(0);
    // Clamp derivado (en vez de un efecto) para cuando numPages/events se achican, ej. resize de viewport
    const activePage = Math.min(page, numPages - 1);
    const activeMobileIndex = events.length > 0 ? Math.min(mobileIndex, events.length - 1) : 0;
    const navCount = isDesktop ? numPages : events.length;
    const navIndex = isDesktop ? activePage : activeMobileIndex;
    const [visible, setVisible] = useState(true);

    const footerProgressRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pageStartRef = useRef(0);
    const pauseStartRef = useRef<number | null>(null);
    const isPausedRef = useRef(false);

    // RAF — actualiza la barra de progreso directamente (sin React state)
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

    // Desliza el carrousel mobile para que la card en `index` quede al inicio (mueve a la derecha)
    // Usa scrollTo sobre el contenedor (no scrollIntoView) para nunca afectar el scroll vertical
    // de la página cuando el carrousel está fuera del viewport.
    const scrollToCard = useCallback((index: number) => {
        const container = carouselRef.current;
        const card = container?.children[index] as HTMLElement | undefined;
        if (!container || !card) return;
        container.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    }, []);

    const doAdvance = useCallback(() => {
        if (isDesktop) {
            setVisible(false);
            setTimeout(() => {
                setPage(p => (p + 1) % numPages);
                setVisible(true);
            }, TRANSITION_MS / 2);
        } else {
            setMobileIndex(i => {
                const len = events.length || 1;
                const next = (i + 1) % len;
                scrollToCard(next);
                return next;
            });
        }
    }, [isDesktop, numPages, events.length, scrollToCard]);

    const startTimer = useCallback((remaining = DURATION) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        pageStartRef.current = performance.now() - (DURATION - remaining);
        if (remaining === DURATION) {
            if (footerProgressRef.current) footerProgressRef.current.style.width = '0%';
        }
        timerRef.current = setTimeout(() => doAdvance(), remaining);
    }, [doAdvance]);

    // Reinicia el timer cada vez que cambia la página (desktop) o la card activa (mobile)
    useEffect(() => {
        startTimer();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [navIndex, startTimer]);

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
        if (isDesktop) {
            setVisible(false);
            setTimeout(() => {
                setPage(idx % numPages);
                setVisible(true);
            }, TRANSITION_MS / 2);
        } else {
            const clamped = Math.max(0, Math.min(idx, events.length - 1));
            setMobileIndex(clamped);
            scrollToCard(clamped);
        }
    }

    const start = activePage * PER_PAGE;
    const pageEvents = events.slice(start, start + PER_PAGE);
    const [main, media1, media2, small1, small2] = pageEvents;
    const hasSmallColumn = Boolean(small1 || small2);

    if (events.length === 0) return null;

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
                        EVENTOS
                    </p>
                    <div style={{ width: 28, height: 2, backgroundColor: '#E11D2E', marginTop: 6 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link
                        href="/buscar?tipo=eventos"
                        style={{
                            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                            color: '#E11D2E', letterSpacing: '0.02em', textDecoration: 'none',
                        }}
                    >
                        Ver todos →
                    </Link>
                    {navCount > 1 && (
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                onClick={() => goTo((navIndex - 1 + navCount) % navCount)}
                                aria-label="Anterior"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 26, height: 26, borderRadius: '50%',
                                    border: '1.5px solid #D4D4D4', background: '#fff', cursor: 'pointer',
                                }}
                            >
                                <ChevronLeft size={14} color="#0A0A0A" />
                            </button>
                            <button
                                onClick={() => goTo((navIndex + 1) % navCount)}
                                aria-label="Siguiente"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 26, height: 26, borderRadius: '50%',
                                    border: '1.5px solid #D4D4D4', background: '#fff', cursor: 'pointer',
                                }}
                            >
                                <ChevronRight size={14} color="#0A0A0A" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Layout de eventos ── */}
            <div
                className="eventos-layout"
                onMouseEnter={isDesktop ? handleMouseEnter : undefined}
                onMouseLeave={isDesktop ? handleMouseLeave : undefined}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(8px)',
                    transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
                }}
            >
                {isDesktop ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: hasSmallColumn ? '1.5fr 1fr 1fr' : '1.5fr 1fr',
                        gridTemplateRows: 'auto auto',
                        gap: '0.65rem',
                    }}>
                        <div style={{ gridColumn: 1, gridRow: '1 / 3' }}>
                            <MainCard event={main ?? null} />
                        </div>
                        <div style={{ gridColumn: 2, gridRow: 1 }}>
                            <MediaCard event={media1 ?? null} />
                        </div>
                        {hasSmallColumn && (
                            <div style={{ gridColumn: 3, gridRow: 1 }}>
                                <SmallCard event={small1 ?? null} />
                            </div>
                        )}
                        <div style={{ gridColumn: 2, gridRow: 2 }}>
                            <MediaCard event={media2 ?? null} />
                        </div>
                        {hasSmallColumn && (
                            <div style={{ gridColumn: 3, gridRow: 2 }}>
                                <SmallCard event={small2 ?? null} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        ref={carouselRef}
                        className="no-scrollbar"
                        style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 2 }}
                    >
                        {events.map(ev => (
                            <div
                                key={ev.id}
                                style={{ width: '78vw', maxWidth: 320, height: 280, flexShrink: 0, scrollSnapAlign: 'start' }}
                            >
                                <MediaCard event={ev} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                paddingTop: '0.55rem', paddingBottom: '0.9rem',
            }}>
                {navCount > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {Array.from({ length: navCount }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                aria-label={`Ir a ${i + 1}`}
                                style={{
                                    padding: 0,
                                    border: 'none',
                                    background: i === navIndex ? '#E11D2E' : '#D4D4D4',
                                    borderRadius: i === navIndex ? 2 : '50%',
                                    width: i === navIndex ? 14 : 5,
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
                    {navIndex + 1} / {navCount}
                </span>
            </div>
        </section>
    );
}

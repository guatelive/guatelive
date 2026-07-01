'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { DbEvent } from '@/lib/types';

const DURATION = 4000;

const CAT_COLOR: Record<string, string> = {
    'Aventura':       '#4A8A4A',
    'Vida Nocturna':  '#E11D2E',
    'Gastronomía':    '#E8A020',
    'Familiar':       '#185FA5',
    'Cultura':        '#7040C0',
    'Música':         '#E11D2E',
    'Concierto':      '#E11D2E',
};


function catColor(cat: string): string {
    const k = Object.keys(CAT_COLOR).find(k => cat.toLowerCase().includes(k.toLowerCase()));
    return k ? CAT_COLOR[k] : '#666666';
}


const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatMeta(dateStart: string, zone: string, venueName?: string | null): string {
    if (!dateStart) return zone || '';
    try {
        const [datePart, timePart = ''] = dateStart.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const [h = '00', mn = '00'] = timePart.split(':');
        const dateStr = `${DAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]}`;
        const timeStr = `${h.padStart(2, '0')}:${mn.padStart(2, '0')}`;
        return [dateStr, timeStr, venueName || zone].filter(Boolean).join(' · ');
    } catch {
        return zone || '';
    }
}

export function EventHeroPanel({ events }: { events: DbEvent[] }) {
    const [idx, setIdx]         = useState(0);
    const [visible, setVisible] = useState(true);
    const [timerKey, setTimerKey] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);
    const rafRef      = useRef<number | null>(null);
    const startRef    = useRef(0);

    // Auto-advance
    useEffect(() => {
        if (events.length <= 1) return;
        const id = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIdx(p => (p + 1) % events.length);
                setVisible(true);
            }, 250);
        }, DURATION);
        return () => clearInterval(id);
    }, [events.length, timerKey]);

    // Progress bar via RAF
    useEffect(() => {
        if (events.length === 0) return;
        startRef.current = performance.now();
        if (progressRef.current) progressRef.current.style.width = '0%';

        function tick() {
            const pct = Math.min(((performance.now() - startRef.current) / DURATION) * 100, 100);
            if (progressRef.current) progressRef.current.style.width = `${pct}%`;
            rafRef.current = requestAnimationFrame(tick);
        }
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [events.length, idx]);

    function goTo(i: number) {
        setVisible(false);
        setTimeout(() => {
            setIdx(i);
            setVisible(true);
            setTimerKey(k => k + 1);
        }, 250);
    }

    if (events.length === 0) return null;

    const ev    = events[idx];
    const color = catColor(ev.category);
    const free  = ev.price === null || ev.price === 0;

    // 3 mini cards: los siguientes eventos que no son el destacado actual
    const miniEvents = events.filter((_, i) => i !== idx).slice(0, 3);

    return (
        <div style={{
            background: '#0A0A0A',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 360,
            overflow: 'hidden',
        }}>
            {/* Category color bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 3, background: color, zIndex: 2,
                transition: 'background 0.5s ease',
            }} />

            {/* Background image + gradient */}
            {ev.image_url && (
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={ev.image_url}
                        alt=""
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            opacity: visible ? 0.18 : 0,
                            transition: 'opacity 0.5s ease',
                        }}
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, #0A0A0A 50%, rgba(10,10,10,0.55) 100%)',
                    }} />
                </div>
            )}

            {/* Label */}
            <div style={{ position: 'relative', zIndex: 3, padding: '16px 20px 0' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#E11D2E', opacity: 0.6 }} />
                        <span style={{ position: 'relative', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#E11D2E', display: 'inline-block' }} />
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: '#E11D2E', textTransform: 'uppercase' }}>
                        ESTA SEMANA EN GUATE
                    </span>
                </div>
            </div>

            {/* Featured event — fade + slide */}
            <div style={{
                position: 'relative', zIndex: 3,
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: '12px 20px 10px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.45s ease, transform 0.45s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {ev.category}{ev.zone ? ` · ${ev.zone}` : ''}
                    </span>
                </div>

                <h2 style={{
                    fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700,
                    color: '#fff', lineHeight: 1.15, marginBottom: 7,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {ev.title}
                </h2>

                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888', lineHeight: 1.6, marginBottom: 8 }}>
                    {formatMeta(ev.date_start, ev.zone, ev.venue_name)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {free ? (
                        <span style={{ background: '#1a3a1a', color: '#6bcb6b', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                            GRATIS
                        </span>
                    ) : (
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                            Q{ev.price}
                        </span>
                    )}
                    <Link href={`/evento/${ev.slug}`} style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#E11D2E', textDecoration: 'none' }}>
                        Ver detalles →
                    </Link>
                </div>
            </div>

            {/* Mini event cards */}
            {miniEvents.length > 0 && (
                <div style={{
                    position: 'relative', zIndex: 3,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${miniEvents.length}, 1fr)`,
                    gap: 6,
                    padding: '10px 20px 6px',
                    borderTop: '1px solid #1a1a1a',
                }}>
                    {miniEvents.map((me) => {
                        const mc = catColor(me.category);
                        return (
                            <Link
                                key={me.id}
                                href={`/evento/${me.slug}`}
                                style={{ textDecoration: 'none', display: 'block' }}
                            >
                                <div style={{
                                    background: '#111',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    borderTop: `2px solid ${mc}`,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '#111')}
                                >
                                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: mc, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 600 }}>
                                        {me.category}
                                    </p>
                                    <p style={{
                                        fontFamily: 'var(--font-serif)', fontSize: 12, color: '#fff',
                                        lineHeight: 1.25, marginBottom: 4,
                                        display: '-webkit-box', WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {me.title}
                                    </p>
                                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#666' }}>
                                        {formatMeta(me.date_start, me.zone, null).split(' · ').slice(0, 2).join(' · ')}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Dots + progress bar */}
            <div style={{ position: 'relative', zIndex: 3, padding: '6px 20px 14px' }}>
                {events.length > 1 && (
                    <div style={{ display: 'flex', gap: 5, marginBottom: 8, alignItems: 'center' }}>
                        {events.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                aria-label={`Evento ${i + 1}`}
                                style={{
                                    padding: 0, border: 'none', cursor: 'pointer',
                                    background: i === idx ? '#E11D2E' : '#444',
                                    borderRadius: i === idx ? 2 : '50%',
                                    width: i === idx ? 14 : 5, height: 5,
                                    transition: 'all 0.2s ease', flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                )}
                <div style={{ height: 1.5, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                    <div ref={progressRef} style={{ height: '100%', background: '#E11D2E', width: '0%', borderRadius: 2 }} />
                </div>
            </div>
        </div>
    );
}

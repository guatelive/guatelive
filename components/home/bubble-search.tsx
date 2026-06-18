'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { VisitCounter } from '@/components/home/VisitCounter';
import {
    normalizeHours,
    openStatusForSelection,
    guatNow,
    type OpenStatus,
} from '@/lib/hours-utils';

type Place = {
    id: string;
    slug: string;
    name: string;
    zone: string | null;
    rating?: number | null;
    rating_count?: number | null;
    primary_category?: string | null;
    primary_photo_url?: string | null;
    tags?: string[] | null;
    hours?: unknown;
};

const TAG_MAP: Record<string, string[]> = {
    Cenar: ['cena-romantica', 'date-night', 'restaurante', 'almuerzo'],
    'Tomar algo': ['bar', 'bar-completo', 'cocteleria-de-autor', 'cerveza-artesanal'],
    'Desayuno o brunch': ['desayuno', 'brunch', 'cafe', 'desayuno-todo-el-dia', 'abierto-temprano'],
    Trabajar: ['para-trabajar', 'laptop-friendly', 'cafe-especialidad', 'reunion-de-negocios'],
    'Salir de fiesta': ['salir-de-fiesta', 'noche', 'night_club', 'after-office', 'musica-en-vivo'],
    'Ir con mi perro': ['al-aire-libre', 'tranquilo', 'acogedor', 'casual'],
    'Plan familiar': ['familia', 'ninos', 'domingo-en-familia', 'grupos-grandes'],
};

const ACTIVITIES: { label: string; key: string; special?: boolean }[] = [
    { label: '🍽 Cenar', key: 'Cenar' },
    { label: '☕ Tomar algo', key: 'Tomar algo' },
    { label: '🌅 Desayuno o brunch', key: 'Desayuno o brunch' },
    { label: '💻 Trabajar', key: 'Trabajar' },
    { label: '🎉 Salir de fiesta', key: 'Salir de fiesta' },
    { label: '🐶 Ir con mi perro', key: 'Ir con mi perro' },
    { label: '👨‍👩‍👧 Plan familiar', key: 'Plan familiar' },
    { label: '✨ Sorprendeme', key: 'Sorprendeme', special: true },
];

type ZoneOption = { label: string; value: string };

const WHEN: { label: string; value: string }[] = [
    { label: '🌞 Hoy',               value: 'today' },
    { label: '🌙 Esta noche',        value: 'tonight' },
    { label: '☀️ Mañana',            value: 'tomorrow' },
    { label: '📅 Este fin de semana', value: 'weekend' },
    { label: '🕐 Cuando sea',        value: 'anytime' },
];

const STEP_TITLE: Record<1 | 2 | 3, string> = {
    1: '¿Qué querés hacer?',
    2: '¿En qué zona?',
    3: '¿Cuándo?',
};

export function BubbleSearch() {
    // ── Text search ──
    const [searchQuery, setSearchQuery] = useState('');
    const [allPlaces, setAllPlaces] = useState<Place[]>([]);
    const [inputFocused, setInputFocused] = useState(false);
    const [nudgeKey, setNudgeKey] = useState(0);

    // ── Zonas dinámicas desde la DB ──
    const [zones, setZones] = useState<ZoneOption[]>([]);
    useEffect(() => {
        fetch('/api/zones')
            .then(r => r.json())
            .then((data: { zone: string; count: number }[]) => {
                const opts: ZoneOption[] = data.map(({ zone }) => ({ label: zone, value: zone }));
                opts.push({ label: 'En cualquier lugar', value: 'all' });
                setZones(opts);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (searchQuery && allPlaces.length === 0) {
            fetch('/api/places')
                .then(r => r.json())
                .then((data: Place[]) => setAllPlaces(data))
                .catch(console.error);
        }
    }, [searchQuery, allPlaces.length]);

    const textResults = useMemo<Place[] | null>(() => {
        if (!searchQuery) return null;
        const normalize = (s: string) =>
            s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const q = normalize(searchQuery);
        return allPlaces.filter(p =>
            normalize(p.name).includes(q) ||
            normalize(p.zone ?? '').includes(q) ||
            p.tags?.some(t => normalize(t).includes(q))
        );
    }, [allPlaces, searchQuery]);

    // ── Bubble flow ──
    const prefetchRef = useRef<Promise<Place[]> | null>(null);
    const [bubbleStep, setBubbleStep] = useState<1 | 2 | 3>(1);
    const [activity, setActivity] = useState<string | null>(null);
    const [isSurprise, setIsSurprise] = useState(false);
    const [zone, setZone] = useState<string | null>(null);
    const [bubbleResults, setBubbleResults] = useState<Place[] | null>(null);
    const [loadingBubble, setLoadingBubble] = useState(false);
    const [zoneFallback, setZoneFallback] = useState(false);
    const [when, setWhen] = useState<string | null>(null);
    function handleFocus() {
        setInputFocused(true);
        if (bubbleStep === 1 && !searchQuery) {
            // Incrementar key fuerza re-mount → CSS animation se reproduce desde cero
            setNudgeKey(k => k + 1);
        }
    }

    function pickActivity(key: string, special = false) {
        setActivity(key);
        setIsSurprise(special);
        setBubbleStep(2);
        if (!special) {
            // Prefetch while user goes through steps 2 and 3 (~5–10 s)
            const tags = TAG_MAP[key] ?? [];
            const params = new URLSearchParams({ preload: 'true' });
            if (tags.length > 0) params.set('tags', tags.join(','));
            prefetchRef.current = fetch(`/api/places/bubble?${params}`)
                .then(r => r.json() as Promise<Place[]>)
                .catch(() => []);
        } else {
            prefetchRef.current = null;
        }
    }

    function pickZone(value: string) {
        setZone(value);
        setBubbleStep(3);
    }

    async function pickWhen(selectedWhen: string) {
        setWhen(selectedWhen);
        setLoadingBubble(true);
        setZoneFallback(false);
        const tags = isSurprise ? [] : (TAG_MAP[activity ?? ''] ?? []);
        const hasZone = zone && zone !== 'all';

        async function fetchFresh(withZone: boolean): Promise<Place[]> {
            const params = new URLSearchParams();
            if (isSurprise) params.set('surprise', 'true');
            else params.set('tags', tags.join(','));
            if (withZone && hasZone) params.set('zone', zone!);
            const res = await fetch(`/api/places/bubble?${params}`);
            return res.json();
        }

        function sortByWhen(places: Place[]): Place[] {
            if (selectedWhen === 'anytime') return places;
            const now = guatNow();
            return [...places].sort((a, b) => {
                const aStatus = openStatusForSelection(normalizeHours(a.hours), selectedWhen, now);
                const bStatus = openStatusForSelection(normalizeHours(b.hours), selectedWhen, now);
                // open y unknown van primero, closed al final
                const score = (s: OpenStatus) => s === 'open' ? 2 : s === 'unknown' ? 1 : 0;
                const diff = score(bStatus) - score(aStatus);
                if (diff !== 0) return diff;
                return (b.rating ?? 0) - (a.rating ?? 0);
            });
        }

        try {
            let data: Place[];
            // For non-surprise: try the speculative prefetch first (likely already resolved)
            const prefetched = !isSurprise && prefetchRef.current !== null
                ? await prefetchRef.current
                : null;

            if (prefetched && prefetched.length > 0) {
                if (!hasZone) {
                    data = prefetched;
                } else {
                    const zoneFiltered = prefetched.filter(p => p.zone === zone);
                    if (zoneFiltered.length === 0) {
                        setZoneFallback(true);
                        data = prefetched;
                    } else {
                        data = zoneFiltered;
                    }
                }
            } else {
                // Surprise mode or prefetch failed → regular sequential calls
                data = await fetchFresh(true);
                if (data.length === 0 && hasZone) {
                    data = await fetchFresh(false);
                    setZoneFallback(true);
                }
            }
            setBubbleResults(sortByWhen(data));
        } catch {
            setBubbleResults([]);
        } finally {
            setLoadingBubble(false);
        }
    }

    function bubbleBack() {
        if (bubbleStep === 2) { setBubbleStep(1); setActivity(null); setIsSurprise(false); }
        else if (bubbleStep === 3) { setBubbleStep(2); setZone(null); }
    }

    function resetBubble() {
        setBubbleResults(null);
        setBubbleStep(1);
        setActivity(null);
        setIsSurprise(false);
        setZone(null);
        setWhen(null);
        setLoadingBubble(false);
        setZoneFallback(false);
        prefetchRef.current = null;
    }

    const showBubbleFlow = !searchQuery && bubbleResults === null && !loadingBubble;

    return (
        <div>
            {/* ── Hero + buscador ── */}
            <section style={{ padding: '56px 24px 32px', textAlign: 'center' }}>
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                    <h1
                        className="font-serif"
                        style={{
                            fontSize: 'clamp(1.75rem, 4.5vw, 3.25rem)',
                            lineHeight: 1.1,
                            color: '#0A0A0A',
                            marginBottom: '12px',
                        }}
                    >
                        Todo lo que pasa en Guate,{' '}
                        <em style={{ color: '#E11D2E', fontStyle: 'italic' }}>en un solo lugar.</em>
                    </h1>
                    <p style={{ fontSize: '1rem', color: '#666666', marginTop: '8px' }}>
                        Los mejores cafés y restaurantes de Guate — curados a mano, sin publicidad ni algoritmos.
                    </p>
                    <div style={{ marginTop: '10px' }}>
                        <VisitCounter />
                    </div>

                    {/* Input */}
                    <div style={{ marginTop: '28px' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                borderRadius: '999px',
                                border: `1.5px solid ${inputFocused ? '#0A0A0A' : '#E5E5E5'}`,
                                backgroundColor: '#ffffff',
                                padding: '14px 24px',
                                boxShadow: inputFocused ? '0 0 0 3px rgba(10,10,10,0.06)' : '0 1px 4px rgba(0,0,0,0.06)',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                            }}
                        >
                            <Search style={{ width: '18px', height: '18px', color: '#999999', flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Busca cafés, restaurantes, eventos…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={handleFocus}
                                onBlur={() => setInputFocused(false)}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '14px',
                                    color: '#0A0A0A',
                                    backgroundColor: 'transparent',
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#999999',
                                        fontSize: '20px',
                                        lineHeight: 1,
                                        padding: '0',
                                        flexShrink: 0,
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Resultados de texto ── */}
            {textResults && (
                <section style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 32px 64px' }}>
                    <p style={{ fontSize: '13px', color: '#666666', marginBottom: '24px' }}>
                        {textResults.length} lugar{textResults.length !== 1 ? 'es' : ''} para &ldquo;{searchQuery}&rdquo;
                    </p>
                    {textResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {textResults.map(place => (
                                <Link
                                    key={place.id}
                                    href={`/lugar/${place.slug}`}
                                    className="block hover:opacity-90 transition-opacity"
                                >
                                    <PlaceCard place={place} />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#666666', fontSize: '14px', textAlign: 'center', paddingTop: '32px' }}>
                            No encontramos lugares que coincidan.
                        </p>
                    )}
                </section>
            )}

            {/* ── Bubble flow (solo cuando no hay búsqueda de texto) ── */}
            {showBubbleFlow && (
                <section style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px 56px' }}>
                    {/* ── Progress tracker ── */}
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            {(['¿Qué?', '¿Dónde?', '¿Cuándo?'] as const).map((label, i) => {
                                const stepNum = i + 1;
                                const isCompleted = bubbleStep > stepNum;
                                const isCurrent = bubbleStep === stepNum;
                                return (
                                    <span
                                        key={label}
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: isCurrent ? 700 : 400,
                                            color: isCompleted ? '#0A0A0A' : isCurrent ? '#E11D2E' : '#CCCCCC',
                                            letterSpacing: '0.03em',
                                            transition: 'color 0.3s ease',
                                        }}
                                    >
                                        {label}
                                    </span>
                                );
                            })}
                        </div>
                        <div style={{ height: '2px', background: '#E5E5E5', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    width: `${(bubbleStep / 3) * 100}%`,
                                    background: '#E11D2E',
                                    borderRadius: '999px',
                                    transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            />
                        </div>
                    </div>

                    {bubbleStep > 1 && (
                        <button onClick={bubbleBack} className="bubble-back-btn">
                            ← Volver
                        </button>
                    )}

                    {/* key fuerza re-animación al cambiar de paso */}
                    <div key={bubbleStep} className="bubble-step-content">
                        {bubbleStep > 1 && (
                            <h2
                                className="font-serif"
                                style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '20px', textAlign: 'center' }}
                            >
                                {STEP_TITLE[bubbleStep]}
                            </h2>
                        )}

                        <div
                            key={nudgeKey}
                            className={nudgeKey > 0 ? 'bubble-nudge' : ''}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}
                        >
                            {bubbleStep === 1 && ACTIVITIES.map(({ label, key, special }) => (
                                <button
                                    key={key}
                                    onClick={() => pickActivity(key, special)}
                                    className="bubble-btn"
                                    style={special ? {
                                        backgroundColor: '#E11D2E',
                                        color: '#ffffff',
                                        borderColor: '#E11D2E',
                                    } : undefined}
                                >
                                    {label}
                                </button>
                            ))}

                            {bubbleStep === 2 && zones.map(({ label, value }) => (
                                <button key={value} onClick={() => pickZone(value)} className="bubble-btn">
                                    {label}
                                </button>
                            ))}

                            {bubbleStep === 3 && WHEN.map(({ label, value }) => (
                                <button key={value} onClick={() => pickWhen(value)} className="bubble-btn">
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Loading bubble ── */}
            {loadingBubble && (
                <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <svg
                            className="bubble-loader-wine-glass"
                            viewBox="0 0 24 40"
                            width="60"
                            height="80"
                            fill="none"
                            aria-hidden="true"
                        >
                            <defs>
                                <clipPath id="wineBowlClip">
                                    <path d="M5 2 C5 2 4 14 12 19 C20 14 19 2 19 2 Z" />
                                </clipPath>
                            </defs>
                            <g clipPath="url(#wineBowlClip)">
                                {/* Static wine body — fills ~65% of bowl */}
                                <rect x="0" y="6" width="24" height="16" fill="#8B0010" />
                                {/* Surface wave — wide path with tall crests that travel across */}
                                <path
                                    className="bubble-loader-wine-wave"
                                    d="M-16 6 Q-8 2 0 6 Q8 10 16 6 Q24 2 32 6 Q40 10 48 6 L48 11 Q40 15 32 11 Q24 7 16 11 Q8 15 0 11 Q-8 7 -16 11 Z"
                                    fill="#E11D2E"
                                />
                            </g>
                            {/* Glass outline drawn on top */}
                            <path d="M5 2 C5 2 4 14 12 19 C20 14 19 2 19 2 Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="19" x2="12" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M7 32 Q7 36 12 36 Q17 36 17 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p className="font-serif" style={{ fontSize: '1.1rem', color: '#0A0A0A', marginBottom: '14px' }}>
                        Buscando tus planes...
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <span className="bubble-loader-dot" />
                        <span className="bubble-loader-dot" />
                        <span className="bubble-loader-dot" />
                    </div>
                </div>
            )}

            {/* ── Resultados bubble ── */}
            {!searchQuery && bubbleResults !== null && !loadingBubble && (
                <section style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 32px 64px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <p className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '4px' }}>
                                {isSurprise ? 'Lugares que te van a sorprender' : `Planes para "${activity}"`}
                                {!zoneFallback && zone && zone !== 'all' ? ` · ${zone}` : ''}
                            </p>
                            <p style={{ fontSize: '13px', color: '#666666' }}>
                                {bubbleResults.length} lugar{bubbleResults.length !== 1 ? 'es' : ''} encontrado{bubbleResults.length !== 1 ? 's' : ''}
                                {zoneFallback && zone && zone !== 'all' && (
                                    <span style={{ color: '#E11D2E', marginLeft: '6px' }}>
                                        · Sin resultados en {zone}, mostrando de toda Guatemala
                                    </span>
                                )}
                            </p>
                        </div>
                        <button onClick={resetBubble} className="bubble-reset-btn">
                            Nueva búsqueda
                        </button>
                    </div>

                    {bubbleResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {bubbleResults.map(place => {
                                const openNow: OpenStatus = when
                                    ? openStatusForSelection(normalizeHours(place.hours), when, guatNow())
                                    : 'unknown';
                                return (
                                    <Link
                                        key={place.id}
                                        href={`/lugar/${place.slug}`}
                                        className="block hover:opacity-90 transition-opacity"
                                    >
                                        <PlaceCard place={place} openNow={openNow} />
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <p style={{ color: '#666666', fontSize: '14px', marginBottom: '16px' }}>
                                No encontramos lugares que coincidan. Probá con otra selección.
                            </p>
                            <button onClick={resetBubble} className="bubble-reset-btn">
                                Intentar de nuevo
                            </button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

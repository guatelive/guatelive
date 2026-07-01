'use client';

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { EventCardLink } from '@/components/cards/event-card-link';
import { EventExplorer } from '@/components/home/EventExplorer';
import {
    normalizeHours,
    openStatusForSelection,
    guatNow,
    type OpenStatus,
} from '@/lib/hours-utils';
import { eventMatchesWhen } from '@/lib/event-when';
import type { DbEvent } from '@/lib/types';

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

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

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
    { label: '🌅 Brunch', key: 'Desayuno o brunch' },
    { label: '💻 Trabajar', key: 'Trabajar' },
    { label: '🐶 Con mi perro', key: 'Ir con mi perro' },
    { label: '👨‍👩‍👧 Plan familiar', key: 'Plan familiar' },
    { label: '🎉 Salir de fiesta', key: 'Salir de fiesta' },
    { label: '✨ Sorprendeme', key: 'Sorprendeme', special: true },
];

const EVENT_ACTIVITIES: { label: string; key: string; special?: boolean }[] = [
    { label: '🏃 Deportivo', key: 'Deportes' },
    { label: '🎨 Cultural', key: 'Cultura' },
    { label: '🎵 Concierto', key: 'Música' },
    { label: '🌳 Aventura', key: 'Aventura y Naturaleza' },
    { label: '🍴 Gastronomía', key: 'Gastronomía' },
    { label: '🌙 Vida Nocturna', key: 'Vida Nocturna' },
    { label: '🛠 Talleres', key: 'Talleres' },
    { label: '👨‍👩‍👧 Familiar', key: 'Familiar' },
    { label: '🎟 Cualquier evento', key: 'Otros', special: true },
];

type ZoneOption = { label: string; value: string };

const WHEN: { label: string; value: string }[] = [
    { label: '🌞 Hoy', value: 'today' },
    { label: '🌙 Esta noche', value: 'tonight' },
    { label: '☀️ Mañana', value: 'tomorrow' },
    { label: '📅 Este fin de semana', value: 'weekend' },
    { label: '🕐 Cuando sea', value: 'anytime' },
];

const STEP_TITLE: Record<1 | 2 | 3, string> = {
    1: '¿Qué querés hacer?',
    2: '¿En qué zona?',
    3: '¿Cuándo?',
};

const TABS: { label: string; value: 'place' | 'event' }[] = [
    { label: '🍽 Salir a comer', value: 'place' },
    { label: '📅 Eventos', value: 'event' },
];

// Fila de burbujas con scroll horizontal (mobile) + barra de progreso chica debajo,
// para que el usuario vea cuánto más le queda por deslizar.
function BubbleScrollRow({ children }: { children: ReactNode }) {
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

    useEffect(() => {
        updateThumb();
        window.addEventListener('resize', updateThumb);
        return () => window.removeEventListener('resize', updateThumb);
    }, [updateThumb, children]);

    return (
        <>
            <div ref={ref} onScroll={updateThumb} className="bubble-row no-scrollbar">
                {children}
            </div>
            <div className="bubble-scroll-track mobile-only">
                <div className="bubble-scroll-thumb" style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }} />
            </div>
        </>
    );
}

export function BubbleSearch() {
    // ── Text search ──
    const [searchQuery, setSearchQuery] = useState('');
    const [allPlaces, setAllPlaces] = useState<Place[]>([]);
    const [allEvents, setAllEvents] = useState<DbEvent[]>([]);
    const [showTextPlaces, setShowTextPlaces] = useState(true);
    const [showTextEvents, setShowTextEvents] = useState(true);
    const [textExplorerIndex, setTextExplorerIndex] = useState<number | null>(null);
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
        if (searchQuery && allEvents.length === 0) {
            fetch('/api/events')
                .then(r => r.json())
                .then((data: DbEvent[]) => setAllEvents(data))
                .catch(console.error);
        }
    }, [searchQuery, allPlaces.length, allEvents.length]);

    const textResults = useMemo<Place[] | null>(() => {
        if (!searchQuery) return null;
        const q = normalize(searchQuery);
        return allPlaces.filter(p =>
            normalize(p.name).includes(q) ||
            normalize(p.zone ?? '').includes(q) ||
            p.tags?.some(t => normalize(t).includes(q))
        );
    }, [allPlaces, searchQuery]);

    const eventTextResults = useMemo<DbEvent[] | null>(() => {
        if (!searchQuery) return null;
        const q = normalize(searchQuery);
        return allEvents.filter(e =>
            normalize(e.title).includes(q) ||
            normalize(e.zone ?? '').includes(q) ||
            normalize(e.category).includes(q) ||
            e.tags?.some(t => normalize(t).includes(q))
        );
    }, [allEvents, searchQuery]);

    // ── Bubble flow ──
    const prefetchRef = useRef<Promise<Place[]> | null>(null);
    const [bubbleStep, setBubbleStep] = useState<1 | 2 | 3>(1);
    const [placeOrEventTab, setPlaceOrEventTab] = useState<'place' | 'event'>('place');
    const [searchKind, setSearchKind] = useState<'place' | 'event' | null>(null);
    const [activity, setActivity] = useState<string | null>(null);
    const [eventCategory, setEventCategory] = useState<string | null>(null);
    const [isSurprise, setIsSurprise] = useState(false);
    const [zone, setZone] = useState<string | null>(null);
    const [bubbleResults, setBubbleResults] = useState<Place[] | null>(null);
    const [eventBubbleResults, setEventBubbleResults] = useState<DbEvent[] | null>(null);
    const [eventExplorerIndex, setEventExplorerIndex] = useState<number | null>(null);
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

    function pickPlaceActivity(key: string, special = false) {
        setSearchKind('place');
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

    function pickEventActivity(category: string, special = false) {
        setSearchKind('event');
        setEventCategory(category);
        setIsSurprise(special);
        setBubbleStep(2);
    }

    function pickZone(value: string) {
        setZone(value);
        setBubbleStep(3);
    }

    async function pickWhenForPlaces(selectedWhen: string) {
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
        }
    }

    async function pickWhenForEvents(selectedWhen: string) {
        const hasZone = zone && zone !== 'all';

        async function fetchEvents(withZone: boolean): Promise<DbEvent[]> {
            const params = new URLSearchParams();
            if (isSurprise) params.set('all', 'true');
            else params.set('category', eventCategory ?? '');
            if (withZone && hasZone) params.set('zone', zone!);
            const res = await fetch(`/api/events/bubble?${params}`);
            return res.json();
        }

        try {
            let data = await fetchEvents(true);
            if (data.length === 0 && hasZone) {
                data = await fetchEvents(false);
                setZoneFallback(true);
            }
            const now = guatNow();
            const filtered = selectedWhen === 'anytime'
                ? data
                : data.filter(e => eventMatchesWhen(e.date_start, selectedWhen, now));
            setEventBubbleResults(filtered);
        } catch {
            setEventBubbleResults([]);
        }
    }

    async function pickWhen(selectedWhen: string) {
        setWhen(selectedWhen);
        setLoadingBubble(true);
        setZoneFallback(false);

        if (searchKind === 'event') {
            await pickWhenForEvents(selectedWhen);
        } else {
            await pickWhenForPlaces(selectedWhen);
        }

        setLoadingBubble(false);
    }

    function bubbleBack() {
        if (bubbleStep === 2) {
            setPlaceOrEventTab(searchKind === 'event' ? 'event' : 'place');
            setBubbleStep(1);
            setActivity(null);
            setEventCategory(null);
            setIsSurprise(false);
            setSearchKind(null);
        }
        else if (bubbleStep === 3) { setBubbleStep(2); setZone(null); }
    }

    function resetBubble() {
        setBubbleResults(null);
        setEventBubbleResults(null);
        setBubbleStep(1);
        setSearchKind(null);
        setActivity(null);
        setEventCategory(null);
        setIsSurprise(false);
        setZone(null);
        setWhen(null);
        setLoadingBubble(false);
        setZoneFallback(false);
        prefetchRef.current = null;
    }

    const showBubbleFlow = !searchQuery && bubbleResults === null && eventBubbleResults === null && !loadingBubble;

    return (
        <div>
            {/* ── Hero: centrado, compacto ── */}
            <section
                style={{
                    padding: '1.1rem 1.5rem 1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.65rem',
                }}
            >
                {/* A) Tag superior */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span
                        className="hero-live-dot"
                        style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#E11D2E', display: 'inline-block', flexShrink: 0 }}
                    />
                    <span
                        style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'clamp(9px, 2.4vw, 13px)',
                            fontWeight: 600,
                            letterSpacing: '0.14em',
                            color: '#E11D2E',
                            textTransform: 'uppercase',
                        }}
                    >
                        Todo lo que pasa en Guate, en un solo lugar
                    </span>
                </div>

                {/* B) Título */}
                <h1
                    className="font-serif"
                    style={{ fontSize: 'clamp(32px, 8.5vw, 64px)', fontWeight: 700, lineHeight: 1.1, color: '#0A0A0A' }}
                >
                    ¿Qué hacemos <em style={{ color: '#E11D2E', fontStyle: 'italic' }}>hoy</em> en Guate?
                </h1>

                <p
                    style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'clamp(13px, 3.8vw, 20px)',
                        color: '#666666',
                        lineHeight: 1.5,
                    }}
                >
                    Encuentra cafés, restaurantes y cosas que hacer.
                </p>

                {/* C) Search bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: `0.5px solid ${inputFocused ? '#0A0A0A' : '#D4D4D4'}`,
                        borderRadius: '100px',
                        padding: 'clamp(8px, 1.6vw, 11px) clamp(16px, 3vw, 26px)',
                        backgroundColor: '#FAFAFA',
                        width: '100%',
                        maxWidth: '760px',
                        transition: 'border-color 0.2s ease',
                    }}
                >
                    <Search style={{ width: 'clamp(15px, 3vw, 18px)', height: 'clamp(15px, 3vw, 18px)', color: '#999999', flexShrink: 0 }} />
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
                            fontSize: 'clamp(13px, 3vw, 16px)',
                            color: '#0A0A0A',
                            backgroundColor: 'transparent',
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: 'clamp(16px, 3vw, 19px)', lineHeight: 1, padding: 0, flexShrink: 0 }}
                        >
                            ×
                        </button>
                    )}
                </div>
            </section>

            {/* ── Resultados de texto: lugares + eventos ── */}
            {searchQuery && (
                <section style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 32px 64px' }}>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0A0A0A' }}>
                            <input type="checkbox" checked={showTextPlaces} onChange={e => setShowTextPlaces(e.target.checked)} />
                            Lugares
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0A0A0A' }}>
                            <input type="checkbox" checked={showTextEvents} onChange={e => setShowTextEvents(e.target.checked)} />
                            Eventos
                        </label>
                    </div>

                    {showTextPlaces && (
                        <div style={{ marginBottom: '32px' }}>
                            <p style={{ fontSize: '13px', color: '#666666', marginBottom: '16px' }}>
                                {textResults?.length ?? 0} lugar{(textResults?.length ?? 0) !== 1 ? 'es' : ''} para &ldquo;{searchQuery}&rdquo;
                            </p>
                            {textResults && textResults.length > 0 ? (
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
                                <p style={{ color: '#666666', fontSize: '14px', textAlign: 'center', paddingTop: '16px' }}>
                                    No encontramos lugares que coincidan.
                                </p>
                            )}
                        </div>
                    )}

                    {showTextEvents && (
                        <div>
                            <p style={{ fontSize: '13px', color: '#666666', marginBottom: '16px' }}>
                                {eventTextResults?.length ?? 0} evento{(eventTextResults?.length ?? 0) !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
                            </p>
                            {eventTextResults && eventTextResults.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {eventTextResults.map((event, i) => (
                                        <EventCardLink
                                            key={event.id}
                                            event={event}
                                            onOpenExplorer={() => setTextExplorerIndex(i)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#666666', fontSize: '14px', textAlign: 'center', paddingTop: '16px' }}>
                                    No encontramos eventos que coincidan.
                                </p>
                            )}
                        </div>
                    )}
                </section>
            )}

            {textExplorerIndex !== null && eventTextResults && (
                <EventExplorer
                    events={eventTextResults}
                    initialIndex={textExplorerIndex}
                    onClose={() => setTextExplorerIndex(null)}
                />
            )}

            {/* ── Bubble flow (solo cuando no hay búsqueda de texto) ── */}
            {showBubbleFlow && (
                <section style={{ maxWidth: '860px', margin: '0 auto', padding: '18px 24px 20px' }}>
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
                                            fontSize: 'clamp(11px, 2.8vw, 14px)',
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
                        {bubbleStep === 1 && (
                            <div
                                style={{
                                    display: 'flex', justifyContent: 'center', gap: '24px',
                                    marginBottom: '20px', borderBottom: '1px solid #E5E5E5',
                                }}
                            >
                                {TABS.map(tab => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setPlaceOrEventTab(tab.value)}
                                        style={{
                                            fontFamily: 'var(--font-sans)', fontSize: 'clamp(13px, 3.4vw, 17px)', fontWeight: 600,
                                            padding: '0 4px 10px', marginBottom: '-1px',
                                            background: 'none', cursor: 'pointer',
                                            color: placeOrEventTab === tab.value ? '#E11D2E' : '#999999',
                                            border: 'none',
                                            borderBottom: placeOrEventTab === tab.value ? '2px solid #E11D2E' : '2px solid transparent',
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {bubbleStep > 1 && (
                            <h2
                                className="font-serif"
                                style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.6rem)', fontWeight: 700, color: '#0A0A0A', marginBottom: '20px', textAlign: 'center' }}
                            >
                                {STEP_TITLE[bubbleStep]}
                            </h2>
                        )}

                        <div key={nudgeKey} className={nudgeKey > 0 ? 'bubble-nudge' : ''}>
                            {bubbleStep === 1 && (
                                <BubbleScrollRow>
                                    {(placeOrEventTab === 'place' ? ACTIVITIES : EVENT_ACTIVITIES).map(({ label, key, special }) => (
                                        <button
                                            key={key}
                                            onClick={() => placeOrEventTab === 'place' ? pickPlaceActivity(key, special) : pickEventActivity(key, special)}
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
                                </BubbleScrollRow>
                            )}

                            {bubbleStep === 2 && (
                                <BubbleScrollRow>
                                    {zones.map(({ label, value }) => (
                                        <button key={value} onClick={() => pickZone(value)} className="bubble-btn">
                                            {label}
                                        </button>
                                    ))}
                                </BubbleScrollRow>
                            )}

                            {bubbleStep === 3 && (
                                <BubbleScrollRow>
                                    {WHEN.map(({ label, value }) => (
                                        <button key={value} onClick={() => pickWhen(value)} className="bubble-btn">
                                            {label}
                                        </button>
                                    ))}
                                </BubbleScrollRow>
                            )}
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

            {/* ── Resultados bubble: lugares ── */}
            {!searchQuery && searchKind === 'place' && bubbleResults !== null && !loadingBubble && (
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

            {/* ── Resultados bubble: eventos ── */}
            {!searchQuery && searchKind === 'event' && eventBubbleResults !== null && !loadingBubble && (
                <section style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 32px 64px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <p className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '4px' }}>
                                {isSurprise ? 'Eventos para todos los gustos' : `Eventos de "${eventCategory}"`}
                                {!zoneFallback && zone && zone !== 'all' ? ` · ${zone}` : ''}
                            </p>
                            <p style={{ fontSize: '13px', color: '#666666' }}>
                                {eventBubbleResults.length} evento{eventBubbleResults.length !== 1 ? 's' : ''} encontrado{eventBubbleResults.length !== 1 ? 's' : ''}
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

                    {eventBubbleResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {eventBubbleResults.map((event, i) => (
                                <EventCardLink
                                    key={event.id}
                                    event={event}
                                    onOpenExplorer={() => setEventExplorerIndex(i)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <p style={{ color: '#666666', fontSize: '14px', marginBottom: '16px' }}>
                                No encontramos eventos que coincidan. Probá con otra selección.
                            </p>
                            <button onClick={resetBubble} className="bubble-reset-btn">
                                Intentar de nuevo
                            </button>
                        </div>
                    )}
                </section>
            )}

            {eventExplorerIndex !== null && eventBubbleResults && (
                <EventExplorer
                    events={eventBubbleResults}
                    initialIndex={eventExplorerIndex}
                    onClose={() => setEventExplorerIndex(null)}
                />
            )}
        </div>
    );
}

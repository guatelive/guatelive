'use client';

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { EventCardLink } from '@/components/cards/event-card-link';
import { ActivityCard } from '@/components/cards/activity-card';
import { EventExplorer } from '@/components/home/EventExplorer';
import { VisitCounter } from '@/components/home/VisitCounter';
import { HeroConfetti } from '@/components/home/hero-confetti';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import {
    normalizeHours,
    openStatusForSelection,
    guatNow,
    type OpenStatus,
} from '@/lib/hours-utils';
import { eventMatchesWhen } from '@/lib/event-when';
import type { DbEvent, DbActivity } from '@/lib/types';

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
    Almuerzo: ['almuerzo', 'restaurante'],
    Cenar: ['cena-romantica', 'date-night', 'restaurante'],
    'Tomar algo': ['bar', 'bar-completo', 'cocteleria-de-autor', 'cerveza-artesanal'],
    'Desayuno o brunch': ['desayuno', 'brunch', 'cafe', 'desayuno-todo-el-dia', 'abierto-temprano'],
    Trabajar: ['para-trabajar', 'laptop-friendly', 'cafe-especialidad', 'reunion-de-negocios'],
    'Salir de fiesta': ['salir-de-fiesta', 'noche', 'night_club', 'after-office', 'musica-en-vivo'],
    'Ir con mi perro': ['al-aire-libre', 'tranquilo', 'acogedor', 'casual'],
    'Plan familiar': ['familia', 'ninos', 'domingo-en-familia', 'grupos-grandes'],
};

const ACTIVITIES: { label: string; key: string; special?: boolean }[] = [
    { label: '🌅 Brunch', key: 'Desayuno o brunch' },
    { label: '🍛 Almuerzo', key: 'Almuerzo' },
    { label: '🍽 Cenar', key: 'Cenar' },
    { label: '☕ Tomar algo', key: 'Tomar algo' },
    { label: '💻 Trabajar', key: 'Trabajar' },
    { label: '🐶 Con mi perro', key: 'Ir con mi perro' },
    { label: '👨‍👩‍👧 Plan familiar', key: 'Plan familiar' },
    { label: '🎉 Salir de fiesta', key: 'Salir de fiesta' },
    // '✨ Sorprendeme' escondido a propósito hasta tener presupuesto para hacerlo bien
    // (auto-tagging + selección real vía Claude API, no random shuffle). Ver ticket en
    // Notion. La lógica (isSurprise, pickPlaceActivity special) queda intacta para
    // reactivar agregando de nuevo esta entrada.
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

const STORAGE_KEY = 'guatelive:home-search-state';
const STORAGE_VERSION = 1;

type PersistedSearchState = {
    v: number;
    searchQuery: string;
    bubbleStep: 1 | 2 | 3;
    placeOrEventTab: 'place' | 'event' | 'activity';
    searchKind: 'place' | 'event' | 'activity' | null;
    activity: string | null;
    eventCategory: string | null;
    activityCategory: string | null;
    isSurprise: boolean;
    zone: string | null;
    when: string | null;
    zoneFallback: boolean;
    bubbleResults: Place[] | null;
    eventBubbleResults: DbEvent[] | null;
    activityBubbleResults: DbActivity[] | null;
};

const WHEN: { label: string; value: string }[] = [
    { label: '🌞 Hoy', value: 'today' },
    { label: '🌙 Esta noche', value: 'tonight' },
    { label: '☀️ Mañana', value: 'tomorrow' },
    { label: '📅 Este fin de semana', value: 'weekend' },
    { label: '🕐 Cuando sea', value: 'anytime' },
];

const TABS: { label: string; value: 'place' | 'event' | 'activity' }[] = [
    { label: '🍽 Salir a comer', value: 'place' },
    { label: '📅 Eventos', value: 'event' },
    { label: '✨ Actividades', value: 'activity' },
];

// Fila de burbujas con scroll horizontal (mobile) + barra de progreso chica debajo,
// para que el usuario vea cuánto más le queda por deslizar.
function BubbleScrollRow({ children, className }: { children: ReactNode; className?: string }) {
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
            <div ref={ref} onScroll={updateThumb} className={`bubble-row no-scrollbar ${className ?? ''}`}>
                {children}
            </div>
            <div className="bubble-scroll-track mobile-only">
                <div className="bubble-scroll-thumb" style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }} />
            </div>
        </>
    );
}

export type HeroCandidate = { image: string; alt: string; badge: string; href: string; cta: string };

export function BubbleSearch({ heroPhotos }: { heroPhotos?: HeroCandidate[] }) {
    // ── Hero: carrusel automático entre las fotos candidatas ──
    const [activeHeroIndex, setActiveHeroIndex] = useState(0);
    const heroPausedRef = useRef(false);
    const heroPhotoCount = heroPhotos?.length ?? 0;

    useEffect(() => {
        if (heroPhotoCount <= 1) return;
        const id = setInterval(() => {
            if (heroPausedRef.current) return;
            setActiveHeroIndex(i => (i + 1) % heroPhotoCount);
        }, 4000);
        return () => clearInterval(id);
    }, [heroPhotoCount]);

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
    const [placeOrEventTab, setPlaceOrEventTab] = useState<'place' | 'event' | 'activity'>('place');
    const [searchKind, setSearchKind] = useState<'place' | 'event' | 'activity' | null>(null);
    const [activity, setActivity] = useState<string | null>(null);
    const [eventCategory, setEventCategory] = useState<string | null>(null);
    const [activityCategory, setActivityCategory] = useState<string | null>(null);
    const [isSurprise, setIsSurprise] = useState(false);
    const [zone, setZone] = useState<string | null>(null);
    const [bubbleResults, setBubbleResults] = useState<Place[] | null>(null);
    const [eventBubbleResults, setEventBubbleResults] = useState<DbEvent[] | null>(null);
    const [activityBubbleResults, setActivityBubbleResults] = useState<DbActivity[] | null>(null);
    const [eventExplorerIndex, setEventExplorerIndex] = useState<number | null>(null);
    const [loadingBubble, setLoadingBubble] = useState(false);
    const [zoneFallback, setZoneFallback] = useState(false);
    const [when, setWhen] = useState<string | null>(null);

    // Restaura búsqueda anterior al volver con el botón del navegador (Next.js remonta
    // el componente en soft-navigation; sessionStorage sobrevive ese remount).
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw) as PersistedSearchState;
            if (saved.v !== STORAGE_VERSION) return;

            setSearchQuery(saved.searchQuery);
            setBubbleStep(saved.bubbleStep);
            setPlaceOrEventTab(saved.placeOrEventTab);
            setSearchKind(saved.searchKind);
            setActivity(saved.activity);
            setEventCategory(saved.eventCategory);
            setActivityCategory(saved.activityCategory ?? null);
            setIsSurprise(saved.isSurprise);
            setZone(saved.zone);
            setWhen(saved.when);
            setZoneFallback(saved.zoneFallback);
            setBubbleResults(saved.bubbleResults);
            setEventBubbleResults(saved.eventBubbleResults);
            setActivityBubbleResults(saved.activityBubbleResults ?? null);
        } catch {
            // sessionStorage no disponible o JSON corrupto — arranca limpio.
        }
    }, []);

    // Persiste la búsqueda actual en cada cambio. Salta el primer disparo (que todavía
    // trae los valores por defecto de antes de que el efecto de restauración corra).
    const hasSavedOnceRef = useRef(false);
    useEffect(() => {
        if (!hasSavedOnceRef.current) {
            hasSavedOnceRef.current = true;
            return;
        }
        try {
            const toSave: PersistedSearchState = {
                v: STORAGE_VERSION,
                searchQuery,
                bubbleStep,
                placeOrEventTab,
                searchKind,
                activity,
                eventCategory,
                activityCategory,
                isSurprise,
                zone,
                when,
                zoneFallback,
                bubbleResults,
                eventBubbleResults,
                activityBubbleResults,
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch {
            // sessionStorage no disponible — no persiste, no rompe el componente.
        }
    }, [searchQuery, bubbleStep, placeOrEventTab, searchKind, activity, eventCategory, activityCategory, isSurprise, zone, when, zoneFallback, bubbleResults, eventBubbleResults, activityBubbleResults]);

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

    function pickActivityActivity(category: string, special = false) {
        setSearchKind('activity');
        setActivityCategory(category);
        setIsSurprise(special);
        setBubbleStep(2);
    }

    function pickZone(value: string) {
        setZone(value);
        if (searchKind === 'activity') {
            void pickZoneForActivities(value);
        } else {
            setBubbleStep(3);
        }
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
            if (hasZone) {
                // Con zona seleccionada, el pool de prefetch (top nacional por rating,
                // sin zona) no representa la zona real — siempre pedir la query real.
                data = await fetchFresh(true);
                if (data.length === 0) {
                    data = await fetchFresh(false);
                    setZoneFallback(true);
                }
            } else {
                // Sin zona: el prefetch especulativo ya cubre este caso (mismo pool
                // nacional que traería la query real sin zona).
                const prefetched = !isSurprise && prefetchRef.current !== null
                    ? await prefetchRef.current
                    : null;
                data = prefetched && prefetched.length > 0 ? prefetched : await fetchFresh(false);
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

    async function pickZoneForActivities(selectedZone: string) {
        setLoadingBubble(true);
        setZoneFallback(false);
        const hasZone = selectedZone !== 'all';

        async function fetchActivities(withZone: boolean): Promise<DbActivity[]> {
            const params = new URLSearchParams();
            if (isSurprise) params.set('all', 'true');
            else params.set('category', activityCategory ?? '');
            if (withZone && hasZone) params.set('zone', selectedZone);
            const res = await fetch(`/api/activities/bubble?${params}`);
            return res.json();
        }

        try {
            let data = await fetchActivities(true);
            if (data.length === 0 && hasZone) {
                data = await fetchActivities(false);
                setZoneFallback(true);
            }
            setActivityBubbleResults(data);
        } catch {
            setActivityBubbleResults([]);
        } finally {
            setLoadingBubble(false);
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
            setPlaceOrEventTab(searchKind === 'event' ? 'event' : searchKind === 'activity' ? 'activity' : 'place');
            setBubbleStep(1);
            setActivity(null);
            setEventCategory(null);
            setActivityCategory(null);
            setIsSurprise(false);
            setSearchKind(null);
        }
        else if (bubbleStep === 3) { setBubbleStep(2); setZone(null); }
    }

    function resetBubble() {
        setBubbleResults(null);
        setEventBubbleResults(null);
        setActivityBubbleResults(null);
        setBubbleStep(1);
        setSearchKind(null);
        setActivity(null);
        setEventCategory(null);
        setActivityCategory(null);
        setIsSurprise(false);
        setZone(null);
        setWhen(null);
        setLoadingBubble(false);
        setZoneFallback(false);
        prefetchRef.current = null;
    }

    const showBubbleFlow = !searchQuery && bubbleResults === null && eventBubbleResults === null && activityBubbleResults === null && !loadingBubble;

    return (
        <div>
            {/* ── Hero: split diagonal (home v2) ── */}
            <section className="mx-auto max-w-[1400px] px-6 pt-3 md:px-10">
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] md:items-stretch md:overflow-hidden">
                    {/* Columna izquierda */}
                    <div className="flex flex-col items-center py-6 text-center md:items-start md:py-5 md:pr-10 md:text-left">
                        {/* Mobile: textos sobre fondo negro con confeti lento (hero-confetti en
                            globals.css + HeroConfetti), full-bleed. Desde el buscador hacia
                            abajo, blanco. En desktop el bloque es transparente, sin cambios. */}
                        <div className="hero-confetti -mx-6 -mt-9 mb-6 flex w-[calc(100%+3rem)] flex-col items-center self-stretch px-6 pb-10 pt-12 md:m-0 md:w-auto md:items-start md:p-0">
                        <HeroConfetti />
                        {/* A) Tag superior */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 16 }}>
                            <span
                                style={{
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: 'clamp(10px, 2vw, 13px)',
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    color: '#E11D2E',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Todo lo que pasa en Guate, en un solo lugar
                            </span>
                        </div>

                        {/* B) Título */}
                        <h1
                            className="font-display text-white md:text-[#111111]"
                            style={{ fontSize: 'clamp(34px, 5.5vw, 54px)', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.01em', margin: '0 0 16px' }}
                        >
                            ¿Qué hacemos <span style={{ color: '#E11D2E' }}>hoy</span> en Guate?
                        </h1>

                        <p
                            className="text-white/80 md:text-[#555555]"
                            style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: 'clamp(14px, 2vw, 18px)',
                                lineHeight: 1.5,
                                marginBottom: 18,
                            }}
                        >
                            Encuentra cafés, restaurantes y cosas que hacer.
                        </p>

                        <div className="md:mb-[22px]">
                            <VisitCounter />
                        </div>
                        </div>

                        {/* C) Search bar */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                border: '2px solid #111111',
                                borderRadius: '999px',
                                padding: 'clamp(10px, 1.6vw, 14px) clamp(16px, 3vw, 22px)',
                                backgroundColor: '#F4F4F4',
                                width: '100%',
                                maxWidth: '560px',
                                boxShadow: inputFocused ? '0 0 0 3px rgba(17,17,17,0.12)' : 'none',
                                transition: 'box-shadow 0.2s ease',
                            }}
                        >
                            <Search style={{ width: 'clamp(15px, 3vw, 18px)', height: 'clamp(15px, 3vw, 18px)', color: '#111111', flexShrink: 0 }} />
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
                                    fontSize: 'clamp(13px, 3vw, 15px)',
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

                        {/* ── Bubble flow (solo cuando no hay búsqueda de texto) ── */}
                        {showBubbleFlow && (
                            <div style={{ width: '100%', maxWidth: '560px', marginTop: '20px' }}>
                                {/* ── Progress tracker ── */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '10px' }}>
                                        {(['¿Qué?', '¿Dónde?', '¿Cuándo?'] as const).map((label, i) => {
                                            const stepNum = i + 1;
                                            const isCurrent = bubbleStep === stepNum;
                                            return (
                                                <span
                                                    key={label}
                                                    aria-current={isCurrent ? 'step' : undefined}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                        // El paso actual hace las veces de título de la etapa
                                                        // (sin subtítulo aparte abajo): un poco más grande y grueso.
                                                        fontSize: isCurrent ? 'clamp(14px, 2.4vw, 17px)' : 'clamp(11px, 2vw, 14px)',
                                                        fontWeight: isCurrent ? 800 : 600,
                                                        // Solo el paso actual va en negro: los ya pasados y los que
                                                        // faltan quedan en gris para que se vea por dónde va el usuario.
                                                        color: isCurrent ? '#111111' : '#AAAAAA',
                                                        letterSpacing: '0.03em',
                                                        paddingBottom: isCurrent ? 8 : 0,
                                                        borderBottom: isCurrent ? '2px solid #E11D2E' : 'none',
                                                        transition: 'color 0.3s ease, font-size 0.3s ease',
                                                    }}
                                                >
                                                    {/* Número chico: guía el orden sin romper la armonía del hero */}
                                                    <span
                                                        aria-hidden="true"
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: isCurrent ? 18 : 15, height: isCurrent ? 18 : 15, borderRadius: '50%',
                                                            fontSize: isCurrent ? 10 : 9, fontWeight: 700, letterSpacing: 0,
                                                            backgroundColor: isCurrent ? '#E11D2E' : 'transparent',
                                                            color: isCurrent ? '#FFFFFF' : 'inherit',
                                                            border: isCurrent ? 'none' : '1px solid currentColor',
                                                        }}
                                                    >
                                                        {stepNum}
                                                    </span>
                                                    {label}
                                                </span>
                                            );
                                        })}
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
                                                marginBottom: '16px', borderBottom: '1px solid #EEEEEE',
                                            }}
                                        >
                                            {TABS.map(tab => (
                                                <button
                                                    key={tab.value}
                                                    onClick={() => setPlaceOrEventTab(tab.value)}
                                                    style={{
                                                        fontFamily: 'var(--font-sans)', fontSize: 'clamp(13px, 2vw, 14px)', fontWeight: 600,
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


                                    <div key={nudgeKey} className={nudgeKey > 0 ? 'bubble-nudge' : ''}>
                                        {bubbleStep === 1 && (
                                            <BubbleScrollRow className="bubble-row-hero">
                                                {(placeOrEventTab === 'place' ? ACTIVITIES : EVENT_ACTIVITIES).map(({ label, key, special }) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => {
                                                            if (placeOrEventTab === 'place') pickPlaceActivity(key, special);
                                                            else if (placeOrEventTab === 'event') pickEventActivity(key, special);
                                                            else pickActivityActivity(key, special);
                                                        }}
                                                        className="bubble-btn"
                                                        style={special ? {
                                                            backgroundColor: '#E11D2E',
                                                            color: '#ffffff',
                                                            borderColor: '#E11D2E',
                                                        } : undefined}
                                                    >
                                                        {special && placeOrEventTab === 'activity' ? '🎟 Cualquier actividad' : label}
                                                    </button>
                                                ))}
                                            </BubbleScrollRow>
                                        )}

                                        {bubbleStep === 2 && (
                                            <BubbleScrollRow className="bubble-row-hero">
                                                {zones.map(({ label, value }) => (
                                                    <button key={value} onClick={() => pickZone(value)} className="bubble-btn">
                                                        {label}
                                                    </button>
                                                ))}
                                            </BubbleScrollRow>
                                        )}

                                        {bubbleStep === 3 && (
                                            <BubbleScrollRow className="bubble-row-hero">
                                                {WHEN.map(({ label, value }) => (
                                                    <button key={value} onClick={() => pickWhen(value)} className="bubble-btn">
                                                        {label}
                                                    </button>
                                                ))}
                                            </BubbleScrollRow>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha: imagen diagonal (desktop) */}
                    <Link
                        href={heroPhotos?.[activeHeroIndex]?.href ?? '/'}
                        className="relative hidden h-full md:block"
                        style={{
                            clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)',
                            background: '#0A0A0A',
                            minHeight: 420,
                            overflow: 'hidden',
                            transition: 'height 0.3s ease',
                        }}
                        onMouseEnter={() => { heroPausedRef.current = true; }}
                        onMouseLeave={() => { heroPausedRef.current = false; }}
                    >
                        {heroPhotos?.map((photo, i) => (
                            <div key={photo.image} style={{ position: 'absolute', inset: 0, opacity: i === activeHeroIndex ? 1 : 0, transition: 'opacity 300ms ease-in-out' }}>
                                <ImageWithSkeleton
                                    src={photo.image}
                                    alt={photo.alt}
                                    fill
                                    sizes="45vw"
                                    className="object-cover"
                                    style={{ opacity: 0.92 }}
                                    priority={i === 0}
                                />
                            </div>
                        ))}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 45%)', pointerEvents: 'none' }} />
                        <div
                            style={{
                                position: 'absolute', top: 24, right: 24,
                                background: '#C8E64E', color: '#111111',
                                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                                padding: '10px 16px', borderRadius: 10,
                                transform: 'rotate(6deg)', boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
                            }}
                        >
                            {heroPhotos?.[activeHeroIndex]?.badge ?? '¡ESTA SEMANA!'}
                        </div>
                        <div style={{ position: 'absolute', bottom: 24, left: 24, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: '#E11D2E' }}>
                            {heroPhotos?.[activeHeroIndex]?.cta ?? 'Ver más'} →
                        </div>
                    </Link>
                </div>
            </section>

            {/* ── Resultados de texto: lugares + eventos ── */}
            {searchQuery && (
                <section className="mx-auto max-w-[1400px] px-6 pb-16 md:px-10">
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
                                            <PlaceCard place={place} titleFont="display" />
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
                                            titleFont="display"
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
                    <p className="font-display font-bold" style={{ fontSize: '1.1rem', color: '#0A0A0A', marginBottom: '14px' }}>
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
                <section className="mx-auto max-w-[1400px] px-6 pb-16 md:px-10">
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <p className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0A0A', marginBottom: '4px' }}>
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
                                        <PlaceCard place={place} openNow={openNow} titleFont="display" />
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
                <section className="mx-auto max-w-[1400px] px-6 pb-16 md:px-10">
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <p className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0A0A', marginBottom: '4px' }}>
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
                                    titleFont="display"
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

            {/* ── Resultados bubble: actividades ── */}
            {!searchQuery && searchKind === 'activity' && activityBubbleResults !== null && !loadingBubble && (
                <section className="mx-auto max-w-[1400px] px-6 pb-16 md:px-10">
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <p className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0A0A', marginBottom: '4px' }}>
                                {isSurprise ? 'Actividades para todos los gustos' : `Actividades de "${activityCategory}"`}
                                {!zoneFallback && zone && zone !== 'all' ? ` · ${zone}` : ''}
                            </p>
                            <p style={{ fontSize: '13px', color: '#666666' }}>
                                {activityBubbleResults.length} actividad{activityBubbleResults.length !== 1 ? 'es' : ''} encontrada{activityBubbleResults.length !== 1 ? 's' : ''}
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

                    {activityBubbleResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {activityBubbleResults.map(a => (
                                <Link
                                    key={a.id}
                                    href={`/actividad/${a.slug}`}
                                    className="block hover:opacity-90 transition-opacity"
                                >
                                    <ActivityCard activity={a} titleFont="display" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <p style={{ color: '#666666', fontSize: '14px', marginBottom: '16px' }}>
                                No encontramos actividades que coincidan. Probá con otra selección.
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

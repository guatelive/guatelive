'use client';

import { useMemo, useState } from 'react';
import { EventGridClient } from '@/components/eventos-hoy/event-grid-client';
import { FilterChipRow, distinctOptions, interestOptions, type ChipOption } from '@/components/filters/filter-chip-row';
import { focusWhen } from '@/lib/event-showtimes';
import { matchesZone } from '@/lib/zone-hierarchy';
import type { DbEvent } from '@/lib/types';

const WHEN_OPTIONS: ChipOption[] = [
    { value: 'today', label: '🌞 Hoy' },
    { value: 'tonight', label: '🌙 Esta noche' },
    { value: 'tomorrow', label: '☀️ Mañana' },
    { value: 'weekend', label: '📅 Este finde' },
    { value: 'anytime', label: '🕐 Cuando sea' },
];

const WHEN_EMPTY_COPY: Record<string, string> = {
    today: 'hoy',
    tonight: 'esta noche',
    tomorrow: 'mañana',
    weekend: 'este fin de semana',
    anytime: 'próximamente',
};

// Separadores dentro de "Cuando sea": eventos de los próximos 7 días vs. el resto.
// Se compara solo la fecha de pared (YYYY-MM-DD) de date_start contra la de `now`
// (guatNow: sus campos UTC son la hora de Guatemala), igual que lib/event-when.ts.
function dayNumber(year: number, month: number, day: number): number {
    return Date.UTC(year, month, day) / 86_400_000;
}

function isThisWeek(dateStart: string, now: Date): boolean {
    const [y, m, d] = dateStart.slice(0, 10).split('-').map(Number);
    const today = dayNumber(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return dayNumber(y, m - 1, d) - today < 7;
}

// `nowIso` viene del server (guatNow() al momento del render ISR) en vez de leer el
// reloj en el cliente: así el primer render del cliente coincide con el HTML del
// server (sin hydration mismatch). Desfase máximo = revalidate de la página (1h).
export function EventosFilters({ events, nowIso }: { events: DbEvent[]; nowIso: string }) {
    const now = useMemo(() => new Date(nowIso), [nowIso]);
    const hasToday = useMemo(() => events.some(e => focusWhen(e, 'today', now) !== null), [events, now]);

    const [when, setWhen] = useState<string>(hasToday ? 'today' : 'anytime');
    const [category, setCategory] = useState<string | null>(null);
    const [zone, setZone] = useState<string | null>(null);
    const [interest, setInterest] = useState<string | null>(null);
    const [onlyFree, setOnlyFree] = useState(false);

    const categories = useMemo(() => distinctOptions(events.map(e => e.category)), [events]);
    const zones = useMemo(() => distinctOptions(events.map(e => e.zone)), [events]);
    const interests = useMemo(() => interestOptions(events), [events]);

    const filtered = useMemo(
        () => events
            .map(e => focusWhen(e, when, now))
            .filter((e): e is DbEvent => e !== null)
            .filter(e =>
                (!category || e.category === category) &&
                (!zone || matchesZone(e.zone, zone)) &&
                (!interest || e.tags.includes(interest)) &&
                (!onlyFree || e.is_free)
            ),
        [events, when, now, category, zone, interest, onlyFree]
    );

    // Solo en "Cuando sea" (con otro filtro de tiempo ya está todo en la misma ventana).
    // Una sección vacía no se muestra; si una de las dos queda vacía, no hay separador.
    const sections = useMemo(() => {
        if (when !== 'anytime') return null;
        const groups = [
            { title: 'Esta semana', events: filtered.filter(e => isThisWeek(e.date_start, now)) },
            { title: 'Más adelante', events: filtered.filter(e => !isThisWeek(e.date_start, now)) },
        ].filter(g => g.events.length > 0);
        return groups.length > 1 ? groups : null;
    }, [when, filtered, now]);

    const hasActiveFilters = when !== 'anytime' || category !== null || zone !== null || interest !== null || onlyFree;

    function clearFilters() {
        setWhen('anytime');
        setCategory(null);
        setZone(null);
        setInterest(null);
        setOnlyFree(false);
    }

    return (
        <div>
            <FilterChipRow
                label="¿Cuándo?"
                options={WHEN_OPTIONS}
                selected={when}
                onSelect={v => setWhen(v ?? 'anytime')}
            />
            {categories.length > 1 && (
                <FilterChipRow label="Categoría" allLabel="Todas" options={categories} selected={category} onSelect={setCategory} />
            )}
            {interests.length > 0 && (
                <FilterChipRow label="Intereses" options={interests} selected={interest} onSelect={setInterest} />
            )}
            {zones.length > 1 && (
                <FilterChipRow label="Zona" allLabel="Todas las zonas" options={zones} selected={zone} onSelect={setZone} />
            )}

            <div className="mt-4 mb-6 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" checked={onlyFree} onChange={e => setOnlyFree(e.target.checked)} />
                    Solo gratis
                </label>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-[#666666] underline underline-offset-2 hover:text-[#0A0A0A]"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            <p className="mb-6 text-sm text-[#666666]">
                {filtered.length} evento{filtered.length !== 1 ? 's' : ''} {WHEN_EMPTY_COPY[when]}
            </p>

            {filtered.length > 0 && sections ? (
                <div className="space-y-10">
                    {sections.map(section => (
                        <section key={section.title}>
                            <h2 className="mb-4 font-serif text-xl font-bold text-[#0A0A0A]">{section.title}</h2>
                            <EventGridClient events={section.events} />
                        </section>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <EventGridClient events={filtered} />
            ) : (
                <div className="py-12 text-center">
                    <p className="mb-4 text-sm text-[#666666]">
                        No encontramos eventos {WHEN_EMPTY_COPY[when]} con estos filtros.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-sm font-semibold text-[#E11D2E] underline underline-offset-2"
                    >
                        Ver todos los próximos
                    </button>
                </div>
            )}
        </div>
    );
}

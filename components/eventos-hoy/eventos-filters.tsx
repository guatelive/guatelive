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

            {filtered.length > 0 ? (
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

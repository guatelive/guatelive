'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ActivityCard } from '@/components/cards/activity-card';
import { FilterChipRow, distinctOptions, interestOptions } from '@/components/filters/filter-chip-row';
import { matchesZone } from '@/lib/zone-hierarchy';
import type { DbActivity } from '@/lib/types';

// Zonas y categorías se derivan de las actividades ya cargadas por page.tsx (no de
// /api/zones ni de EVENT_CATEGORIES completo) para no mostrar chips que den 0
// resultados — hoy el catálogo de actividades es chico y la mayoría de categorías
// todavía no tienen ninguna fila.
export function ActividadesFilters({ activities }: { activities: DbActivity[] }) {
    const zones = useMemo(() => distinctOptions(activities.map(a => a.zone)), [activities]);
    const categories = useMemo(() => distinctOptions(activities.map(a => a.category)), [activities]);
    const interests = useMemo(() => interestOptions(activities), [activities]);

    const [zone, setZone] = useState<string | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [interest, setInterest] = useState<string | null>(null);
    const [onlyFree, setOnlyFree] = useState(false);

    const filtered = useMemo(() => {
        return activities.filter(a =>
            (!zone || matchesZone(a.zone, zone)) &&
            (!category || a.category === category) &&
            (!interest || a.tags.includes(interest)) &&
            (!onlyFree || a.is_free)
        );
    }, [activities, zone, category, interest, onlyFree]);

    const hasActiveFilters = zone !== null || category !== null || interest !== null || onlyFree;

    function clearFilters() {
        setZone(null);
        setCategory(null);
        setInterest(null);
        setOnlyFree(false);
    }

    return (
        <div>
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

            <p className="text-sm text-[#666666] mb-6">
                {filtered.length} actividad{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            </p>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(activity => (
                        <Link
                            key={activity.id}
                            href={`/actividad/${activity.slug}`}
                            className="block text-left hover:opacity-90 transition-opacity"
                        >
                            <ActivityCard activity={activity} />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-sm text-[#666666] mb-4">
                        No encontramos actividades que coincidan con estos filtros.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-[#E11D2E] font-semibold underline underline-offset-2"
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}
        </div>
    );
}

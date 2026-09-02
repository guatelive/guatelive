'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ActivityCard } from '@/components/cards/activity-card';
import type { DbActivity } from '@/lib/types';

function chipClass(active: boolean) {
    return `px-4 py-1.5 rounded-full text-sm font-semibold transition ${active
        ? 'bg-[#E11D2E] text-white'
        : 'bg-[#F0F0F0] text-[#0A0A0A] hover:bg-[#E5E5E5]'
        }`;
}

// Zonas y categorías se derivan de las actividades ya cargadas por page.tsx (no de
// /api/zones ni de EVENT_CATEGORIES completo) para no mostrar chips que den 0
// resultados — hoy el catálogo de actividades es chico y la mayoría de categorías
// todavía no tienen ninguna fila.
export function ActividadesFilters({ activities }: { activities: DbActivity[] }) {
    const zones = useMemo(
        () => Array.from(new Set(activities.map(a => a.zone))).sort(),
        [activities]
    );
    const categories = useMemo(
        () => Array.from(new Set(activities.map(a => a.category))).sort(),
        [activities]
    );

    const [zone, setZone] = useState<string | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [onlyFree, setOnlyFree] = useState(false);

    const filtered = useMemo(() => {
        return activities.filter(a =>
            (!zone || a.zone === zone) &&
            (!category || a.category === category) &&
            (!onlyFree || a.is_free)
        );
    }, [activities, zone, category, onlyFree]);

    const hasActiveFilters = zone !== null || category !== null || onlyFree;

    function clearFilters() {
        setZone(null);
        setCategory(null);
        setOnlyFree(false);
    }

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => setCategory(null)} className={chipClass(category === null)}>
                    Todas
                </button>
                {categories.map(c => (
                    <button key={c} onClick={() => setCategory(c)} className={chipClass(category === c)}>
                        {c}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setZone(null)} className={chipClass(zone === null)}>
                    Todas las zonas
                </button>
                {zones.map(z => (
                    <button key={z} onClick={() => setZone(z)} className={chipClass(zone === z)}>
                        {z}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4 mb-8">
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

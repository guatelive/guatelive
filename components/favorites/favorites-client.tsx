'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { ActivityCard } from '@/components/cards/activity-card';
import { EventGridClient } from '@/components/eventos-hoy/event-grid-client';
import { useFavorites } from '@/hooks/use-favorites';
import { countFavorites } from '@/lib/favorites';
import type { DbActivity, DbEvent } from '@/lib/types';

type FavoritePlace = {
    id: string; slug: string; name: string; zone: string | null; rating: number | null; rating_count: number | null;
    primary_category: string | null; category: string | null; tags: string[] | null; primary_photo_url: string | null;
};
type FavoritesData = { places: FavoritePlace[]; events: DbEvent[]; activities: DbActivity[] };

// true solo en el cliente ya hidratado: antes de eso no se sabe si hay favoritos.
const noop = () => () => {};
function useHydrated(): boolean {
    return useSyncExternalStore(noop, () => true, () => false);
}

export function FavoritesClient() {
    const hydrated = useHydrated();
    const favorites = useFavorites();
    const total = countFavorites(favorites);
    const query = new URLSearchParams({
        place: favorites.place.join(','),
        event: favorites.event.join(','),
        activity: favorites.activity.join(','),
    }).toString();

    const [result, setResult] = useState<{ query: string; data: FavoritesData } | null>(null);
    useEffect(() => {
        if (!hydrated || total === 0) return;
        let cancelled = false;
        fetch(`/api/favorites?${query}`)
            .then(r => r.json())
            .then((data: FavoritesData) => { if (!cancelled) setResult({ query, data }); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [hydrated, total, query]);

    if (!hydrated) return null;

    if (total === 0) {
        return (
            <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-6 py-12 text-center">
                <p className="mb-2 font-serif text-xl font-bold text-[#0A0A0A]">Todavía no guardaste nada</p>
                <p className="mb-6 text-sm text-[#666666]">Tocá el ❤️ en un lugar, evento o actividad para tenerlo a mano acá.</p>
                <Link href="/" className="rounded-full bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2a2a]">
                    Buscar un plan
                </Link>
            </div>
        );
    }

    // Mientras llega la respuesta (o si la lista cambió), se muestra lo último cargado.
    const data = result?.data;
    if (!data) return <p className="py-12 text-center text-sm text-[#666666]">Cargando tus favoritos…</p>;

    // Filtra lo que se quitó mientras tanto, sin esperar otra respuesta.
    const places = data.places.filter(p => favorites.place.includes(p.slug));
    const events = data.events.filter(e => favorites.event.includes(e.slug));
    const activities = data.activities.filter(a => favorites.activity.includes(a.slug));

    return (
        <div className="space-y-12">
            {places.length > 0 && (
                <section>
                    <h2 className="mb-4 font-serif text-xl font-bold text-[#0A0A0A]">Lugares</h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {places.map(p => (
                            <Link key={p.id} href={`/lugar/${p.slug}`} className="block">
                                <PlaceCard place={p} />
                            </Link>
                        ))}
                    </div>
                </section>
            )}
            {events.length > 0 && (
                <section>
                    <h2 className="mb-4 font-serif text-xl font-bold text-[#0A0A0A]">Eventos</h2>
                    <EventGridClient events={events} />
                </section>
            )}
            {activities.length > 0 && (
                <section>
                    <h2 className="mb-4 font-serif text-xl font-bold text-[#0A0A0A]">Actividades</h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {activities.map(a => (
                            <Link key={a.id} href={`/actividad/${a.slug}`} className="block hover:opacity-90 transition-opacity">
                                <ActivityCard activity={a} />
                            </Link>
                        ))}
                    </div>
                </section>
            )}
            {places.length + events.length + activities.length === 0 && (
                <p className="py-12 text-center text-sm text-[#666666]">
                    Lo que guardaste ya no está disponible (un evento que pasó o un lugar que cerró).
                </p>
            )}
        </div>
    );
}

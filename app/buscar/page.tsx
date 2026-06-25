'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { EventCardLink } from '@/components/cards/event-card-link';
import { EventExplorer } from '@/components/home/EventExplorer';
import { Input } from '@/components/ui/input';
import { normalizeHours, getOpenStatus, guatNow } from '@/lib/hours-utils';
import type { DbEvent } from '@/lib/types';

const ZONES = ['Zona 10', 'Zona 14', 'Zona 15', 'Zona 4', 'Cayalá', 'Antigua'];

type Place = {
    id: string; slug: string; name: string; zone: string;
    address?: string; tags?: string[]; hours?: unknown;
    rating?: number; rating_count?: number; primary_category?: string; primary_photo_url?: string;
};

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function BuscarContent() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [events, setEvents] = useState<DbEvent[]>([]);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPlaces, setShowPlaces] = useState(true);
    const [showEvents, setShowEvents] = useState(true);
    const [explorerIndex, setExplorerIndex] = useState<number | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const zone = searchParams.get('zone');
        const q = searchParams.get('q');
        if (zone) setSelectedZone(zone);
        if (q) setSearchQuery(q);
    }, [searchParams]);

    useEffect(() => {
        if (places.length === 0) {
            fetch('/api/places')
                .then(r => r.json())
                .then(data => setPlaces(data))
                .catch(console.error);
        }
        if (events.length === 0) {
            fetch('/api/events')
                .then(r => r.json())
                .then(data => setEvents(data))
                .catch(console.error);
        }
    }, []);

    const filteredPlaces = useMemo(() => {
        let result = places;

        if (selectedZone) {
            result = result.filter(p => p.zone === selectedZone);
        }

        if (searchQuery) {
            const q = normalize(searchQuery);
            result = result.filter(p =>
                normalize(p.name).includes(q) ||
                normalize(p.address ?? '').includes(q) ||
                p.tags?.some((tag: string) => normalize(tag).includes(q))
            );
        }

        return result;
    }, [places, selectedZone, searchQuery]);

    const filteredEvents = useMemo(() => {
        let result = events;

        if (selectedZone) {
            result = result.filter(e => e.zone === selectedZone);
        }

        if (searchQuery) {
            const q = normalize(searchQuery);
            result = result.filter(e =>
                normalize(e.title).includes(q) ||
                normalize(e.venue_name ?? '').includes(q) ||
                normalize(e.category).includes(q) ||
                e.tags.some(tag => normalize(tag).includes(q))
            );
        }

        return result;
    }, [events, selectedZone, searchQuery]);

    const showNoResults = (!showPlaces || filteredPlaces.length === 0) && (!showEvents || filteredEvents.length === 0);

    return (
        <div className="mx-auto px-8 py-10" style={{ maxWidth: '1150px' }}>
            <h1 className="font-serif text-3xl font-bold text-[#0A0A0A] mb-8">Buscar</h1>

            <div className="mb-6">
                <Input
                    type="text"
                    placeholder="Busca un restaurante, un evento, una categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-base p-3"
                />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setSelectedZone(null)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${selectedZone === null
                        ? 'bg-[#E11D2E] text-white'
                        : 'bg-[#F0F0F0] text-[#0A0A0A] hover:bg-[#E5E5E5]'
                        }`}
                >
                    Todas las zonas
                </button>

                {ZONES.map(zone => (
                    <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${selectedZone === zone
                            ? 'bg-[#E11D2E] text-white'
                            : 'bg-[#F0F0F0] text-[#0A0A0A] hover:bg-[#E5E5E5]'
                            }`}
                    >
                        {zone}
                    </button>
                ))}
            </div>

            <div className="flex gap-6 mb-8">
                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" checked={showPlaces} onChange={e => setShowPlaces(e.target.checked)} />
                    Restaurantes
                </label>
                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" checked={showEvents} onChange={e => setShowEvents(e.target.checked)} />
                    Eventos
                </label>
            </div>

            {showNoResults && (
                <div className="text-center py-12">
                    <p className="text-sm text-[#666666]">No encontramos resultados que coincidan</p>
                </div>
            )}

            {showPlaces && filteredPlaces.length > 0 && (
                <div className="mb-12">
                    <p className="text-sm text-[#666666] mb-6">
                        {filteredPlaces.length} lugar{filteredPlaces.length !== 1 ? 'es' : ''} encontrado{filteredPlaces.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlaces.map(place => {
                            const openNow = getOpenStatus(normalizeHours(place.hours), guatNow());
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
                </div>
            )}

            {showEvents && filteredEvents.length > 0 && (
                <div>
                    <p className="text-sm text-[#666666] mb-6">
                        {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event, i) => (
                            <EventCardLink
                                key={event.id}
                                event={event}
                                onOpenExplorer={() => setExplorerIndex(i)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {explorerIndex !== null && (
                <EventExplorer
                    events={filteredEvents}
                    initialIndex={explorerIndex}
                    onClose={() => setExplorerIndex(null)}
                />
            )}
        </div>
    );
}

export default function BuscarPage() {
    return (
        <Suspense fallback={<div className="mx-auto px-8 py-12" style={{ maxWidth: '1150px' }}>Cargando...</div>}>
            <BuscarContent />
        </Suspense>
    );
}

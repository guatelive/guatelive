'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { Input } from '@/components/ui/input';
import { normalizeHours, getOpenStatus, guatNow } from '@/lib/hours-utils';

const ZONES = ['Zona 10', 'Zona 14', 'Zona 15', 'Zona 4', 'Cayalá', 'Antigua'];

type Place = {
    id: string; slug: string; name: string; zone: string;
    address?: string; tags?: string[]; hours?: unknown;
    rating?: number; rating_count?: number; primary_category?: string; photo_reference?: string;
};

function BuscarContent() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
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
    }, []);

    const filteredPlaces = useMemo(() => {
        const normalize = (s: string) =>
            s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

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

    return (
        <div className="mx-auto px-8 py-10" style={{ maxWidth: '1150px' }}>
            <h1 className="font-serif text-3xl font-bold text-[#0A0A0A] mb-8">Buscar</h1>

            <div className="mb-6">
                <Input
                    type="text"
                    placeholder="Busca un restaurante, categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-base p-3"
                />
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
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

            <div>
                <p className="text-sm text-[#666666] mb-6">
                    {filteredPlaces.length} lugares encontrados
                </p>

                {filteredPlaces.length > 0 ? (
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
                ) : (
                    <div className="text-center py-12">
                        <p className="text-sm text-[#666666]">
                            No encontramos restaurantes que coincidan
                        </p>
                    </div>
                )}
            </div>
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

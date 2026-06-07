'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { Input } from '@/components/ui/input';
import { useEffect } from 'react';

const ZONES = ['Zona 10', 'Zona 14', 'Zona 15', 'Zona 4', 'Cayalá', 'Antigua'];

function zoneToSlug(zone: string): string {
    return zone
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u');
}

export default function BuscarPage() {
    const [places, setPlaces] = useState<any[]>([]);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const zone = searchParams.get('zone');
        const q = searchParams.get('q');

        if (zone) setSelectedZone(zone);
        if (q) setSearchQuery(q);
    }, [searchParams]);

    // Filtrar lugares
    const filteredPlaces = useMemo(() => {
        if (places.length === 0) return [];

        let result = places;

        if (selectedZone) {
            result = result.filter(p => p.zone === selectedZone);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.address?.toLowerCase().includes(query) ||
                p.tags?.some((tag: string) => tag.toLowerCase().includes(query))
            );
        }

        return result;
    }, [places, selectedZone, searchQuery]);

    // Cargar lugares (solo una vez)
    useEffect(() => {
        if (places.length === 0) {
            fetch('/api/places')
                .then(r => r.json())
                .then(data => setPlaces(data))
                .catch(console.error);
        }
    }, []);

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-8">Buscar</h1>

            {/* Input de búsqueda */}
            <div className="mb-8">
                <Input
                    type="text"
                    placeholder="Busca un restaurante, categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-lg p-3"
                />
            </div>

            {/* Burbujas de zonas */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => setSelectedZone(null)}
                    className={`px-4 py-2 rounded-full font-semibold transition ${selectedZone === null
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                >
                    Todas las zonas
                </button>

                {ZONES.map(zone => (
                    <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`px-4 py-2 rounded-full font-semibold transition ${selectedZone === zone
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            }`}
                    >
                        {zone}
                    </button>
                ))}
            </div>

            {/* Resultados */}
            <div>
                <p className="text-gray-600 mb-6">
                    {filteredPlaces.length} lugares encontrados
                </p>

                {filteredPlaces.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlaces.map(place => (
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
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            No encontramos restaurantes que coincidan
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
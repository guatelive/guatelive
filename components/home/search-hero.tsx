'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';

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

export function SearchHero() {
    const [places, setPlaces] = useState<any[]>([]);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(10);

    useEffect(() => {
        fetch('/api/places')
            .then(r => r.json())
            .then(data => setPlaces(data))
            .catch(console.error);
    }, []);

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

    // Limitar a displayLimit
    const displayedPlaces = filteredPlaces.slice(0, displayLimit);  // ← NUEVO


    return (
        <div className="relative">
            {/* Hero */}
            <section className="px-4 pb-10 pt-8 sm:px-6 md:pt-16">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="font-serif text-4xl leading-[1.05] text-foreground md:text-6xl">
                        Todo lo que pasa en Guate,{' '}
                        <span className="italic text-primary">en un solo lugar.</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
                        Restaurantes, cafés y eventos en Guatemala. Curados con criterio.
                    </p>

                    {/* Input de búsqueda */}
                    <div className="mx-auto mt-8 max-w-xl">
                        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-4 shadow-sm">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Busca cafés, restaurantes, eventos…"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowResults(true);
                                }}
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        {showResults && (
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedZone(null);
                                        setDisplayLimit(10);  // ← RESET limit cuando selecciona "Todas"
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedZone === null
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    Todas
                                </button>

                                {ZONES.map(zone => (
                                    <button
                                        key={zone}
                                        onClick={() => {
                                            setSelectedZone(zone);
                                            setDisplayLimit(10);  // ← RESET limit cuando selecciona zona
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedZone === zone
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                                            }`}
                                    >
                                        {zone}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Resultados de búsqueda */}
            {showResults && (displayedPlaces.length > 0 || searchQuery) && (
                <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 pb-12">
                    <p className="text-sm text-muted-foreground mb-6">
                        Mostrando {displayedPlaces.length} de {filteredPlaces.length} lugares
                    </p>

                    {displayedPlaces.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {displayedPlaces.map(place => (
                                    <Link
                                        key={place.id}
                                        href={`/lugar/${place.slug}`}
                                        className="block hover:opacity-90 transition-opacity"
                                    >
                                        <PlaceCard place={place} />
                                    </Link>
                                ))}
                            </div>

                            {/* Botón "Mostrar más" */}
                            {displayLimit < filteredPlaces.length && (
                                <button
                                    onClick={() => setDisplayLimit(displayLimit + 10)}
                                    className="mt-8 mx-auto block px-6 py-2 rounded-full border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition"
                                >
                                    Mostrar más
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                No encontramos restaurantes que coincidan
                            </p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
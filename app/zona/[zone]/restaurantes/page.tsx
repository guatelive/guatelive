import { PlaceCard } from '@/components/cards/place-card';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';


type Params = Promise<{ zone: string }>;

const ZONE_MAP: Record<string, string> = {
    'zona-10': 'Zona 10',
    'zona-4': 'Zona 4',
    'zona-14': 'Zona 14',
    'zona-15': 'Zona 15',
    'cayala': 'Cayalá',
    'antigua': 'Antigua',
};

export async function generateMetadata(props: { params: Params }) {
    const params = await props.params;
    const zoneName = ZONE_MAP[params.zone] || params.zone;

    return {
        title: `Restaurantes en ${zoneName} - GuateLive`,
        description: `Descubre los mejores restaurantes en ${zoneName}, Guatemala.`,
    };
}

export default async function ZonaRestaurantesPage(props: { params: Params }) {
    const params = await props.params;
    const zone = params.zone;
    const zoneName = ZONE_MAP[zone];

    if (!zoneName) {
        return (
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold">Zona no encontrada</h1>
                <p className="text-muted-foreground mt-4">La zona "{zone}" no existe.</p>
            </div>
        );
    }

    const supabase = await createClient();
    const { data: places, error } = await supabase
        .from('places')
        .select('*')
        .eq('zone', zoneName)
        .order('rating', { ascending: false });

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-2">
                Restaurantes en {zoneName}
            </h1>
            <p className="text-muted-foreground mb-8">
                {places?.length || 0} lugares encontrados
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-8">
                    Error: {error.message}
                </div>
            )}

            {places && places.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {places.map(place => (
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
                <p className="text-muted-foreground">
                    No hay restaurantes en {zoneName}
                </p>
            )}
        </div>
    );
}

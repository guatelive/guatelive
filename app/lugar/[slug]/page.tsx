import { createClient, createBuildTimeClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { getPlacePhotoUrl } from '@/lib/google-places';
import Link from 'next/link';
import { MapPin, Phone, Globe, Clock } from 'lucide-react';

export const revalidate = 3600; // ISR

type Params = Promise<{ slug: string }>;

// Agregar al inicio del archivo
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

export async function generateStaticParams() {
    const supabase = createBuildTimeClient();
    const { data: places } = await supabase
        .from('places')
        .select('slug')
        .eq('is_published', true);

    return (places ?? []).map(({ slug }) => ({
        slug: slug,
    }));
}

export async function generateMetadata(props: { params: Params }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: place } = await supabase
        .from('places')
        .select('*')
        .eq('slug', params.slug)
        .single();

    if (!place) {
        return { title: 'Lugar no encontrado' };
    }

    return {
        title: `${place.name} - GuateLive`,
        description: place.address || `Descubre ${place.name} en GuateLive`,
        openGraph: {
            title: place.name,
            description: place.address,
            type: 'website',
        },
    };
}

export default async function LugarPage(props: { params: Params }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: place } = await supabase
        .from('places')
        .select('*')
        .eq('slug', params.slug)
        .single();

    if (!place) {
        return <div className="container py-12">Lugar no encontrado</div>;
    }

    const imageUrl = getPlacePhotoUrl(place.photo_reference);
    const whatsappUrl = place.phone
        ? `https://wa.me/502${place.phone.replace(/\s/g, '')}`
        : null;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Imagen principal */}
            <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={place.name}
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Información principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h1 className="text-4xl font-bold mb-2">{place.name}</h1>

                    {/* Rating */}
                    {place.rating && (
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-500 text-xl">★</span>
                            <span className="text-lg font-semibold">{place.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({place.rating_count} reseñas)</span>
                        </div>
                    )}

                    {/* Categoría */}
                    {place.category && (
                        <p className="text-gray-600 mb-4 text-lg">{place.category}</p>
                    )}

                    {/* Descripción */}
                    {place.description && (
                        <p className="text-gray-700 mb-6 leading-relaxed">
                            {place.description}
                        </p>
                    )}

                    {/* Tags */}
                    {place.tags && place.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {place.tags.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar de contacto */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                        <h3 className="font-bold text-lg mb-4">Información</h3>

                        {/* Ubicación */}
                        {place.address && (
                            <div className="flex gap-3 mb-4">
                                <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-sm">Ubicación</p>
                                    <p className="text-sm text-gray-600">{place.address}</p>
                                </div>
                            </div>
                        )}

                        {/* Teléfono */}
                        {place.phone && (
                            <div className="flex gap-3 mb-4">
                                <Phone className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-sm">Teléfono</p>
                                    <p className="text-sm text-gray-600">{place.phone}</p>
                                </div>
                            </div>
                        )}

                        {/* Horarios */}
                        {place.hours && (
                            <div className="flex gap-3 mb-4">
                                <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-sm">Horarios</p>
                                    {place.hours.weekday_text?.map((day: string, i: number) => (
                                        <p key={i} className="text-xs text-gray-600">
                                            {day}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Website */}
                        {place.website && (
                            <div className="flex gap-3 mb-6">
                                <Globe className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-sm">Sitio web</p>
                                    <Link
                                        href={place.website}
                                        target="_blank"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Visitar →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* CTAs */}
                        <div className="space-y-2">
                            {whatsappUrl && (
                                <Link
                                    href={whatsappUrl}
                                    target="_blank"
                                    className="block w-full bg-green-500 text-white py-2 rounded text-center font-semibold hover:bg-green-600"
                                >
                                    WhatsApp
                                </Link>
                            )}
                            <Link
                                href={`/zona/${zoneToSlug(place.zone)}/restaurantes`}
                                className="block w-full bg-gray-900 text-white py-2 rounded text-center font-semibold hover:bg-gray-800"
                            >
                                Volver a {place.zone}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
/**
 * Genera URL de foto de Google Places
 * Si no hay referencia, devuelve fallback de Unsplash
 */
export function getPlacePhotoUrl(
    photoReference: string | null | undefined,
    maxWidth: number = 400
): string {
    if (!photoReference) {
        // Fallback: foto genérica de Unsplash
        return 'https://images.unsplash.com/photo-1555939594-58d7cb561404?w=400&h=300&fit=crop';
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
}
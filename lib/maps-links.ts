type MapPlace = {
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    google_maps_url?: string | null;
};

export type MapLinks = { google: string; waze: string };

// Texto para buscar en el mapa: venue + zona + país, sin repetir lo que el venue ya
// trae (muchos ya dicen "..., zona 1" o "..., Antigua Guatemala").
function searchQuery(name: string, zone: string): string {
    const lower = name.toLowerCase();
    return [name, ...[zone, 'Guatemala'].filter(part => !lower.includes(part.toLowerCase()))].join(', ');
}

// Links directos a Google Maps y Waze — no usan las APIs, no tienen costo. Con un lugar
// catalogado van a sus coordenadas; con nombre libre, a una búsqueda (puede fallar si el
// texto es vago). Sin nombre de lugar devuelve null: mandar a "Zona 9" entera no ayuda.
export function mapLinks(place: MapPlace | null, venueName: string | null, zone: string): MapLinks | null {
    const hasCoords = place?.latitude != null && place.longitude != null;
    const name = place?.name ?? venueName;
    if (!hasCoords && !name) return null;

    const query = hasCoords ? `${place.latitude},${place.longitude}` : searchQuery(name!, zone);
    const encoded = encodeURIComponent(query);
    return {
        google: place?.google_maps_url ?? `https://www.google.com/maps/search/?api=1&query=${encoded}`,
        waze: hasCoords
            ? `https://www.waze.com/ul?ll=${encoded}&navigate=yes`
            : `https://www.waze.com/ul?q=${encoded}&navigate=yes`,
    };
}

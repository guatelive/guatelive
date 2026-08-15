// Deriva un valor de `events.zone` (NOT NULL en DB) a partir de texto libre
// (dirección, nombre de venue). Nunca adivina: si el texto no contiene un venue
// conocido (venue-zone-overrides.ts), una zona numerada ("Zona 10") ni uno de los
// municipios/áreas ya usados como zona en la app (confirmado contra valores reales
// de `places.zone` en producción), devuelve null y el caller descarta el evento —
// mismo criterio "sin fuzzy matching" que scripts/bank-sources/match-place.ts.

import { VENUE_ZONE_OVERRIDES } from './venue-zone-overrides';

const KNOWN_AREAS = [
    'Antigua',
    'Carretera a El Salvador',
    'Cayalá',
    'Villa Nueva',
    'Mixco',
    'San Cristóbal',
];

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

export function extractZone(text: string | null): string | null {
    if (!text) return null;
    const normalized = normalize(text);

    for (const [venue, zone] of Object.entries(VENUE_ZONE_OVERRIDES)) {
        if (normalized.includes(normalize(venue))) return zone;
    }

    const zonaMatch = text.match(/zona\s*(\d{1,2})\b/i);
    if (zonaMatch) return `Zona ${parseInt(zonaMatch[1], 10)}`;

    for (const area of KNOWN_AREAS) {
        if (normalized.includes(normalize(area))) return area;
    }

    return null;
}

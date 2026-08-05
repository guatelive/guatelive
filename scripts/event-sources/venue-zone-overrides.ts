// Venues conocidos cuya zona no se puede derivar por texto (el nombre del venue no
// trae "Zona N" ni el nombre de un área ya reconocida por zone-extract.ts). Se
// consulta ANTES del regex/substring genérico — ver zone-extract.ts.
//
// Cada entrada acá es zona confirmada por Fredy o ya usada en `events`/`places` en
// producción (nunca una zona asumida por conocimiento general del modelo — mismo
// criterio "nunca fabricar" del resto del proyecto).
//
// Confirmado contra `events.venue_name`/`events.zone` reales el 2026-08-03:
// DEMUSEO Century Plaza, Parque de la Industria, Hotel Barcelo, Forum Majadas,
// Iglesia el Shaddai.
//
// Confirmado por Fredy directo el 2026-08-04 (venues recurrentes de eticket.gt y
// eventos.guatemala.com que no traían zona en el texto de la fuente): Centro
// Cultural Miguel Ángel Asturias, Explanada 5 (nota de Fredy: NO es la Explanada de
// la Feria/Parque de la Industria — es un recinto distinto en Zona 5), Estadio
// Cementos Progreso, Hotel Westin Camino Real, Alianza Francesa, Zoológico La
// Aurora, Ermita de la Santa Cruz (en Antigua Guatemala, no zona numerada).
export const VENUE_ZONE_OVERRIDES: Record<string, string> = {
    'demuseo century plaza': 'Zona 13',
    'parque de la industria': 'Zona 9',
    'concha acustica - parque de la industria': 'Zona 9',
    'hotel barcelo': 'Zona 9',
    'forum majadas': 'Zona 11',
    'iglesia el shaddai': 'Zona 14',
    'centro cultural miguel angel asturias': 'Zona 1',
    'explanada 5': 'Zona 5',
    'estadio cementos progreso': 'Zona 6',
    'hotel westin camino real': 'Zona 10',
    'alianza francesa': 'Zona 13',
    'zoologico la aurora': 'Zona 13',
    'ermita de la santa cruz': 'Antigua',
};

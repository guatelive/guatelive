// Mapea la categoría cruda de una fuente externa a una de las 9 EVENT_CATEGORIES
// fijas (lib/event-categories.ts). Fallback siempre 'Otros' — nunca se inventa una
// categoría nueva ni se le asigna algo específico sin evidencia clara de la fuente
// (regla de docs/business-rules.md).

import type { EventCategory } from '@/lib/event-categories';

// Confirmado contra los slugs de URL reales usados por eventos.guatemala.com
// (culturales, musica-conciertos, sociales, talleres-conferencias,
// eventos-familiares, deportes, gastronomia) — no hay slug propio para "Vida
// Nocturna" ni "Aventura y Naturaleza" en esta fuente, y "sociales" es demasiado
// ambiguo (fiestas/galas variadas) para mapear a algo más específico que 'Otros'.
const GUATEMALA_COM_MAP: Record<string, EventCategory> = {
    'culturales': 'Cultura',
    'musica-conciertos': 'Música',
    'talleres-conferencias': 'Talleres',
    'eventos-familiares': 'Familiar',
    'deportes': 'Deportes',
    'gastronomia': 'Gastronomía',
};

export function mapGuatemalaComCategory(rawCategory: string | null): EventCategory {
    if (!rawCategory) return 'Otros';
    return GUATEMALA_COM_MAP[rawCategory] ?? 'Otros';
}

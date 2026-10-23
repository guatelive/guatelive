// Detecta categoría a partir del título del evento, para fuentes que no exponen
// categoría real en HTML estático (eticket.gt — ver eticket.ts). Cobertura
// necesariamente parcial: la mayoría de títulos en eticket.gt son solo el nombre del
// artista ("EMINENCE", "OZUNA", "CAZZU"), sin ninguna palabra que indique el tipo de
// evento — se investigó si había una forma de conseguir la categoría real (eticket.gt
// sí la tiene, pero detrás de una API privada con autenticación por "guest token",
// `api.eticket.com.gt/v2/...` — no es un endpoint público documentado, y usarlo cruza
// a la misma zona gris que ya se evitó con eventos.guatemala.com: apoyarse en algo que
// el sitio no expone para consumo de terceros). Por eso esto es best-effort por
// keyword, nunca "todo lo que no matchea es Música" — un título sin señal clara se va
// a 'Otros', igual que antes.
import type { EventCategory } from '@/lib/event-categories';

// El orden importa: gana la primera regla que matchea (ej. "Festival de la Mujer" es
// Familiar antes que Festivales; "Taller" antes que "Charlas").
const KEYWORD_CATEGORY: [RegExp, EventCategory][] = [
    [/carrera|marat[oó]n|\b\d{1,2}k\b|\brun\b|hyrox|triatl[oó]n/i, 'Deportes'],
    [/semana santa|procesi[oó]n|alfombra|barrilete|convite|quema del diablo|independencia|d[ií]a de (los )?(muertos|difuntos)/i, 'Tradiciones'],
    [/teatro|obra de teatro|comedia|stand[\s-]?up|improv/i, 'Teatro y Comedia'],
    [/\bcine\b|pel[ií]cula|proyecci[oó]n|film/i, 'Cine'],
    [/yoga|meditaci[oó]n|retiro|sound healing|mindfulness|bienestar/i, 'Bienestar'],
    [/taller|workshop|clase de/i, 'Talleres'],
    [/congreso|conferencia|expo\b|feria de negocios|invertur|networking|charla|summit|foro\b/i, 'Charlas y Negocios'],
    [/festival de la mujer|d[ií]a del ni[ñn]o|infantil|familiar/i, 'Familiar'],
    [/festival|feria|matsuri|bazar|mercadito|mercado de/i, 'Festivales y Ferias'],
    [/concierto|en concierto|tour\b|gira\b|sinf[oó]nico/i, 'Música'],
];

export function detectCategoryFromTitle(title: string): EventCategory {
    for (const [pattern, category] of KEYWORD_CATEGORY) {
        if (pattern.test(title)) return category;
    }
    return 'Otros';
}

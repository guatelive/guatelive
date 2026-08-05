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

const KEYWORD_CATEGORY: [RegExp, EventCategory][] = [
    [/carrera|marat[oó]n|\b\d{1,2}k\b|hyrox|triatl[oó]n/i, 'Deportes'],
    [/teatro|obra de teatro|comedia|stand[\s-]?up/i, 'Cultura'],
    [/taller|congreso|conferencia|expo\b|feria de negocios/i, 'Talleres'],
    [/festival de la mujer|d[ií]a del ni[ñn]o|infantil|familiar/i, 'Familiar'],
    [/concierto|en concierto|tour\b|gira\b|sinf[oó]nico/i, 'Música'],
];

export function detectCategoryFromTitle(title: string): EventCategory {
    for (const [pattern, category] of KEYWORD_CATEGORY) {
        if (pattern.test(title)) return category;
    }
    return 'Otros';
}

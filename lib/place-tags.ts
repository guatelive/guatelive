// Taxonomía de tags para lugares — extraída de ALLOWED_TAGS en scripts/auto-tag-places.ts
// (única fuente hasta ahora, usada por el pipeline de Claude API para taggear lugares).
// Documentada también en Notion ("Taxonomia TAGS", bajo "Guate Live") junto con
// EVENT_TAG_GROUPS de eventos, para que sea la única fuente de verdad de tags del sitio.
// Si se agrega un tag nuevo acá, agregarlo también a ALLOWED_TAGS en el script para que
// el pipeline de IA y el CMS manual no diverjan.
export const PLACE_TAG_GROUPS: { label: string; tags: string[] }[] = [
    {
        label: 'Ocasión',
        tags: ['cena-romantica', 'brunch', 'almuerzo-ejecutivo', 'cumpleanos', 'familia', 'amigos', 'primera-cita', 'aniversario'],
    },
    {
        label: 'Ambiente',
        tags: ['tranquilo', 'animado', 'minimalista', 'rustico', 'moderno', 'acogedor', 'elegante', 'casual'],
    },
    {
        label: 'Precio',
        tags: ['economico', 'moderado', 'premium', 'lujo'],
    },
    {
        label: 'Características',
        tags: ['terraza', 'vista-al-lago', 'estacionamiento', 'reservaciones', 'valet', 'pet-friendly', 'wifi', 'bar'],
    },
    {
        label: 'Tipo de lugar',
        tags: ['restaurante', 'cafe', 'bar', 'panaderia', 'fast-food'],
    },
    {
        label: 'Cocina',
        tags: ['guatemalteca', 'mexicana', 'italiana', 'americana', 'japonesa', 'china', 'fusion', 'mediterranea', 'francesa', 'peruana', 'espanola'],
    },
];

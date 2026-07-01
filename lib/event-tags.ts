// Taxonomía sugerida de tags para eventos — punto de partida, no lista cerrada.
// Documentada también en Notion ("Taxonomia TAGS", bajo "Guate Live") junto con
// ALLOWED_TAGS de places, para que sea la única fuente de verdad de tags del sitio.
export const EVENT_TAG_GROUPS: { label: string; tags: string[] }[] = [
    {
        label: 'Aire libre y deporte',
        tags: [
            'senderismo', 'trekking', 'ciclismo', 'running', 'yoga', 'crossfit',
            'escalada', 'camping', 'kayak', 'mtb', 'maraton', 'aire-libre',
        ],
    },
    {
        label: 'Cultura y arte',
        tags: [
            'literario', 'teatro', 'cine', 'exposicion', 'arte', 'museo', 'danza',
            'fotografia', 'poesia', 'club-de-lectura',
        ],
    },
    {
        label: 'Música',
        tags: [
            'concierto', 'dj-set', 'jazz', 'rock', 'electronica', 'salsa',
            'musica-en-vivo', 'karaoke', 'banda-local', 'acustico',
        ],
    },
    {
        label: 'Gastronomía',
        tags: [
            'food-truck', 'degustacion', 'maridaje', 'vino', 'cerveza-artesanal',
            'brunch', 'pop-up', 'clase-de-cocina', 'cafe-de-especialidad',
        ],
    },
    {
        label: 'Vida nocturna',
        tags: [
            'after-office', 'fiesta-tematica', 'bar-crawl', 'noche-de-trivia',
            'stand-up-comedy', 'drag-show',
        ],
    },
    {
        label: 'Familiar',
        tags: ['apto-para-ninos', 'mascotas-bienvenidas', 'picnic', 'feria'],
    },
    {
        label: 'Bienestar',
        tags: ['mindfulness', 'meditacion', 'retiro', 'spa-day', 'sound-healing'],
    },
    {
        label: 'Negocios y aprendizaje',
        tags: ['networking', 'charla', 'conferencia', 'taller', 'workshop', 'emprendimiento'],
    },
    {
        label: 'Temporada y especiales',
        tags: ['navideno', 'halloween', 'ano-nuevo', 'benefico', 'edicion-limitada'],
    },
];

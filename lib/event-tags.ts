// Taxonomía sugerida de tags para eventos — punto de partida, no lista cerrada.
// Documentada también en Notion ("Taxonomia TAGS", bajo "Guate Live") junto con
// ALLOWED_TAGS de places, para que sea la única fuente de verdad de tags del sitio.
export const EVENT_TAG_GROUPS: { label: string; tags: string[] }[] = [
    {
        label: 'Deportes',
        tags: [
            'running', 'run-club', 'ciclismo', 'mtb', 'yoga', 'pilates', 'crossfit',
            'spinning', 'hyrox', 'futbol', 'basquetbol', 'voleibol', 'tenis', 'padel',
            'pickleball', 'natacion', 'triatlon', 'maraton', 'carrera-5k', 'carrera-10k',
            'boxeo', 'artes-marciales', 'escalada', 'skate', 'surf', 'golf', 'torneo',
            'partido',
        ],
    },
    {
        label: 'Aire libre y naturaleza',
        tags: [
            'senderismo', 'trekking', 'volcan', 'camping', 'kayak', 'aire-libre',
            'observacion-de-aves', 'playa', 'lago',
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
            'concierto', 'dj-set', 'jazz', 'rock', 'electronica', 'salsa', 'bachata', 'baile',
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
        tags: ['mindfulness', 'meditacion', 'retiro', 'spa-day', 'sound-healing', 'breathwork'],
    },
    {
        label: 'Festivales y tradiciones',
        tags: [
            'festival', 'mercado', 'bazar', 'semana-santa', 'alfombras', 'fiestas-patrias',
            'dia-de-muertos', 'barriletes', 'quema-del-diablo',
        ],
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

// Intereses de moda: tags puntuales que la gente busca por nombre ("run club",
// "yoga gratis") aunque vivan dentro de una categoría amplia (Deportes, Bienestar).
// Son los candidatos a chip de filtro en /eventos/hoy y /actividades, a burbuja y a
// página propia (/actividades/running) — no categorías. Cambiar esta lista cuando
// algo se ponga (o se pase) de moda; no requiere recategorizar nada.
export const FEATURED_TAGS: { tag: string; label: string; emoji: string }[] = [
    { tag: 'running', label: 'Running', emoji: '🏃' },
    { tag: 'yoga', label: 'Yoga', emoji: '🧘' },
    { tag: 'pilates', label: 'Pilates', emoji: '🤸' },
    { tag: 'ciclismo', label: 'Ciclismo', emoji: '🚴' },
    { tag: 'padel', label: 'Pádel', emoji: '🎾' },
    { tag: 'senderismo', label: 'Senderismo', emoji: '🥾' },
    { tag: 'volcan', label: 'Volcanes', emoji: '🌋' },
    { tag: 'baile', label: 'Baile', emoji: '💃' },
];

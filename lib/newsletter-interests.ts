// Opciones de "¿Qué te interesa?" del newsletter. Mismos nombres que las burbujas
// de la búsqueda y las categorías de eventos, para que después "lo nuevo de lo tuyo"
// se pueda armar con los mismos tags. Cambiar `value` rompe los intereses ya
// guardados: agregar opciones nuevas, no renombrar las existentes.
export const NEWSLETTER_INTERESTS = [
    { value: 'cita-romantica', label: '🍷 Cita romántica' },
    { value: 'plan-familiar', label: '👨‍👩‍👧 Plan familiar' },
    { value: 'con-mi-perro', label: '🐶 Con mi perro' },
    { value: 'salir-de-fiesta', label: '🎉 Salir de fiesta' },
    { value: 'drinks', label: '🍸 Drinks' },
    { value: 'cafe', label: '☕ Un café' },
    { value: 'brunch', label: '🥂 Brunch' },
    { value: 'trabajar', label: '💻 Trabajar' },
    { value: 'conciertos', label: '🎵 Conciertos y música' },
    { value: 'cultura', label: '🎨 Cultura y arte' },
    { value: 'deportes', label: '🏃 Deportes y aire libre' },
    { value: 'promos', label: '💳 Promos bancarias' },
] as const;

export type NewsletterInterest = typeof NEWSLETTER_INTERESTS[number]['value'];

export const NEWSLETTER_INTEREST_VALUES = NEWSLETTER_INTERESTS.map(i => i.value) as [NewsletterInterest, ...NewsletterInterest[]];

// Cómo se muestran en el paso 2 del newsletter ("¿Qué te gustaría recibir?").
export const NEWSLETTER_INTEREST_GROUPS: { label: string; values: NewsletterInterest[] }[] = [
    { label: 'Planes para salir', values: ['cita-romantica', 'plan-familiar', 'con-mi-perro', 'salir-de-fiesta', 'drinks', 'cafe', 'brunch', 'trabajar'] },
    { label: 'Eventos y actividades', values: ['conciertos', 'cultura', 'deportes'] },
    { label: 'Ahorrar', values: ['promos'] },
];

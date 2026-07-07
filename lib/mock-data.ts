// Mock data para el prototipo GuateLive
export type Place = {
  slug: string;
  name: string;
  category: string;
  zone: string;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  price: 1 | 2 | 3 | 4;
  tags: string[];
  distance: string;
  openNow: boolean;
  hoursToday?: string;
  description?: string[];
  address?: string;
  phone?: string;
};

export type EventItem = {
  slug: string;
  title: string;
  venue: string;
  venueSlug?: string;
  day: string;
  month: string;
  time: string;
  price: string;
  image: string;
  description?: string;
};

export type Featured = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  offer: string;
  cta: string;
  href: string;
  accent: "dark" | "red";
};

export const categories = [
  { slug: "comida", label: "Comida", icon: "UtensilsCrossed" },
  { slug: "cafe", label: "Café", icon: "Coffee" },
  { slug: "vida-nocturna", label: "Vida Nocturna", icon: "Wine" },
  { slug: "eventos", label: "Eventos", icon: "CalendarDays" },
  { slug: "cultura", label: "Cultura", icon: "Landmark" },
  { slug: "servicios", label: "Servicios", icon: "Sparkles" },
];

const img = (id: string, w = 800, h = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const places: Place[] = [
  {
    slug: "cafe-barista-zona-10",
    name: "Café Barista",
    category: "Cafeterías",
    zone: "Zona 10",
    image: img("photo-1554118811-1e0d58224f24"),
    rating: 4.6,
    reviews: 482,
    price: 2,
    tags: ["WiFi", "Para trabajar", "Brunch"],
    distance: "1.2 km",
    openNow: true,
    hoursToday: "7:00 — 21:00",
  },
  {
    slug: "sophos-zona-10",
    name: "Sophos",
    category: "Librería + Café",
    zone: "Zona 10",
    image: img("photo-1521017432531-fbd92d768814"),
    rating: 4.8,
    reviews: 1203,
    price: 2,
    tags: ["Libros", "Tranquilo", "WiFi"],
    distance: "0.8 km",
    openNow: true,
    hoursToday: "9:00 — 20:00",
  },
  {
    slug: "byoscar-zona-14",
    name: "ByOscar",
    category: "Cafetería de especialidad",
    zone: "Zona 14",
    image: img("photo-1453614512568-c4024d13c247"),
    rating: 4.7,
    reviews: 326,
    price: 3,
    tags: ["Specialty", "Pet friendly"],
    distance: "3.1 km",
    openNow: true,
    hoursToday: "7:30 — 19:00",
  },
  {
    slug: "saul-coffee-cayala",
    name: "Saúl Coffee",
    category: "Cafetería",
    zone: "Cayalá",
    image: img("photo-1497935586351-b67a49e012bf"),
    rating: 4.5,
    reviews: 891,
    price: 3,
    tags: ["Brunch", "Terraza"],
    distance: "5.4 km",
    openNow: false,
    hoursToday: "Cerrado hoy",
  },
  {
    slug: "cafetto-zona-4",
    name: "Cafetto",
    category: "Cafetería",
    zone: "Zona 4",
    image: img("photo-1559925393-8be0ec4767c8"),
    rating: 4.4,
    reviews: 215,
    price: 1,
    tags: ["Local", "Económico"],
    distance: "4.2 km",
    openNow: true,
    hoursToday: "8:00 — 18:00",
  },
  {
    slug: "cadejo-brewing-zona-4",
    name: "Cadejo Brewing Co.",
    category: "Cervecería artesanal",
    zone: "Zona 4",
    image: img("photo-1436076863939-06870fe779c2"),
    rating: 4.7,
    reviews: 1840,
    price: 2,
    tags: ["Cerveza artesanal", "Música en vivo", "Pet friendly"],
    distance: "4.0 km",
    openNow: true,
    hoursToday: "16:00 — 00:00",
    address: "4a Avenida 14-22, Zona 4, 4 Grados Norte",
    phone: "+502 2245 0123",
  },
  {
    slug: "hacienda-real-zona-10",
    name: "Hacienda Real",
    category: "Restaurante",
    zone: "Zona 10",
    image: img("photo-1414235077428-338989a2e8c0"),
    rating: 4.6,
    reviews: 2310,
    price: 3,
    tags: ["Carnes", "Familiar"],
    distance: "1.5 km",
    openNow: true,
    hoursToday: "12:00 — 23:00",
  },
  {
    slug: "kacao-zona-10",
    name: "Kacao",
    category: "Cocina guatemalteca",
    zone: "Zona 10",
    image: img("photo-1555396273-367ea4eb4db5"),
    rating: 4.5,
    reviews: 1456,
    price: 3,
    tags: ["Tradicional", "Turistas"],
    distance: "1.1 km",
    openNow: true,
    hoursToday: "12:00 — 22:00",
  },
  {
    slug: "antigua-brewing-antigua",
    name: "Antigua Brewing Co.",
    category: "Cervecería + Rooftop",
    zone: "Antigua",
    image: img("photo-1572116469696-31de0f17cc34"),
    rating: 4.8,
    reviews: 3120,
    price: 3,
    tags: ["Rooftop", "Cerveza"],
    distance: "45 km",
    openNow: true,
    hoursToday: "12:00 — 00:00",
  },
];

export const featured: Featured[] = [
  {
    id: "f1",
    kicker: "Experiencia destacada",
    title: "Amanecer sobre el Volcán de Agua",
    subtitle: "Desayuno en altura con vista a tres volcanes. Una mañana que no se olvida.",
    location: "Antigua Guatemala · 1h desde la ciudad",
    image: img("photo-1539635278303-d4002c07eae3", 1600, 1000),
    offer: "Desde Q295 · incluye transporte",
    cta: "Reservar lugar",
    href: "/eventos",
    accent: "dark",
  },
  {
    id: "f2",
    kicker: "Promo del mes",
    title: "Cadejo Brewing · Noches de jueves",
    subtitle: "2x1 en pintas de la casa más pizza al horno de leña hasta las 9 pm.",
    location: "4 Grados Norte · Zona 4",
    image: img("photo-1436076863939-06870fe779c2", 1600, 1000),
    offer: "25% OFF con BAC Credomatic",
    cta: "Ver promo",
    href: "/promos",
    accent: "red",
  },
  {
    id: "f3",
    kicker: "Ruta editorial",
    title: "Café de especialidad por Zona 14",
    subtitle: "Siete cafeterías escogidas a mano, todas en menos de 2 km a la redonda.",
    location: "Zona 14 · Guatemala City",
    image: img("photo-1453614512568-c4024d13c247", 1600, 1000),
    offer: "Guía gratuita · 7 paradas",
    cta: "Leer la guía",
    href: "/buscar",
    accent: "dark",
  },
  {
    id: "f4",
    kicker: "Fin de semana",
    title: "Mercado de diseño en Cayalá",
    subtitle: "60+ marcas locales, food trucks y música en vivo todo el sábado.",
    location: "Paseo Cayalá · sábado 24 mayo",
    image: img("photo-1414235077428-338989a2e8c0", 1600, 1000),
    offer: "Entrada libre · 10am — 8pm",
    cta: "Cómo llegar",
    href: "/eventos",
    accent: "dark",
  },
];

export const events: EventItem[] = [
  {
    slug: "jazz-night-antigua-brewing",
    title: "Jazz Night con Quinteto Solar",
    venue: "Antigua Brewing Co.",
    day: "22",
    month: "MAY",
    time: "20:00",
    price: "Q150",
    image: img("photo-1415201364774-f6f0bb35f28f"),
  },
  {
    slug: "feria-libro-cultural",
    title: "Feria del Libro Centroamericana",
    venue: "Centro Cultural Miguel Ángel Asturias",
    day: "24",
    month: "MAY",
    time: "10:00",
    price: "Gratis",
    image: img("photo-1495446815901-a7297e633e8d"),
  },
  {
    slug: "cine-frances-alianza",
    title: "Ciclo de Cine Francés",
    venue: "Alianza Francesa",
    day: "25",
    month: "MAY",
    time: "19:00",
    price: "Q30",
    image: img("photo-1489599849927-2ee91cede3ba"),
  },
  {
    slug: "stand-up-cadejo",
    title: "Noche de Stand Up Chapín",
    venue: "Cadejo Brewing Co.",
    day: "26",
    month: "MAY",
    time: "21:00",
    price: "Q80",
    image: img("photo-1527224857830-43a7acc85260"),
  },
  {
    slug: "expo-arte-iga",
    title: "Expo: Jóvenes Artistas Guatemaltecos",
    venue: "IGA",
    day: "28",
    month: "MAY",
    time: "18:00",
    price: "Gratis",
    image: img("photo-1531058020387-3be344556be6"),
  },
];

export const zones = [
  "Zona 1", "Zona 4", "Zona 10", "Zona 14", "Zona 15",
  "Cayalá", "Carretera al Salvador", "Antigua Guatemala",
];

export function findPlace(slug: string) {
  return places.find((p) => p.slug === slug);
}
export function findEvent(slug: string) {
  return events.find((e) => e.slug === slug);
}

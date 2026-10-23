import {
    Mountain, Music, Palette, Trophy, UtensilsCrossed,
    Moon, Wrench, Users, Star, PartyPopper, Drama, Flower2,
    Presentation, Landmark, Clapperboard, type LucideIcon,
} from 'lucide-react';

export const EVENT_CATEGORIES = [
    'Aventura y Naturaleza',
    'Cultura',
    'Música',
    'Deportes',
    'Gastronomía',
    'Vida Nocturna',
    'Talleres',
    'Familiar',
    'Festivales y Ferias',
    'Teatro y Comedia',
    'Bienestar',
    'Charlas y Negocios',
    'Tradiciones',
    'Cine',
    'Otros',
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

export const EVENT_CATEGORY_BADGE: Record<EventCategory, { bg: string; fg: string }> = {
    'Aventura y Naturaleza': { bg: '#EFF4E8', fg: '#4A6B22' },
    'Cultura':               { bg: '#F3ECE2', fg: '#6B4A2A' },
    'Música':                { bg: '#E6F1FB', fg: '#185FA5' },
    'Deportes':              { bg: '#FBEBDD', fg: '#8A4B16' },
    'Gastronomía':           { bg: '#FBEFD8', fg: '#8A5A00' },
    'Vida Nocturna':         { bg: '#F3ECE2', fg: '#6B4A2A' },
    'Talleres':              { bg: '#F0EDE4', fg: '#5C5440' },
    'Familiar':              { bg: '#FBEFD8', fg: '#854F0B' },
    'Festivales y Ferias':   { bg: '#F3E8FB', fg: '#7A2E9E' },
    'Teatro y Comedia':      { bg: '#EEE9F8', fg: '#4F3B8A' },
    'Bienestar':             { bg: '#E6F4EF', fg: '#1F6B52' },
    'Charlas y Negocios':    { bg: '#E9EEF3', fg: '#34506B' },
    'Tradiciones':           { bg: '#FBEADF', fg: '#9A4A1C' },
    'Cine':                  { bg: '#ECECEC', fg: '#2E2E2E' },
    'Otros':                 { bg: '#F1EFE8', fg: '#5F5E5A' },
};

export const EVENT_CATEGORY_ICON: Record<EventCategory, LucideIcon> = {
    'Aventura y Naturaleza': Mountain,
    'Música':                Music,
    'Cultura':               Palette,
    'Deportes':              Trophy,
    'Gastronomía':           UtensilsCrossed,
    'Vida Nocturna':         Moon,
    'Talleres':              Wrench,
    'Familiar':              Users,
    'Festivales y Ferias':   PartyPopper,
    'Teatro y Comedia':      Drama,
    'Bienestar':             Flower2,
    'Charlas y Negocios':    Presentation,
    'Tradiciones':           Landmark,
    'Cine':                  Clapperboard,
    'Otros':                 Star,
};

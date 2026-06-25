import {
    Mountain, Music, Palette, Trophy, UtensilsCrossed,
    Moon, Wrench, Users, Star, type LucideIcon,
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
    'Otros':                 Star,
};

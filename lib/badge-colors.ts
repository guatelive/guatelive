export type BadgeColorValue = { bg: string; text: string };

type StoredColor = string | BadgeColorValue; // string = cls legacy, object = hex custom

const COLORS_KEY    = 'guatelive:badge-colors';
const DISMISSED_KEY = 'guatelive:dismissed-badges';

function getCustomColors(): Record<string, StoredColor> {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(COLORS_KEY) ?? '{}'); }
    catch { return {}; }
}

export function saveCustomBadgeColor(text: string, value: BadgeColorValue): void {
    const map = getCustomColors();
    map[text] = value;
    localStorage.setItem(COLORS_KEY, JSON.stringify(map));
}

export function getDismissedBadges(): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]'); }
    catch { return []; }
}

export function dismissBadgeSuggestion(text: string): void {
    const list = getDismissedBadges();
    if (!list.includes(text)) {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, text]));
    }
}

export type BadgeRenderStyle =
    | { type: 'class'; cls: string }
    | { type: 'inline'; bg: string; text: string };

function getKeywordStyle(badge: string): BadgeRenderStyle | null {
    if (badge.includes('LO MEJOR')) return { type: 'class', cls: 'bg-[#0A0A0A] text-white' };
    if (badge.includes('PEDÍ ESTO')) return { type: 'class', cls: 'bg-[#E11D2E] text-white' };
    if (badge.includes('ESTÁ BIEN')) return { type: 'class', cls: 'border border-gray-300 bg-white text-gray-500' };
    if (badge.includes('PICANTE')) return { type: 'class', cls: 'bg-[#FDF0F1] text-[#A32D2D]' };
    if (badge.includes('CARBÓN') || badge.includes('AHUMADO')) return { type: 'class', cls: 'bg-[#FBEBDD] text-[#8A4B16]' };
    if (badge.includes('QUESO') || badge.includes('GENEROSA')) return { type: 'class', cls: 'bg-[#FBEFD8] text-[#8A5A00]' };
    if (badge.includes('ATÚN') || badge.includes('MARISCO')) return { type: 'class', cls: 'bg-[#E6F1FB] text-[#185FA5]' };
    if (badge.includes('CRUJIENTE') || badge.includes('CREMOSO')) return { type: 'class', cls: 'bg-[#F3ECE2] text-[#6B4A2A]' };
    if (badge.includes('MARINADO')) return { type: 'class', cls: 'bg-[#FBEBDD] text-[#8A4B16]' };
    return null;
}

// SSR-safe — no localStorage. Use this for initial useState value.
export function getBadgeStyleStatic(badge: string): BadgeRenderStyle {
    return getKeywordStyle(badge) ?? { type: 'class', cls: 'bg-[#F1EFE8] text-[#5F5E5A]' };
}

// Full resolution including custom localStorage colors. Client-only.
export function getBadgeStyle(badge: string): BadgeRenderStyle {
    const kw = getKeywordStyle(badge);
    if (kw) return kw;

    const stored = getCustomColors()[badge];
    if (stored) {
        if (typeof stored === 'string') return { type: 'class', cls: stored };
        return { type: 'inline', bg: stored.bg, text: stored.text };
    }
    return { type: 'class', cls: 'bg-[#F1EFE8] text-[#5F5E5A]' };
}

// Kept for server components that only need a className
export function getBadgeCls(badge: string): string {
    const s = getBadgeStyle(badge);
    return s.type === 'class' ? s.cls : 'bg-[#F1EFE8] text-[#5F5E5A]';
}

export function contrastColor(hex: string): string {
    if (hex.length !== 7) return '#0A0A0A';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#0A0A0A' : '#FFFFFF';
}

export const BADGE_PRESETS = [
    { key: 'black',  label: 'Destacado',   bg: '#0A0A0A' },
    { key: 'red',    label: 'Importante',  bg: '#E11D2E' },
    { key: 'rlight', label: 'Picante',     bg: '#FDF0F1' },
    { key: 'orange', label: 'Ahumado',     bg: '#FBEBDD' },
    { key: 'yellow', label: 'Especial',    bg: '#FBEFD8' },
    { key: 'blue',   label: 'Marino',      bg: '#E6F1FB' },
    { key: 'brown',  label: 'Textura',     bg: '#F3ECE2' },
    { key: 'green',  label: 'Verde',       bg: '#D1FAE5' },
    { key: 'purple', label: 'Dulce',       bg: '#EDE9FE' },
    { key: 'neutral',label: 'Neutro',      bg: '#F1EFE8' },
] as const;

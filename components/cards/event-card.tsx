import Image from 'next/image';
import {
  Mountain, Music, Palette, Trophy, UtensilsCrossed,
  Moon, Wrench, Users, Star, type LucideIcon,
} from 'lucide-react';
import type { DbEvent } from '@/lib/types';

const CATEGORY_BADGE: Record<string, { bg: string; fg: string }> = {
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

const CATEGORY_ICON: Record<string, LucideIcon> = {
  'Aventura y Naturaleza': Mountain,
  'Música':                Music,
  'Cultura':               Palette,
  'Deportes':              Trophy,
  'Gastronomía':           UtensilsCrossed,
  'Vida Nocturna':         Moon,
  'Talleres':              Wrench,
  'Familiar':              Users,
};

const BADGE_STYLE: React.CSSProperties = {
  position: 'absolute',
  fontFamily: 'var(--font-sans)',
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '4px 8px',
  borderRadius: 4,
  lineHeight: 1,
};

function formatDate(dateStr: string): string {
  const [datePart, timePart = ''] = dateStr.split('T');
  const parts = datePart.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const [hourStr = '00', minStr = '00'] = timePart.split(':');
  const d = new Date(year, month, day);
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${weekdays[d.getDay()]} ${day} ${months[month]} · ${hourStr.padStart(2, '0')}:${minStr.padStart(2, '0')}`;
}

export function EventCard({ event }: { event: DbEvent }) {
  const colors = CATEGORY_BADGE[event.category] ?? CATEGORY_BADGE['Otros'];
  const PlaceholderIcon = CATEGORY_ICON[event.category] ?? Star;

  const rightBadge = event.sponsored
    ? { label: 'PATROCINADO', bg: '#E11D2E', fg: '#FFFFFF' }
    : !event.price || event.price === 0
      ? { label: 'GRATIS', bg: '#EFF4E8', fg: '#3B6D11' }
      : null;

  return (
    <div style={{ backgroundColor: '#1A1A1A', borderRadius: 8, overflow: 'hidden', width: '100%' }}>
      {/* Photo block */}
      <div style={{ position: 'relative', height: 160, backgroundColor: '#242424' }}>
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 85vw, 200px"
            className="object-cover"
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <PlaceholderIcon style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}

        <span style={{ ...BADGE_STYLE, top: 8, left: 8, backgroundColor: colors.bg, color: colors.fg }}>
          {event.category}
        </span>

        {rightBadge && (
          <span style={{ ...BADGE_STYLE, top: 8, right: 8, backgroundColor: rightBadge.bg, color: rightBadge.fg }}>
            {rightBadge.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 14px 16px' }}>
        <h3
          className="line-clamp-2"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            color: '#FFFFFF',
            lineHeight: 1.25,
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          {event.title}
        </h3>

        {/* Price — prominent, decision-critical */}
        <div style={{ marginBottom: 8 }}>
          {!event.price || event.price === 0 ? (
            <span style={{
              display: 'inline-block',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 700,
              color: '#6EC44A',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: 'rgba(110, 196, 74, 0.12)',
              border: '1px solid rgba(110, 196, 74, 0.28)',
            }}>
              Gratis
            </span>
          ) : (
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}>
              Q{event.price}
            </span>
          )}
        </div>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888888', lineHeight: 1.4 }}>
          {formatDate(event.date_start)} · {event.zone}
        </p>
      </div>
    </div>
  );
}

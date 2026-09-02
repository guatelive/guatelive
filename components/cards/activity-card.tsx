import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import { Star } from 'lucide-react';
import type { DbActivity } from '@/lib/types';
import { EVENT_CATEGORY_BADGE, EVENT_CATEGORY_ICON, type EventCategory } from '@/lib/event-categories';
import { eventLocation, priceDisplay } from '@/lib/event-display';

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

// titleFont: 'display' lo usa el home v2 (Bricolage Grotesque, ver
// design_handoff_home_v2/README.md) — /actividades se queda con el serif por
// defecto.
export function ActivityCard({ activity, titleFont = 'serif' }: { activity: DbActivity; titleFont?: 'serif' | 'display' }) {
  const colors = EVENT_CATEGORY_BADGE[activity.category as EventCategory] ?? EVENT_CATEGORY_BADGE['Otros'];
  const PlaceholderIcon = EVENT_CATEGORY_ICON[activity.category as EventCategory] ?? Star;
  const price = priceDisplay(activity);

  const rightBadge = activity.sponsored
    ? { label: 'PATROCINADO', bg: '#E11D2E', fg: '#FFFFFF' }
    : activity.is_free
      ? { label: 'GRATIS', bg: '#EFF4E8', fg: '#3B6D11' }
      : null;

  return (
    <div style={{ backgroundColor: '#1A1A1A', borderRadius: 8, overflow: 'hidden', width: '100%' }}>
      {/* Photo block */}
      <div style={{ position: 'relative', height: 160, backgroundColor: '#242424' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: colors.fg, zIndex: 3 }} />
        {activity.image_url ? (
          <ImageWithSkeleton
            src={activity.image_url}
            alt={activity.title}
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
          {activity.category}
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
            fontFamily: titleFont === 'display' ? 'var(--font-display)' : 'var(--font-serif)',
            fontSize: 18,
            color: '#FFFFFF',
            lineHeight: 1.25,
            marginBottom: 8,
            fontWeight: titleFont === 'display' ? 800 : 700,
          }}
        >
          {activity.title}
        </h3>

        {/* Price — prominent, decision-critical */}
        <div style={{ marginBottom: 8 }}>
          {price.kind === 'free' ? (
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
          ) : price.kind === 'priced' ? (
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}>
              {price.label}
            </span>
          ) : null}
        </div>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888888', lineHeight: 1.4 }}>
          {activity.recurrence_text}{eventLocation(activity) ? ` · 📍 ${eventLocation(activity)}` : ''}
        </p>
      </div>
    </div>
  );
}

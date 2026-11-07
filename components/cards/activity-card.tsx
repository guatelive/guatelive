'use client';

import Link from 'next/link';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { Star } from 'lucide-react';
import type { DbActivity } from '@/lib/types';
import { EVENT_CATEGORY_BADGE, EVENT_CATEGORY_ICON, type EventCategory } from '@/lib/event-categories';
import { activityCardInfo, activityCategories, priceDisplay } from '@/lib/event-display';

const BADGE_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '4px 8px',
  borderRadius: 4,
  lineHeight: 1,
};

function rot(id: number, spread: number) {
  return ((id * 41) % (spread * 2 + 1)) - spread;
}

export function handleTiltMove(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const base = el.dataset.baseRotate || '';
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `${base} perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.03)`;
  el.style.boxShadow = '0 20px 40px rgba(0,0,0,0.25)';
  el.style.zIndex = '5';
}

export function handleTiltLeave(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.transform = el.dataset.baseRotate || 'none';
  el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
  el.style.zIndex = '1';
}

// Sticker del home v2 (cinta adhesiva + tilt 3D en hover, ver
// design_handoff_home_v2/README.md sección 5). Es la única card de actividad: el
// carrusel del home le pasa un width fijo, las grillas la dejan llenar la columna.
export function ActivityCard({ activity, width = '100%' }: { activity: DbActivity; width?: number | string }) {
  const PlaceholderIcon = EVENT_CATEGORY_ICON[activity.category as EventCategory] ?? Star;
  const price = priceDisplay(activity);
  const { when, location } = activityCardInfo(activity);
  const baseRotate = rot(activity.id.charCodeAt(0) + activity.id.length, 3);

  return (
    <Link
      href={`/actividad/${activity.slug}`}
      data-base-rotate={`rotate(${baseRotate}deg)`}
      onMouseMove={handleTiltMove}
      onMouseLeave={handleTiltLeave}
      style={{
        position: 'relative', width, flexShrink: 0,
        background: '#fff', border: '1px solid #eee', borderRadius: 4,
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        transform: `rotate(${baseRotate}deg)`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        textDecoration: 'none', display: 'block', textAlign: 'left',
      }}
    >
      {/* Cinta adhesiva */}
      <div style={{
        position: 'absolute', top: -10, left: '50%',
        transform: 'translateX(-50%) rotate(-3deg)',
        width: 56, height: 20, background: 'rgba(225,29,46,0.85)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }} />

      <div style={{ padding: '10px 10px 0', position: 'relative', height: 190 }}>
        <FavoriteButton type="activity" slug={activity.slug} name={activity.title} />
        {activity.image_url ? (
          <ImageWithSkeleton
            src={activity.image_url}
            alt={activity.title}
            fill
            sizes="(max-width: 640px) 90vw, 400px"
            className="object-cover"
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#F4F4F4' }}>
            <PlaceholderIcon style={{ width: 32, height: 32, color: 'rgba(0,0,0,0.15)' }} />
          </div>
        )}

        {/* El right deja lugar al badge de la derecha: si no caben, las categorías bajan de línea. */}
        <div style={{ position: 'absolute', top: 8, left: 8, right: activity.sponsored ? 96 : 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {activityCategories(activity).map(category => {
            const badge = EVENT_CATEGORY_BADGE[category as EventCategory] ?? EVENT_CATEGORY_BADGE['Otros'];
            return (
              <span key={category} style={{ ...BADGE_STYLE, backgroundColor: badge.bg, color: badge.fg }}>
                {category}
              </span>
            );
          })}
        </div>

        {activity.sponsored && (
          <span style={{ ...BADGE_STYLE, position: 'absolute', top: 8, right: 8, backgroundColor: '#E11D2E', color: '#FFFFFF' }}>
            PATROCINADO
          </span>
        )}
      </div>

      <div style={{ padding: '12px 14px 16px' }}>
        <div
          className="line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 4, color: '#111111' }}
        >
          {activity.title}
        </div>
        {when && (
          <div className="line-clamp-1" style={{ color: '#777777', fontSize: 12, marginBottom: 2 }}>
            {when}
          </div>
        )}
        {location && (
          <div className="line-clamp-2" style={{ color: '#777777', fontSize: 12, marginBottom: 6 }}>
            📍 {location}
          </div>
        )}
        {price.kind !== 'unknown' && (
          <div style={{ color: '#E11D2E', fontWeight: 800, fontSize: 14 }}>
            {price.kind === 'free' ? 'Gratis' : price.label}
          </div>
        )}
      </div>
    </Link>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ChevronUp, ChevronDown, ExternalLink, Star } from 'lucide-react';
import type { DbEvent } from '@/lib/types';
import { EVENT_CATEGORY_BADGE, EVENT_CATEGORY_ICON, type EventCategory } from '@/lib/event-categories';
import { formatDateLong } from '@/lib/format-event-date';

const NAV_BTN: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.15)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.2)',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease, background-color 0.15s ease',
};

interface Props {
  events: DbEvent[];
  initialIndex: number;
  onClose: () => void;
}

export function EventExplorer({ events, initialIndex, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const touchStartY = useRef(0);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setCurrent(c => Math.min(c + 1, events.length - 1));
      if (e.key === 'ArrowUp') setCurrent(c => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [events.length, onClose]);

  const goNext = () => setCurrent(c => Math.min(c + 1, events.length - 1));
  const goPrev = () => setCurrent(c => Math.max(c - 1, 0));

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: '#000', overflow: 'hidden' }}
      onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
      onTouchEnd={e => {
        const diff = touchStartY.current - e.changedTouches[0].clientY;
        if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
      }}
    >
      {/* Top bar: counter + close */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '20px 20px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
          color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em',
        }}>
          {current + 1} / {events.length}
        </span>
        <button
          onClick={onClose}
          style={{ ...NAV_BTN, width: 36, height: 36 }}
          aria-label="Cerrar"
        >
          <X style={{ width: 18, height: 18, color: '#fff' }} />
        </button>
      </div>

      {/* Slides track */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(-${current * 100}vh)`,
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
      >
        {events.map((event, i) => {
          const colors = EVENT_CATEGORY_BADGE[event.category as EventCategory] ?? EVENT_CATEGORY_BADGE['Otros'];
          const PlaceholderIcon = EVENT_CATEGORY_ICON[event.category as EventCategory] ?? Star;

          return (
            <div key={event.id} style={{ height: '100vh', position: 'relative', flexShrink: 0, backgroundColor: '#111' }}>
              {/* Image or placeholder */}
              {event.image_url ? (
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  priority={i === initialIndex}
                  className="object-cover"
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A' }}>
                  <PlaceholderIcon style={{ width: 96, height: 96, color: 'rgba(255,255,255,0.07)' }} />
                </div>
              )}

              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.15) 65%, transparent 100%)',
              }} />

              {/* Content at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 56px' }}>
                {/* Category */}
                <span style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  padding: '4px 10px', borderRadius: 4,
                  backgroundColor: colors.bg, color: colors.fg,
                  marginBottom: 12,
                }}>
                  {event.category}
                </span>

                {/* Title */}
                <h2 style={{
                  fontFamily: 'var(--font-serif)', fontSize: 30, lineHeight: 1.2,
                  color: '#fff', fontWeight: 700, marginBottom: 10,
                }}>
                  {event.title}
                </h2>

                {/* Price */}
                <div style={{ marginBottom: 10 }}>
                  {event.is_free ? (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: '#6EC44A' }}>
                      Gratis
                    </span>
                  ) : event.price !== null ? (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: '#fff' }}>
                      Q{event.price}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#888' }}>
                      Precio no disponible
                    </span>
                  )}
                </div>

                {/* Venue · date · zone */}
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: 13,
                  color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
                  marginBottom: 8,
                }}>
                  {event.venue_name && <>{event.venue_name} · </>}
                  {formatDateLong(event.date_start, event.date_end)} · {event.zone}
                </p>

                {/* Descripción (truncada — la completa vive en /evento/[slug]) */}
                {event.description && (
                  <p
                    className="line-clamp-2"
                    style={{
                      fontFamily: 'var(--font-sans)', fontSize: 13,
                      color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
                      marginBottom: 10,
                    }}
                  >
                    {event.description}
                  </p>
                )}

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {event.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: 'var(--font-sans)', fontSize: 11,
                          color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.1)',
                          padding: '3px 9px', borderRadius: 999,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {event.tags.length > 4 && (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '3px 4px' }}>
                        +{event.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* CTA + link a la página completa */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                  {event.contact_link && (
                    <a
                      href={event.contact_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                        color: '#fff', backgroundColor: '#E11D2E',
                        padding: '11px 22px', borderRadius: 8, textDecoration: 'none',
                      }}
                    >
                      Más info <ExternalLink style={{ width: 14, height: 14 }} />
                    </a>
                  )}
                  <Link
                    href={`/evento/${event.slug}`}
                    style={{
                      fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                      color: 'rgba(255,255,255,0.75)', textDecoration: 'underline',
                    }}
                  >
                    Ver página completa →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: up/down arrows on the right */}
      <div
        className="hidden sm:flex"
        style={{
          position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
          flexDirection: 'column', gap: 10, zIndex: 20,
        }}
      >
        <button
          onClick={goPrev}
          style={{ ...NAV_BTN, opacity: current === 0 ? 0.3 : 1, cursor: current === 0 ? 'default' : 'pointer' }}
          aria-label="Anterior"
        >
          <ChevronUp style={{ width: 20, height: 20, color: '#fff' }} />
        </button>
        <button
          onClick={goNext}
          style={{ ...NAV_BTN, opacity: current === events.length - 1 ? 0.3 : 1, cursor: current === events.length - 1 ? 'default' : 'pointer' }}
          aria-label="Siguiente"
        >
          <ChevronDown style={{ width: 20, height: 20, color: '#fff' }} />
        </button>
      </div>

      {/* Mobile: swipe hint (solo al abrir) */}
      {current === 0 && events.length > 1 && (
        <div
          className="sm:hidden"
          style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            opacity: 0.5, zIndex: 20, pointerEvents: 'none',
          }}
        >
          <ChevronUp style={{ width: 18, height: 18, color: '#fff' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#fff', letterSpacing: '0.08em' }}>
            SWIPE
          </span>
        </div>
      )}
    </div>
  );
}

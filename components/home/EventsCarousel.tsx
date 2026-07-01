'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DbEvent } from '@/lib/types';
import { EventCardLink } from '@/components/cards/event-card-link';
import { EventExplorer } from '@/components/home/EventExplorer';
import { useIsMobile } from '@/hooks/use-is-mobile';

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  color: '#E11D2E',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
};

const ARROW_BASE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '1.5px solid #D4D4D4',
  backgroundColor: '#FFFFFF',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'opacity 0.15s ease',
};

const CARD_W = 280;
const CARD_GAP = 12;

export function EventsCarousel({ events }: { events: DbEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [explorerIndex, setExplorerIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const t = setTimeout(updateArrows, 200);
    return () => clearTimeout(t);
  }, [events, updateArrows]);

  // Auto-play — pauses on hover/touch/explorer open
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const tick = () => {
      if (pausedRef.current || explorerIndex !== null) return;
      const isMobile = window.innerWidth < 640;
      const step = isMobile ? window.innerWidth * 0.78 + CARD_GAP : CARD_W + CARD_GAP;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    };

    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, [events, explorerIndex]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === 'left' ? -(el.clientWidth * 0.85) : el.clientWidth * 0.85,
      behavior: 'smooth',
    });
  };

  if (events.length === 0) return null;

  return (
    <>
      <section className="mx-auto mt-2 max-w-6xl px-4 sm:px-6">
        {/* Header: label + "Ver todos" + arrows */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={LABEL_STYLE}>EVENTOS</p>
            <div style={{ width: 30, height: 2, backgroundColor: '#E11D2E', marginTop: 6 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 2 }}>
            {isMobile ? (
              <button
                onClick={() => setExplorerIndex(0)}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                  color: '#E11D2E', background: 'none', border: 'none', cursor: 'pointer',
                  letterSpacing: '0.02em', padding: 0,
                }}
              >
                Ver todos →
              </button>
            ) : (
              <Link
                href="/buscar"
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                  color: '#E11D2E', letterSpacing: '0.02em', padding: 0,
                }}
              >
                Ver todos →
              </Link>
            )}
            <div className="hidden sm:flex" style={{ gap: 8 }}>
              <button
                onClick={() => scroll('left')}
                style={{ ...ARROW_BASE, opacity: canScrollLeft ? 1 : 0.3, cursor: canScrollLeft ? 'pointer' : 'default' }}
                aria-label="Ver anteriores"
              >
                <ChevronLeft style={{ width: 16, height: 16, color: '#0A0A0A' }} />
              </button>
              <button
                onClick={() => scroll('right')}
                style={{ ...ARROW_BASE, opacity: canScrollRight ? 1 : 0.3, cursor: canScrollRight ? 'pointer' : 'default' }}
                aria-label="Ver siguientes"
              >
                <ChevronRight style={{ width: 16, height: 16, color: '#0A0A0A' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel — cards clickeables abren el explorer */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onTouchStart={() => { pausedRef.current = true; }}
          onTouchEnd={() => { pausedRef.current = false; }}
          className="no-scrollbar -mx-4 sm:-mx-6 flex gap-3 overflow-x-auto px-[11vw] sm:px-6 pb-2"
          style={{ scrollSnapType: 'x proximity' }}
        >
          {events.map((event, i) => (
            <EventCardLink
              key={event.id}
              event={event}
              onOpenExplorer={() => setExplorerIndex(i)}
              className="block w-[78vw] shrink-0 snap-center text-left hover:opacity-90 transition-opacity sm:w-[280px] sm:snap-start"
            />
          ))}
        </div>

        {/* ── VERSIÓN ANTERIOR DEL CARRUSEL (scroll horizontal puro, sin explorer) ──
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onTouchStart={() => { pausedRef.current = true; }}
          onTouchEnd={() => { pausedRef.current = false; }}
          className="no-scrollbar -mx-4 sm:-mx-6 flex gap-3 overflow-x-auto px-[11vw] sm:px-6 pb-2"
          style={{ scrollSnapType: 'x proximity' }}
        >
          {events.map((event) => (
            <div key={event.id} className="w-[78vw] shrink-0 snap-center sm:w-[280px] sm:snap-start">
              <EventCard event={event} />
            </div>
          ))}
        </div>
        ── FIN VERSIÓN ANTERIOR ── */}
      </section>

      {/* Full-screen explorer */}
      {explorerIndex !== null && (
        <EventExplorer
          events={events}
          initialIndex={explorerIndex}
          onClose={() => setExplorerIndex(null)}
        />
      )}
    </>
  );
}

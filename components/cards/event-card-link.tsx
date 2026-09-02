'use client';

import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { EventCard } from './event-card';
import type { DbEvent } from '@/lib/types';

interface Props {
    event: DbEvent;
    onOpenExplorer: () => void;
    className?: string;
    titleFont?: 'serif' | 'display';
}

// Siempre un <Link> real a /evento/[slug] (crawleable, funciona sin JS, "abrir en
// pestaña nueva" gratis). En mobile, el click se intercepta para abrir el explorer
// swipe en su lugar — en desktop navega normal a la página de detalle.
export function EventCardLink({ event, onOpenExplorer, className, titleFont }: Props) {
    const isMobile = useIsMobile();

    return (
        <Link
            href={`/evento/${event.slug}`}
            onClick={e => {
                if (isMobile) {
                    e.preventDefault();
                    onOpenExplorer();
                }
            }}
            className={className ?? 'block text-left hover:opacity-90 transition-opacity'}
        >
            <EventCard event={event} titleFont={titleFont} />
        </Link>
    );
}

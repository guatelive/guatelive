'use client';

import { useState } from 'react';
import { EventCardLink } from '@/components/cards/event-card-link';
import { EventExplorer } from '@/components/home/EventExplorer';
import type { DbEvent } from '@/lib/types';

export function EventGridClient({ events }: { events: DbEvent[] }) {
    const [explorerIndex, setExplorerIndex] = useState<number | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((event, i) => (
                    <EventCardLink
                        key={event.id}
                        event={event}
                        onOpenExplorer={() => setExplorerIndex(i)}
                    />
                ))}
            </div>

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

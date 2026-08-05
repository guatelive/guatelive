// Contrato agnóstico a la fuente. Cada adaptador (guatemala-com.ts, eticket.ts, y en
// el futuro los que se agreguen) implementa EventSource sin que el orquestador
// (scrape-events.ts) necesite saber nada específico de esa fuente. Mismo patrón que
// scripts/bank-sources/types.ts.
//
// Cada adaptador es responsable de mapear la categoría cruda de su fuente a una de
// las 9 EVENT_CATEGORIES fijas (ver category-map.ts) antes de devolver el RawEvent —
// el orquestador nunca ve el texto crudo de categoría.

import type { EventCategory } from '@/lib/event-categories';

export type RawEvent = {
    externalId: string;
    title: string;
    description: string | null;
    category: EventCategory;
    venueName: string | null;
    // Ya resuelta vía zone-extract.ts — un adaptador nunca devuelve un RawEvent sin
    // zona confiable, descarta el evento antes de eso.
    zone: string;
    dateStart: string; // ISO — si no se puede determinar con confianza, se descarta el evento
    dateEnd: string | null;
    price: number | null;
    isFree: boolean;
    imageUrl: string | null;
    sourceUrl: string;
};

export interface EventSource {
    source: string;
    fetchEvents(): Promise<RawEvent[]>;
}

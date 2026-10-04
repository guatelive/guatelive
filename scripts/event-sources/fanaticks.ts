// Adaptador Fanaticks (app.fanaticks.live) — implementa EventSource (ver types.ts).
//
// Estructura confirmada contra HTML real (fetch directo, 2026-10-04):
//   - robots.txt limpio (`Allow: /`, solo bloquea /admin, /panel, /api/, /checkout/,
//     etc.) — no nombra bots de IA ni scraping, a diferencia de eventos.guatemala.com
//     o smartticket.fun (este último bloquea `anthropic-ai`/GPTBot/CCBot, descartado).
//   - El listado `/eventos` es Next.js con un bloque JSON-LD `ItemList` que trae la URL
//     de cada evento (`/e/{organizador}/{evento}`). No trae fechas ni venue.
//   - Cada página de detalle publica un JSON-LD Schema.org de evento (`@type` =
//     `MusicEvent`, `Festival`, `TheaterEvent`, etc.) con `startDate`/`endDate` en UTC,
//     `location.name` + `address.addressLocality`, y `offers` (`AggregateOffer` con
//     `lowPrice`). Es markup que el sitio publica a propósito para crawlers/SEO — no una
//     API privada — mismo criterio que el JSON-LD de precios de eticket.ts.
//   - A diferencia de eticket.gt, el `@type` da una categoría real, así que el título
//     solo se usa como fallback cuando el tipo es genérico (`Event`/`Festival`).
//   - `description` y `image` del JSON-LD NUNCA se guardan (texto e imagen de terceros,
//     ADR-020/021): description queda null para el skill descripciones-eventos e
//     imageUrl sale del banco de fotos libres (`pickEventPhoto()`).
//   - La zona se deriva con `extractZone()` sobre venue + localidad; si no hay zona
//     confiable el evento se descarta (nunca se adivina).

import { extractZone } from './zone-extract';
import { detectCategoryFromTitle } from './category-map';
import { pickEventPhoto } from './event-photos';
import type { EventCategory } from '@/lib/event-categories';
import type { EventSource, RawEvent } from './types';

const BASE_URL = 'https://app.fanaticks.live';
const LISTING_URL = `${BASE_URL}/eventos`;
const REQUEST_DELAY_MS = 500;
// Guatemala no tiene horario de verano — UTC-6 todo el año.
const GUATEMALA_UTC_OFFSET_HOURS = -6;

const SCHEMA_TYPE_CATEGORY: Record<string, EventCategory> = {
    MusicEvent: 'Música',
    TheaterEvent: 'Cultura',
    DanceEvent: 'Cultura',
    ComedyEvent: 'Cultura',
    ScreeningEvent: 'Cultura',
    ExhibitionEvent: 'Cultura',
    LiteraryEvent: 'Cultura',
    VisualArtsEvent: 'Cultura',
    SportsEvent: 'Deportes',
    FoodEvent: 'Gastronomía',
    ChildrensEvent: 'Familiar',
    EducationEvent: 'Talleres',
    BusinessEvent: 'Talleres',
};

type JsonLdEvent = {
    '@type': string;
    name: string;
    url: string;
    startDate?: string;
    endDate?: string;
    location?: {
        name?: string;
        address?: { addressLocality?: string } | string;
    };
    offers?: { lowPrice?: number; price?: number } | { lowPrice?: number; price?: number }[];
};

async function fetchHtml(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GuateLiveBot/1.0; +https://guatelive.vercel.app)' },
            signal: controller.signal,
        });
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

function extractJsonLdBlocks(html: string): unknown[] {
    const blocks: unknown[] = [];
    for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            blocks.push(JSON.parse(match[1].trim()));
        } catch {
            continue;
        }
    }
    return blocks;
}

function extractEventUrls(html: string): string[] {
    const urls = new Set<string>();
    for (const block of extractJsonLdBlocks(html)) {
        const candidate = block as { '@type'?: string; itemListElement?: { url?: string }[] };
        if (candidate['@type'] !== 'ItemList') continue;
        for (const item of candidate.itemListElement ?? []) {
            if (item.url?.startsWith(`${BASE_URL}/e/`)) urls.add(item.url);
        }
    }
    return [...urls];
}

function isJsonLdEvent(value: unknown): value is JsonLdEvent {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate['@type'] === 'string'
        && /Event$|^Festival$/.test(candidate['@type'])
        && typeof candidate.name === 'string'
        && typeof candidate.url === 'string';
}

// UTC ISO → hora local de Guatemala sin offset ("2026-10-17T10:30:00"), mismo
// formato que guarda eticket.ts.
function toGuatemalaLocal(utcIso: string | undefined): string | null {
    if (!utcIso) return null;
    const date = new Date(utcIso);
    if (Number.isNaN(date.getTime())) return null;
    const local = new Date(date.getTime() + GUATEMALA_UTC_OFFSET_HOURS * 3600 * 1000);
    return local.toISOString().slice(0, 19);
}

function extractPrice(offers: JsonLdEvent['offers']): { price: number | null; isFree: boolean } {
    const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
    const prices = list
        .map(offer => offer.lowPrice ?? offer.price)
        .filter((price): price is number => typeof price === 'number');
    if (prices.length === 0) return { price: null, isFree: false };
    const minPrice = Math.min(...prices);
    return { price: minPrice, isFree: minPrice === 0 };
}

function toRawEvent(event: JsonLdEvent): RawEvent | null {
    const externalId = event.url.replace(`${BASE_URL}/e/`, '');
    const title = event.name.trim();

    const dateStart = toGuatemalaLocal(event.startDate);
    if (!dateStart) return null;
    if (new Date(event.endDate ?? event.startDate ?? 0).getTime() < Date.now()) return null;

    const venueName = event.location?.name?.trim() || null;
    const locality = typeof event.location?.address === 'object'
        ? event.location.address.addressLocality ?? ''
        : event.location?.address ?? '';
    const zone = extractZone(venueName) ?? extractZone(locality);
    if (!zone) {
        console.log(`   [omitido] "${title}" — sin zona reconocible en venue "${venueName ?? '(desconocido)'}" / "${locality}"`);
        return null;
    }

    const category = SCHEMA_TYPE_CATEGORY[event['@type']] ?? detectCategoryFromTitle(title);
    const { price, isFree } = extractPrice(event.offers);

    return {
        externalId,
        title,
        description: null,
        category,
        venueName,
        zone,
        dateStart,
        dateEnd: toGuatemalaLocal(event.endDate),
        price,
        isFree,
        imageUrl: pickEventPhoto(category, externalId),
        sourceUrl: event.url,
    };
}

async function fetchEvents(): Promise<RawEvent[]> {
    const listing = await fetchHtml(LISTING_URL);
    if (!listing) throw new Error('fanaticks: no se pudo obtener el listado (red o sitio caído)');

    const urls = extractEventUrls(listing);
    if (urls.length === 0) {
        throw new Error('fanaticks: 0 eventos en el ItemList — probable cambio de estructura del sitio');
    }

    const events: RawEvent[] = [];
    for (const url of urls) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
        const html = await fetchHtml(url);
        if (!html) {
            console.log(`   [omitido] ${url} — no se pudo obtener el detalle`);
            continue;
        }
        const jsonLdEvent = extractJsonLdBlocks(html).find(isJsonLdEvent);
        if (!jsonLdEvent) {
            console.log(`   [omitido] ${url} — sin JSON-LD de evento`);
            continue;
        }
        const event = toRawEvent(jsonLdEvent);
        if (event) events.push(event);
    }

    return events;
}

export const fanaticksSource: EventSource = {
    source: 'fanaticks',
    fetchEvents,
};

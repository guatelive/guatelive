// Adaptador eticket.gt — implementa EventSource (ver types.ts).
//
// Estructura confirmada contra HTML real (fetch directo, 2026-08-02) de
// `https://www.eticket.gt/eventos.aspx`:
//   - Es un listado único (sin paginación visible, ~29 eventos vigentes), SSR
//     completo para título/fecha/hora/venue/ciudad/imagen. Los selects de filtro
//     por categoría (`?categoria=N`) y ciudad son 100% client-side/postback — se
//     confirmó pidiendo `?categoria=1` y comparando: devuelve exactamente los
//     mismos `idevento` que sin el parámetro. Por eso este adaptador NO intenta
//     filtrar por categoría vía URL.
//   - La categoría real del evento (Conciertos/Teatro/Deportes/...) vive en una API
//     privada del sitio (`api.eticket.com.gt/v2/...`, requiere un "guest token"
//     client-side) — no un endpoint público documentado. Usarla cruzaría a la misma
//     zona gris que ya se evitó con eventos.guatemala.com (apoyarse en algo que el
//     sitio no expone para terceros). Por eso `category` se infiere del título por
//     keyword (`detectCategoryFromTitle()`, category-map.ts) con cobertura parcial —
//     la mayoría de títulos son solo el nombre del artista, sin ninguna palabra que
//     indique el tipo de evento, y esos quedan en 'Otros'.
//   - El precio SÍ es público: el listado incluye un `<script type="application/ld+json">`
//     con un array de eventos Schema.org (`@type: Event`), cada uno con `offers[]`
//     (`price`, `priceCurrency`, `availability`) — es markup que el sitio publica a
//     propósito para crawlers/SEO, no la API privada. Se parsea con
//     `extractJsonLdEvents()` y se cruza por `idevento` con las tarjetas HTML.
//     `price` guardado = el mínimo entre los `offers[].price` del evento (el precio
//     "desde"), tal cual lo publica la fuente, sin interpretar tiers de cortesía ni
//     descuentos. `isFree` solo es `true` si ese mínimo es exactamente 0 — no se
//     asume gratis en base a precios simbólicos bajos (ej. Q0.01 de algunas tarjetas
//     "CORTESÍA") porque no hay forma de confirmarlo sin inventar el dato. Si el
//     evento no trae `offers` en el JSON-LD, `price` queda `null` (desconocido, no
//     gratis) — mismo comportamiento que antes en ese caso.
//   - No hay dirección/zona en el listado ni en el detalle (solo ciudad, ej.
//     "GUATEMALA", que no es suficientemente específico para `zone`). Se deriva la
//     zona del propio nombre del venue con `extractZone()` — venues como "Centro
//     Cultural Miguel Ángel Asturias" no traen una zona reconocible en el texto y
//     quedan fuera salvo que estén en venue-zone-overrides.ts; venues como "Sporta
//     Zona 14" o "Cayalá" sí matchean directo.
//   - `description` nunca copia texto del artículo/anuncio original (no hay texto de
//     "sobre el evento" en esta fuente de todos modos, solo se usa para un aviso
//     propio cuando falta la hora — el resto de la descripción la escribe el skill
//     de descripciones-eventos, grounded solo en campos estructurados propios).
//     `imageUrl` nunca hotlinkea la imagen de la fuente — sale de un banco de fotos
//     libres por categoría (`event-photos.ts`, `pickEventPhoto()`), o `null` si el
//     pool de esa categoría todavía está vacío. Ver ADR-020/021 en docs/decisions.md.
//   - Cada tarjeta de evento está precedida siempre por el mismo separador
//     (`<div style="margin:0px -10px; padding:0px 10px; background-color:#F0F0F0;">
//     <img src="images/spacer.gif" .../></div>`) — confirmado que aparece
//     exactamente una vez por evento (29 separadores para 29 eventos en la corrida
//     de prueba). Se usa para partir el HTML en un chunk por evento y parsear cada
//     uno por separado con cheerio, en vez de intentar navegar el árbol completo
//     (el markup no tiene un contenedor por-tarjeta con class/id propio).

import * as cheerio from 'cheerio';
import { extractZone } from './zone-extract';
import { detectCategoryFromTitle } from './category-map';
import { pickEventPhoto } from './event-photos';
import type { EventSource, RawEvent } from './types';

const LISTING_URL = 'https://www.eticket.gt/eventos.aspx';
const CARD_SEPARATOR = '<div style="margin:0px -10px; padding:0px 10px; background-color:#F0F0F0;">';

const MONTH_ABBR: Record<string, number> = {
    ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
    JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12,
};

// El sitio sirve `charset=iso-8859-15` (confirmado en el header Content-Type) — el
// `fetch` de Node siempre decodifica `res.text()` como UTF-8 sin mirar el charset
// real, así que las tildes/ñ llegan corruptas si no se decodifica a mano.
async function fetchHtml(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GuateLiveBot/1.0; +https://guatelive.vercel.app)' },
            signal: controller.signal,
        });
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        return new TextDecoder('iso-8859-15').decode(buffer);
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

type JsonLdOffer = {
    price?: number;
};

type JsonLdEvent = {
    offers?: JsonLdOffer[];
};

function isJsonLdEventObject(value: unknown): value is JsonLdEvent & { '@type': string; url: string } {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return candidate['@type'] === 'Event' && typeof candidate.url === 'string';
}

// El listado trae >1 bloque `application/ld+json` (uno describe la Organization,
// otro trae el array de Event) — se recorren todos y se quedan solo con los `Event`.
function extractJsonLdEvents(html: string): Map<string, JsonLdEvent> {
    const byExternalId = new Map<string, JsonLdEvent>();
    const scriptBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    for (const block of scriptBlocks) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(block[1].trim());
        } catch {
            continue;
        }

        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
            if (!isJsonLdEventObject(item)) continue;
            const externalId = item.url.match(/idevento=(\d+)/)?.[1];
            if (externalId) byExternalId.set(externalId, item);
        }
    }

    return byExternalId;
}

function extractPrice(jsonLdEvent: JsonLdEvent | undefined): { price: number | null; isFree: boolean } {
    const prices = (jsonLdEvent?.offers ?? [])
        .map(offer => offer.price)
        .filter((price): price is number => typeof price === 'number');

    if (prices.length === 0) return { price: null, isFree: false };

    const minPrice = Math.min(...prices);
    return { price: minPrice, isFree: minPrice === 0 };
}

function parseCard(chunk: string, jsonLdEvents: Map<string, JsonLdEvent>): RawEvent | null {
    const $ = cheerio.load(chunk);

    const eventLink = $('a[href*="idevento="]').first().attr('href');
    const externalId = eventLink?.match(/idevento=(\d+)/)?.[1];
    if (!externalId) return null;

    const title = $('a[href*="idartista="]').first().text().trim();
    if (!title) return null;

    const venueName = $('a[href*="idlugar="]').first().text().trim() || null;

    // `.row.` acá es necesario: el bloque de título ("EMINENCE") también trae las
    // clases `font16 boldear800` (sin `row`), y sin este calificador `.first()`
    // agarra el título en vez de la celda de día del mini-calendario.
    const monthAbbr = $('.row.font14.boldear700.grisfondo').first().text().trim().toUpperCase();
    const day = parseInt($('.row.font16.boldear800').first().text().trim(), 10);
    const year = parseInt($('.row.font10.boldear600').first().text().trim(), 10);
    const month = MONTH_ABBR[monthAbbr];
    if (!month || !day || !year) return null;

    const hourText = $('a.URLGRISCLARO').filter((_, el) => /\d{1,2}:\d{2}\s*hrs/i.test($(el).text())).first().text();
    const hourMatch = hourText.match(/(\d{1,2}):(\d{2})\s*hrs/i);
    const dateStart = hourMatch
        ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hourMatch[1].padStart(2, '0')}:${hourMatch[2]}:00`
        : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T19:00:00`;
    const description = hourMatch ? null : '[Hora no confirmada por la fuente — revisar antes de publicar]';

    const category = detectCategoryFromTitle(title);
    // Nunca se usa la imagen de la fuente (hotlink a contenido de terceros) — sale
    // del banco de fotos libres por categoría, o null si ese pool todavía está vacío.
    const imageUrl = pickEventPhoto(category, externalId);
    const sourceUrl = `https://www.eticket.gt/masinformacion.aspx?idevento=${externalId}`;

    const zone = extractZone(venueName);
    if (!zone) {
        console.log(`   [omitido] "${title}" — sin zona reconocible en venue "${venueName ?? '(desconocido)'}"`);
        return null;
    }

    const { price, isFree } = extractPrice(jsonLdEvents.get(externalId));

    return {
        externalId,
        title,
        description,
        category,
        venueName,
        zone,
        dateStart,
        dateEnd: null,
        price,
        isFree,
        imageUrl,
        sourceUrl,
    };
}

async function fetchEvents(): Promise<RawEvent[]> {
    const html = await fetchHtml(LISTING_URL);
    if (!html) throw new Error('eticket.gt: no se pudo obtener el listado (red o sitio caído)');

    const chunks = html.split(CARD_SEPARATOR).slice(1); // el primer trozo es todo lo previo a la primera tarjeta
    if (chunks.length === 0) {
        throw new Error('eticket.gt: 0 tarjetas detectadas — probable cambio de estructura del sitio');
    }

    const jsonLdEvents = extractJsonLdEvents(html);

    const seen = new Map<string, RawEvent>();
    for (const chunk of chunks) {
        const event = parseCard(chunk, jsonLdEvents);
        if (!event || seen.has(event.externalId)) continue;
        seen.set(event.externalId, event);
    }

    return [...seen.values()];
}

export const eticketSource: EventSource = {
    source: 'eticket',
    fetchEvents,
};

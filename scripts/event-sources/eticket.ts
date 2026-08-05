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
//   - La categoría del evento (Conciertos/Teatro/Deportes/...) y el precio de las
//     entradas se cargan por JS/AJAX después de la carga inicial — no están en el
//     HTML estático ni en la página de detalle (`masinformacion.aspx`) sin
//     ejecutar ese JS. Este proyecto no usa headless browsers para scraping (ver
//     ADR-019 — mismo criterio de no escalar complejidad/riesgo por una fuente),
//     así que `category` queda siempre 'Otros' y `price`/`isFree` quedan
//     desconocidos (null/false — la app ya sabe representar "precio desconocido"
//     sin inventar un valor, ver `!is_free && price === null` en el JSON-LD).
//   - No hay dirección/zona en el listado ni en el detalle (solo ciudad, ej.
//     "GUATEMALA", que no es suficientemente específico para `zone`). Se deriva la
//     zona del propio nombre del venue con `extractZone()` (mismo helper que
//     guatemala-com.ts) — venues como "Centro Cultural Miguel Ángel Asturias" no
//     traen una zona reconocible en el texto y quedan fuera; venues como "Sporta
//     Zona 14" o "Cayalá" sí.
//   - Cada tarjeta de evento está precedida siempre por el mismo separador
//     (`<div style="margin:0px -10px; padding:0px 10px; background-color:#F0F0F0;">
//     <img src="images/spacer.gif" .../></div>`) — confirmado que aparece
//     exactamente una vez por evento (29 separadores para 29 eventos en la corrida
//     de prueba). Se usa para partir el HTML en un chunk por evento y parsear cada
//     uno por separado con cheerio, en vez de intentar navegar el árbol completo
//     (el markup no tiene un contenedor por-tarjeta con class/id propio).

import * as cheerio from 'cheerio';
import { extractZone } from './zone-extract';
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

function parseCard(chunk: string): RawEvent | null {
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

    const imageUrl = $('img[data-src]').first().attr('data-src') ?? null;
    const sourceUrl = `https://www.eticket.gt/masinformacion.aspx?idevento=${externalId}`;

    const zone = extractZone(venueName);
    if (!zone) {
        console.log(`   [omitido] "${title}" — sin zona reconocible en venue "${venueName ?? '(desconocido)'}"`);
        return null;
    }

    return {
        externalId,
        title,
        description,
        category: 'Otros',
        venueName,
        zone,
        dateStart,
        dateEnd: null,
        price: null,
        isFree: false,
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

    const seen = new Map<string, RawEvent>();
    for (const chunk of chunks) {
        const event = parseCard(chunk);
        if (!event || seen.has(event.externalId)) continue;
        seen.set(event.externalId, event);
    }

    return [...seen.values()];
}

export const eticketSource: EventSource = {
    source: 'eticket',
    fetchEvents,
};

// Adaptador eventos.guatemala.com — implementa EventSource (ver types.ts).
//
// Estructura confirmada contra HTML real (fetch directo, 2026-08-02):
//   - `https://eventos.guatemala.com/calendario` trae, en un solo fetch, 3 bloques
//     `.main-calendar-title` ("Agosto 2026") + `.main-calendar-days` (hermano
//     inmediato en el DOM) — mes actual + 2 siguientes. Probado también
//     `/{año}/{mes}` (ej. `/2026/08`): existe y responde 200, pero es una vista
//     totalmente distinta (carrusel swiper de días con solo un tooltip de texto por
//     día, sin links reales a cada evento) — no sirve para este scraper, por eso NO
//     se usa. Cada celda de día real (`.main-calendar-days .days > div`) trae un
//     `<span>DD</span>` con el número de día y, si hay eventos, un `<ul><li><a
//     href="https://eventos.guatemala.com/{categoria-slug}/{slug}.html">`. La
//     categoría viene del primer segmento de la URL (culturales,
//     musica-conciertos, talleres-conferencias, eventos-familiares, deportes,
//     gastronomia, sociales) — ver category-map.ts.
//   - La página de detalle de cada evento trae:
//     - `h1` (el tercero de la página, sin `class` — los dos primeros son el logo y
//       el título genérico "Próximos eventos en Guatemala") → título completo.
//     - `.single-img img[src]` → imagen principal.
//     - `.single-top-bar-recurrent .hour.start` / `.hour.end` → hora de inicio/fin
//       en formato "09:00 AM" — más confiable que asumir una hora fija. No todos
//       los eventos tienen este widget (algunos son de todo el día / sin hora
//       fija); cuando falta, se usa un placeholder y se anota en la descripción
//       para que quede visible en la revisión pendiente.
//     - `.event-data-content .padding-adjust` — pares `.char-title`/`.char-content`,
//       típicamente "Precios" y "Ubicación" (a veces "Sitio Web"). "Ubicación" trae
//       la dirección de texto libre usada para derivar `zone` (zone-extract.ts).
//     - `.single-description` → cuerpo del evento en HTML rico (párrafos/headers).
//
// Un evento recurrente (ej. "Todos los lunes...") aparece en el calendario una vez
// por cada día en que ocurre — se dedupea por `externalId` (el slug de la URL de
// detalle es estable) y se queda con la PRIMERA fecha encontrada al recorrer el
// calendario en orden cronológico (= la próxima ocurrencia).

import * as cheerio from 'cheerio';
import { mapGuatemalaComCategory } from './category-map';
import { extractZone } from './zone-extract';
import type { EventSource, RawEvent } from './types';

const DELAY_MS = 300;
const DETAIL_TIMEOUT_MS = 15000;

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DETAIL_TIMEOUT_MS);
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

type CalendarEntry = {
    externalId: string;
    title: string;
    category: ReturnType<typeof mapGuatemalaComCategory>;
    sourceUrl: string;
    year: number;
    month: number; // 1-12
    day: number;
};

function extractExternalId(url: string): string {
    const slug = url.split('/').pop() ?? url;
    return slug.replace(/\.html$/, '');
}

const SPANISH_MONTHS: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

// `/calendario` trae, en una sola página, 3 bloques secuenciales
// `.main-calendar-title` ("Agosto 2026") + `.main-calendar-days` (hermano
// inmediato) — mes actual + 2 siguientes. No hay endpoint separado por mes: los
// botones "Mes Anterior"/"Siguiente Mes" son un swiper client-side sobre este mismo
// HTML, no un fetch nuevo.
function parseCalendarPage(html: string): CalendarEntry[] {
    const $ = cheerio.load(html);
    const entries: CalendarEntry[] = [];

    $('.main-calendar-title').each((_, titleEl) => {
        const titleText = $(titleEl).find('h1').first().text().trim().toLowerCase();
        const match = titleText.match(/([a-záéíóúñ]+)\s+(\d{4})/i);
        const month = match ? SPANISH_MONTHS[match[1]] : undefined;
        const year = match ? parseInt(match[2], 10) : undefined;
        if (!month || !year) return;

        const $days = $(titleEl).next('.main-calendar-days');
        $days.find('.days > div').each((_, dayCell) => {
            const $cell = $(dayCell);
            const day = parseInt($cell.find('> span').first().text().trim(), 10);
            if (!day) return;

            $cell.find('ul li a').each((_, a) => {
                const $a = $(a);
                const href = $a.attr('href');
                // Además del link normal a cada evento, algunos días traen un link
                // "Eventos del NN {Mes} {Año}" a una página resumen sin categoría/
                // slug propio (`/{año}/{mes}/{día}`, sin ".html") — se descarta acá,
                // no es un evento real.
                if (!href || !href.endsWith('.html')) return;
                const title = ($a.attr('title') || $a.text()).trim();
                if (!title) return;

                const pathMatch = href.match(/eventos\.guatemala\.com\/([a-z-]+)\//);
                entries.push({
                    externalId: extractExternalId(href),
                    title,
                    category: mapGuatemalaComCategory(pathMatch ? pathMatch[1] : null),
                    sourceUrl: href,
                    year,
                    month,
                    day,
                });
            });
        });
    });

    return entries;
}

// "09:00 AM" / "07:00 PM" -> "09:00" / "19:00"
function parseHour12(text: string): string | null {
    const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
}

function parsePrice(text: string): { price: number | null; isFree: boolean } {
    const normalized = text.toLowerCase();
    if (/gratis|gratuit/.test(normalized)) return { price: null, isFree: true };
    const match = text.match(/Q\s?(\d+(?:\.\d+)?)/);
    if (match) return { price: parseFloat(match[1]), isFree: false };
    return { price: null, isFree: false };
}

function htmlToPlainText(html: string, maxLength = 600): string {
    const text = html
        .replace(/<(p|h[1-6]|br)[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é').replace(/&iacute;/gi, 'í')
        .replace(/&oacute;/gi, 'ó').replace(/&uacute;/gi, 'ú').replace(/&ntilde;/gi, 'ñ')
        .replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ')
        .split('\n').map((l) => l.trim()).filter(Boolean).join(' ');
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

async function fetchEventDetail(entry: CalendarEntry): Promise<RawEvent | null> {
    const html = await fetchHtml(entry.sourceUrl);
    if (!html) return null;

    const $ = cheerio.load(html);
    const title = $('h1').not('.logo, .title').first().text().trim() || entry.title;

    const imageUrl = $('.single-img img').first().attr('src') ?? null;

    let locationText: string | null = null;
    let priceText: string | null = null;
    $('.event-data-content .padding-adjust').each((_, block) => {
        const $block = $(block);
        const label = $block.find('.char-title').first().text().trim();
        const value = $block.find('.char-content').first().text().replace(/\s+/g, ' ').trim();
        if (!value) return;
        if (label === 'Ubicación') locationText = value;
        if (label === 'Precios') priceText = value;
    });

    const descriptionHtml = $('.single-description').first().html();
    let description = descriptionHtml ? htmlToPlainText(descriptionHtml) : null;

    const startText = $('.hour.start').first().text().trim();
    const startHour = startText ? parseHour12(startText) : null;
    const endText = $('.hour.end').first().text().trim();
    const endHour = endText ? parseHour12(endText) : null;

    const dateStr = `${entry.year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`;
    let dateStart: string;
    if (startHour) {
        dateStart = `${dateStr}T${startHour}:00`;
    } else {
        // Sin hora confiable en la fuente — placeholder documentado en la
        // descripción para que se corrija en la revisión pendiente, nunca se
        // presenta como un dato confirmado.
        dateStart = `${dateStr}T19:00:00`;
        const note = '[Hora no confirmada por la fuente — revisar antes de publicar]';
        description = description ? `${note} ${description}` : note;
    }
    const dateEnd = endHour ? `${dateStr}T${endHour}:00` : null;

    const { price, isFree } = priceText ? parsePrice(priceText) : { price: null, isFree: false };

    const zone = extractZone(locationText);
    if (!zone) {
        console.log(`   [omitido] "${title}" — sin zona reconocible en "${locationText ?? '(sin ubicación)'}"`);
        return null;
    }

    return {
        externalId: entry.externalId,
        title,
        description,
        category: entry.category,
        venueName: null,
        zone,
        dateStart,
        dateEnd,
        price,
        isFree,
        imageUrl,
        sourceUrl: entry.sourceUrl,
    };
}

async function fetchEvents(): Promise<RawEvent[]> {
    const html = await fetchHtml('https://eventos.guatemala.com/calendario');
    if (!html) throw new Error('eventos.guatemala.com: no se pudo obtener /calendario (red o sitio caído)');

    const seen = new Map<string, CalendarEntry>();
    for (const entry of parseCalendarPage(html)) {
        if (!seen.has(entry.externalId)) seen.set(entry.externalId, entry);
    }

    if (seen.size === 0) {
        throw new Error('eventos.guatemala.com: 0 eventos en el calendario — probable cambio de estructura del sitio');
    }

    console.log(`   ${seen.size} eventos únicos en el calendario, obteniendo detalle de cada uno...`);

    const results: RawEvent[] = [];
    for (const entry of seen.values()) {
        const detail = await fetchEventDetail(entry);
        if (detail) results.push(detail);
        await sleep(DELAY_MS);
    }

    return results;
}

export const guatemalaComSource: EventSource = {
    source: 'guatemala-com',
    fetchEvents,
};

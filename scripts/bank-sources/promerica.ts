// Adaptador Promerica — implementa BankPromoSource (ver types.ts).
//
// A diferencia de BAC (Drupal, catálogo propio), las promociones de Promerica
// viven en un sitio aparte: Club Promerica (clubpromerica.com), una tienda
// nopCommerce de beneficios/descuentos. Estructura confirmada contra HTML real
// (fetch directo a la categoría "Sabores", la más cercana a "Restaurantes" que
// tiene el sitio — no existe una subcategoría más granular):
//   - Catálogo: https://www.clubpromerica.com/guatemala/sabores?pagesize=9&pagenumber=N
//   - Cada promo es un <div class="item-box"> > <div class="product-item"
//     data-productid="<ID>"> — sí es contenido real de catálogo (no modal por
//     JS como BAC), con título, imagen y descripción corta ya en la misma página
//     de listado (no hace falta visitar una página de detalle aparte).
//   - Nombre del comercio: los títulos siguen casi siempre el patrón "... en
//     {Comercio}[.]" (ej. "2x1 en platos seleccionados en Tre Fratelli",
//     "15% de descuento en Eurodeli") — se extrae el texto después de la última
//     " en " y se limpia el punto final. Verificado contra ~24 títulos reales
//     (3 páginas) sin excepciones.
//   - Paginación: `?pagenumber=N` con `pagesize=9` fijo (los únicos valores que
//     ofrece el propio selector del sitio son 3/6/9) — una página fuera de rango
//     devuelve 200 con 0 productos (confirmado con `pagenumber=99`), mismo
//     criterio de corte que BAC.
//   - La categoría "Sabores" no es 100% restaurantes puros (se vio un caso de
//     un spa/resort con un descuento de "cremas" faciales) — mismo tipo de
//     ruido que ya existía en el filtro de BAC; no se intenta un filtro más
//     estricto porque no hay una señal más granular disponible en el sitio.
//   - No hay fechas de vigencia estructuradas en la página — quedan en texto
//     libre dentro de la descripción, mismo criterio "best-effort, nunca
//     fabricar" ya usado en BAC: `validFrom`/`validUntil` siempre `null`.

import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { BankPromoSource, RawBankPromo } from './types';

const BASE_URL = 'https://www.clubpromerica.com/guatemala/sabores';
const PAGE_SIZE = 9;
const MAX_PAGES = 40; // salvaguarda contra loop infinito si la paginación cambia de forma
const DELAY_MS = 500;
const CATEGORY = 'Sabores';
const DEBUG_DIR = resolve('scripts/bank-sources/.debug');

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function dumpDebugHtml(page: number, html: string, reason: string) {
    try {
        await mkdir(DEBUG_DIR, { recursive: true });
        await writeFile(resolve(DEBUG_DIR, `promerica-page-${page}.html`), html, 'utf-8');
        console.warn(`   🐛 ${reason} en page=${page} — HTML volcado a scripts/bank-sources/.debug/promerica-page-${page}.html para revisar el selector`);
    } catch {
        // best-effort, no bloquea la corrida si no se puede escribir el debug dump
    }
}

async function fetchHtml(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
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

// El catálogo mezcla DOS formatos de título sin aviso:
//   A) "{Comercio} {cláusula de descuento}" — ej. "Restaurante Mesón Panza
//      Verde 10% de descuento en toda la carta de alimentos." (comercio AL INICIO)
//   B) "{cláusula de descuento} en {Comercio}" — ej. "2x1 en platos
//      seleccionados en Tre Fratelli" (comercio AL FINAL, patrón más común)
// Tomar siempre "lo de después de la última ' en '" rompe con el formato A:
// para "... 50% de descuento en pizza" (el comercio real es "SC Altos de la
// Antigua", al inicio) devolvía "pizza" — confirmado que esto generaba un
// falso positivo real: "pizza" normalizado matchea por prefijo con el lugar
// real "Pizza Hut · Santa Clara" (slug `pizza-hut-santa-clara`), lo que habría
// mostrado esa promo en la ficha equivocada.
//
// Probar "texto antes del disparador" para CUALQUIER disparador (%, 2x1,
// "gratis", "por Qxx") resultó demasiado agresivo: en construcciones tipo "{ítem
// del menú} gratis en {Comercio}" o "{ítem} por Qxx en {Comercio}" (ej. "Postre
// gratis en Pollo Churchill", "Combo por Q170 en Lai Lai"), el comercio real
// SIEMPRE está al final — "gratis"/"por Qxx" nunca marcan el inicio del nombre
// del comercio en los ~186 títulos reales revisados. Por eso solo el
// porcentaje, el multiplicador (2x1/3x2) y la palabra "descuento" cuentan como
// disparador para el formato A; "gratis" y "por Qxx" van directo al formato B.
//
// El texto inicial también puede traer su propio "... en {Comercio}" anidado
// (ej. "Escapada Vinera en Vista Terra 20% de descuento" → el candidato inicial
// es "Escapada Vinera en Vista Terra", pero el comercio real es solo "Vista
// Terra") — por eso se re-aplica el mismo recorte de "última ' en '" sobre el
// candidato inicial antes de aceptarlo.
//
// Quedan casos residuales (mismo criterio "mejor no vincular que vincular
// mal" ya usado en el resto del proyecto): un puñado de títulos sin "% / 2x1 /
// descuento" NI "en {Comercio}" en absoluto (ej. "Cheese Chomp Mac & Cheese por
// Q65.") caen al título completo tal cual — verboso pero no arriesga un match
// falso, porque el nombre real del comercio queda como prefijo reconocible.
const STRONG_LEADING_TRIGGER_RE = /(\d+\s*%|\d+\s*[x*]\s*q?\d+|de descuento|descuento)/i;

function looksLikeMerchantName(candidate: string): boolean {
    if (!candidate) return false;
    if (/^\d/.test(candidate)) return false;
    if (candidate.includes('+')) return false;
    if (/q\d/i.test(candidate)) return false;
    const wordCount = candidate.split(/\s+/).filter(Boolean).length;
    return wordCount > 0 && wordCount <= 6;
}

// Si el texto tiene su propia "... en {Comercio}" anidada, se queda con lo de
// después de la última " en " — mismo recorte que se usa a nivel del título
// completo (ver extractMerchantName), aplicado recursivamente una vez.
function afterLastEn(text: string): string {
    const idx = text.toLowerCase().lastIndexOf(' en ');
    return idx === -1 ? text : text.slice(idx + 4).trim();
}

function extractMerchantName(title: string): string {
    const clauseMatch = title.match(STRONG_LEADING_TRIGGER_RE);
    if (clauseMatch?.index !== undefined && clauseMatch.index > 0) {
        // Palabras de relleno pegadas justo antes de la cláusula de descuento
        // (ej. "Il Cubo hasta un 40% de descuento..." → sin esto, "hasta un"
        // quedaría pegado al nombre del comercio).
        const leading = afterLastEn(
            title
                .slice(0, clauseMatch.index)
                .trim()
                .replace(/[.,]+$/, '')
                .replace(/\s+hasta(\s+(un|una|el|la))?$/i, '')
        );
        if (looksLikeMerchantName(leading)) return leading;
    }

    const lower = title.toLowerCase();
    const idx = lower.lastIndexOf(' en ');
    if (idx !== -1) {
        const trailing = title
            .slice(idx + 4)
            .replace(/\.+\s*$/, '')
            .replace(/\s+por\s+q\d+\.?\s*$/i, '')
            .trim();
        if (trailing) return trailing;
    }

    return title.trim();
}

function extractCards(html: string, pageUrl: string): RawBankPromo[] {
    const $ = cheerio.load(html);
    const promos: RawBankPromo[] = [];

    $('.item-box .product-item[data-productid]').each((_, el) => {
        const $card = $(el);
        const externalId = $card.attr('data-productid');
        if (!externalId || externalId === '0') return;

        const $titleLink = $card.find('.product-title a').first();
        const title = $titleLink.text().trim();
        if (!title) return;

        const href = $titleLink.attr('href');
        const sourceUrl = href ? new URL(href, pageUrl).toString() : pageUrl;

        const description = $card.find('.description').first().text().replace(/\s+/g, ' ').trim();
        const imageSrc = $card.find('.picture img').first().attr('src');
        const imageUrl = imageSrc ? new URL(imageSrc, pageUrl).toString() : null;

        promos.push({
            externalId,
            merchantName: extractMerchantName(title),
            title,
            discountText: `${title} ${description}`.trim(),
            termsText: description || null,
            imageUrl,
            category: CATEGORY,
            sourceUrl,
            validFrom: null,
            validUntil: null,
        });
    });

    return promos;
}

async function fetchRestaurantPromos(): Promise<RawBankPromo[]> {
    const seen = new Map<string, RawBankPromo>();
    let firstPageHtml: string | null = null;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${BASE_URL}?pagesize=${PAGE_SIZE}&pagenumber=${page}`;
        const html = await fetchHtml(url);

        if (html === null) {
            if (page === 1) throw new Error(`Promerica: no se pudo obtener ${url} (red o sitio caído)`);
            break; // asumimos fin de paginación si una página > 1 falla
        }
        if (page === 1) firstPageHtml = html;

        const cards = extractCards(html, url);
        if (cards.length === 0) {
            console.log(`   page=${page}: 0 tarjetas — fin de paginación`);
            break;
        }

        let newOnThisPage = 0;
        for (const card of cards) {
            if (!seen.has(card.externalId)) {
                seen.set(card.externalId, card);
                newOnThisPage++;
            }
        }

        console.log(`   page=${page}: ${cards.length} tarjetas, ${newOnThisPage} nuevas`);
        await sleep(DELAY_MS);
    }

    if (seen.size === 0 && firstPageHtml) await dumpDebugHtml(1, firstPageHtml, '0 promos detectadas en la categoría Sabores');

    return [...seen.values()];
}

export const promericaSource: BankPromoSource = {
    bank: 'promerica',
    fetchRestaurantPromos,
};

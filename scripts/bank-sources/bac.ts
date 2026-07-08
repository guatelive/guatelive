// Adaptador BAC Credomatic — implementa BankPromoSource (ver types.ts).
//
// Estructura confirmada contra HTML real (Fredy corrió --dry el 2026-07-07 y
// compartió scripts/bank-sources/.debug/bac-page-0.html): es un sitio Drupal.
// Cada promo es un <div class="promotion-wrapper-item ... item-<ID>"> — NO es un
// <a href>, se abre con un modal por JS (por eso el intento anterior, que buscaba
// <a> envolviendo una <img>, encontraba 0 promos reales). Dentro de cada card:
//   - <img alt="..."> dentro de <picture> → nombre del comercio/lugar (ej. "Bono 14")
//   - <h2 class="h2"><span>...</span></h2> → título/headline de la promo
//   - <h3 class="h3--subtitle"> → lista de categorías separadas por coma, ej.
//     "Descuentos, promociones y ofertas, Restaurantes, Comida Rápida, ..." — ACÁ
//     es donde se filtra por "Restaurantes", no en el texto completo de la tarjeta.
//   - <div class="real-estate-card__description"> → texto libre corto de la card
//     ("Vigencia: ..."), usado solo para el parseo de % y el discount_label corto.
//   - <div id="modal-<ID>"> ... <div class="real_estate_modal-description"> →
//     el detalle COMPLETO de la promo (qué incluye, productos participantes,
//     horarios, condiciones y restricciones) — confirmado que ya viene en el HTML
//     de la página de catálogo (SSR, oculto por CSS hasta que se abre el modal por
//     JS), no requiere una request aparte. `#modal-<ID>` NO está anidado dentro de
//     `.item-<ID>` (es un hermano en el DOM), así que se busca por ID global, no
//     con `$card.find(...)`. Esto es lo que se guarda en `terms` — antes solo se
//     guardaba el resumen corto de la card, perdiendo la info que el usuario
//     realmente busca (fechas exactas, productos, horarios, restricciones). No se
//     intenta parsear a fechas estructuradas (formato de fecha en español libre,
//     "Del 17 al 19 de julio de 2026", poco confiable sin arriesgar fechas
//     incorrectas — mismo criterio "best-effort, nunca fabricar" del resto del
//     proyecto).
// No hay página de detalle por promo (el modal vive en la misma página) — se usa
// la URL de catálogo + `#modal-<ID>` como source_url.
//
// Paginación: `?page=N` — sin parámetro de categoría confiable en la URL (el
// dropdown de categorías usa IDs numéricos internos, no slugs de texto), así que
// el filtro por "Restaurantes" sigue siendo 100% del lado del cliente.

import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { BankPromoSource, RawBankPromo } from './types';

const BASE_URL = 'https://www.baccredomatic.com/es-gt/personas/landing/promociones';
const MAX_PAGES = 30; // salvaguarda contra loop infinito si la paginación cambia de forma
const DELAY_MS = 500;
// Asume ejecución desde la raíz del repo (mismo supuesto que el resto de scripts/,
// que ya resuelven `.env.local` de la misma forma).
const DEBUG_DIR = resolve('scripts/bank-sources/.debug');

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();
}

// Convierte el HTML del detalle del modal (<p>, <strong>, <ul><li>, <br>) a texto
// plano legible en varias líneas — un bullet por <li>, un salto de línea por
// <p>/<div>/<br>. No se intenta preservar ningún otro formato.
function modalHtmlToText(html: string): string {
    return html
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/(p|div)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');
}

async function dumpDebugHtml(page: number, html: string, reason: string) {
    try {
        await mkdir(DEBUG_DIR, { recursive: true });
        await writeFile(resolve(DEBUG_DIR, `bac-page-${page}.html`), html, 'utf-8');
        console.warn(`   🐛 ${reason} en page=${page} — HTML volcado a scripts/bank-sources/.debug/bac-page-${page}.html para revisar el selector`);
    } catch {
        // best-effort, no bloquea la corrida si no se puede escribir el debug dump
    }
}

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

function extractCards(html: string, pageUrl: string): RawBankPromo[] {
    const $ = cheerio.load(html);
    const promos: RawBankPromo[] = [];

    $('div.promotion-wrapper-item').each((_, el) => {
        const $card = $(el);
        const classAttr = $card.attr('class') ?? '';
        const idMatch = classAttr.match(/item-(\d+)/);
        if (!idMatch) return;
        const externalId = idMatch[1];

        const title = $card.find('h2.h2 span').first().text().trim();
        if (!title) return;

        const category = $card.find('h3.h3--subtitle').first().text().replace(/\s+/g, ' ').trim() || null;
        const description = $card.find('.real-estate-card__description').first().text().replace(/\s+/g, ' ').trim();

        // El modal no está anidado dentro de .item-<ID> — es un hermano en el DOM,
        // por eso se busca por ID global ($, no $card).
        const modalDescriptionHtml = $(`#modal-${externalId}`).find('.real_estate_modal-description').first().html();
        const fullDescription = modalDescriptionHtml ? modalHtmlToText(modalDescriptionHtml) : '';

        const $img = $card.find('picture img').first();
        // El alt de la imagen a veces es el nombre del plato/foto (ej. "Carpaccio de
        // Lomito"), no el comercio — pero cuando el título trae "... - COMERCIO" al
        // final (patrón muy consistente en el catálogo real, ej. "2x Q125 EN
        // PLATILLOS - TRE FRATELLI"), esa parte after del guion sí es el nombre real
        // del lugar. Se prioriza ese patrón sobre el alt cuando está presente.
        const dashSuffix = title.match(/\s-\s(.+)$/)?.[1]?.trim();
        const merchantName = dashSuffix || $img.attr('alt')?.trim() || title;
        const imageSrc = $img.attr('src');
        const imageUrl = imageSrc ? new URL(imageSrc, pageUrl).toString() : null;

        promos.push({
            externalId,
            merchantName,
            title,
            discountText: `${title} ${description}`.trim(),
            termsText: fullDescription || description || null,
            imageUrl,
            category,
            sourceUrl: `${pageUrl.split('?')[0]}#modal-${externalId}`,
            validFrom: null,
            validUntil: null,
        });
    });

    return promos;
}

function isRestaurantCard(promo: RawBankPromo): boolean {
    return normalize(promo.category ?? '').includes('restaurant');
}

async function fetchRestaurantPromos(): Promise<RawBankPromo[]> {
    const seen = new Map<string, RawBankPromo>();
    let firstPageHtml: string | null = null;
    let previousPageIds: Set<string> | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
        const url = `${BASE_URL}?page=${page}`;
        const html = await fetchHtml(url);

        if (html === null) {
            if (page === 0) throw new Error(`BAC: no se pudo obtener ${url} (red o sitio caído)`);
            break; // asumimos fin de paginación si una página > 0 falla
        }
        if (page === 0) firstPageHtml = html;

        const cards = extractCards(html, url);
        if (cards.length === 0) {
            if (html.length > 0) await dumpDebugHtml(page, html, '0 tarjetas detectadas');
            break;
        }

        // Si la página trae exactamente los mismos IDs que la anterior, `?page=N`
        // no está cambiando el contenido real — no tiene sentido seguir pidiendo
        // páginas idénticas.
        const currentIds = new Set(cards.map((c) => c.externalId));
        if (previousPageIds && currentIds.size === previousPageIds.size &&
            [...currentIds].every((id) => previousPageIds!.has(id))) {
            console.log(`   page=${page}: mismo contenido que la página anterior — fin de paginación real`);
            break;
        }
        previousPageIds = currentIds;

        let newOnThisPage = 0;
        for (const card of cards) {
            if (isRestaurantCard(card) && !seen.has(card.externalId)) {
                seen.set(card.externalId, card);
                newOnThisPage++;
            }
        }

        console.log(`   page=${page}: ${cards.length} tarjetas, ${newOnThisPage} nuevas de Restaurantes`);
        await sleep(DELAY_MS);
    }

    // 0 resultados de Restaurantes al final (con o sin tarjetas detectadas) es
    // igual de accionable que 0 tarjetas — dejamos un artefacto para ajustar el
    // selector en el próximo paso, en vez de fallar en silencio.
    if (seen.size === 0 && firstPageHtml) await dumpDebugHtml(0, firstPageHtml, '0 promos de Restaurantes en todo el catálogo');

    return [...seen.values()];
}

export const bacSource: BankPromoSource = {
    bank: 'bac',
    fetchRestaurantPromos,
};

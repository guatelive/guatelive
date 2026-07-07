// Adaptador BAC Credomatic — implementa BankPromoSource (ver types.ts).
//
// Confirmado por inspección remota (WebFetch, sesión 2026-07-06) antes de escribir
// este archivo: el catálogo en
// https://www.baccredomatic.com/es-gt/personas/landing/promociones es HTML
// renderizado server-side (no hace falta un navegador headless), con paginación
// tradicional `?page=N` y un dropdown de ~200 categorías (incluye "Restaurantes").
//
// ⚠️ IMPORTANTE — pendiente de validar contra HTML real: esta sesión de trabajo no
// tuvo acceso de red a baccredomatic.com (timeout de conexión incluso sin sandbox;
// posiblemente algo puntual de esa red/máquina, ya que WebFetch sí llegó bien desde
// otra infraestructura). Los selectores de `extractCards()` son una hipótesis
// razonable basada en el patrón más común de este tipo de catálogos, no HTML
// verificado línea por línea. Si al correr esto por primera vez (terminal propia o
// GitHub Actions) `extractCards()` devuelve 0 tarjetas en una página con HTML no
// vacío, el script vuelca el HTML crudo a `scripts/bank-sources/.debug/` para poder
// ajustar el selector en un solo paso — ver `dumpDebugHtml()` más abajo.
//
// Para no depender de adivinar el nombre exacto del query param de categoría, el
// filtro por "Restaurantes" se hace del lado del cliente (después de traer cada
// página completa) en vez de intentar pasar `?category=restaurantes` al servidor.

import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
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

async function dumpDebugHtml(page: number, html: string) {
    try {
        await mkdir(DEBUG_DIR, { recursive: true });
        await writeFile(resolve(DEBUG_DIR, `bac-page-${page}.html`), html, 'utf-8');
        console.warn(`   🐛 0 tarjetas detectadas en page=${page} — HTML volcado a scripts/bank-sources/.debug/bac-page-${page}.html para revisar el selector`);
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

function externalIdFrom(href: string | undefined, merchantName: string, title: string): string {
    if (href) {
        const path = href.split('?')[0].replace(/\/+$/, '');
        const slug = path.split('/').filter(Boolean).pop();
        if (slug) return slug;
    }
    // Sin href utilizable: hash estable de comercio+título como fallback.
    return createHash('md5').update(`${merchantName}|${title}`).digest('hex').slice(0, 16);
}

function extractCards(html: string, pageUrl: string): RawBankPromo[] {
    const $ = cheerio.load(html);
    const promos: RawBankPromo[] = [];

    // Estrategia: una "tarjeta" de promo es un <a> con href que envuelve una
    // imagen y algo de texto (título). Es el patrón más común en catálogos de
    // este tipo — ver nota de cabecera sobre por qué no está verificado línea a
    // línea contra el HTML real.
    //
    // Se excluyen explícitamente los links dentro de header/nav/footer: en una
    // corrida real (ver nota de cabecera) esta extracción devolvió el mismo
    // número de "tarjetas" en cada página sin importar `?page=N`, la firma
    // típica de estar capturando navegación/redes sociales repetida en el
    // layout, no contenido paginado real.
    $('a[href]').each((_, el) => {
        const $card = $(el);
        if ($card.closest('header, nav, footer').length > 0) return;

        const $img = $card.find('img').first();
        if ($img.length === 0) return;

        const text = normalize($card.text());
        if (!text) return;

        const title =
            $card.find('h1,h2,h3,h4,h5,h6').first().text().trim() ||
            $card.find('strong,b').first().text().trim() ||
            $card.attr('title')?.trim() ||
            $card.text().trim().split('\n')[0]?.trim() ||
            '';
        if (!title) return;

        const href = $card.attr('href');
        const sourceUrl = href ? new URL(href, pageUrl).toString() : pageUrl;
        const imageUrl = $img.attr('src') ? new URL($img.attr('src')!, pageUrl).toString() : null;

        const merchantName =
            $card.find('[class*="merchant"],[class*="comercio"],[class*="brand"]').first().text().trim() ||
            title;

        promos.push({
            externalId: externalIdFrom(href, merchantName, title),
            merchantName,
            title,
            discountText: $card.text().replace(/\s+/g, ' ').trim(),
            termsText: null,
            imageUrl,
            category: null, // se completa en isRestaurantCard() vía texto crudo, no hay selector de categoría confiable todavía
            sourceUrl,
            validFrom: null,
            validUntil: null,
        });
    });

    return promos;
}

function isRestaurantCard(promo: RawBankPromo): boolean {
    const haystack = normalize(`${promo.title} ${promo.discountText}`);
    return haystack.includes('restaurant');
}

async function fetchRestaurantPromos(): Promise<RawBankPromo[]> {
    const seen = new Map<string, RawBankPromo>();
    let firstPageHtml: string | null = null;

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
            if (html.length > 0) await dumpDebugHtml(page, html);
            break;
        }

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
    if (seen.size === 0 && firstPageHtml) await dumpDebugHtml(0, firstPageHtml);

    return [...seen.values()];
}

export const bacSource: BankPromoSource = {
    bank: 'bac',
    fetchRestaurantPromos,
};

// Adaptador G&T Continental — implementa BankPromoSource (ver types.ts).
//
// A diferencia de BAC/Promerica, este sitio SÍ trae categoría estructurada
// server-side: cada promo es un <article class="card-promociones"
// data-categoria="restaurantes" data-titulo="..."> — no hace falta adivinar
// por texto de categoría ni por nombre de comercio conocido. Todo el catálogo
// (~64 promos, todas las categorías) vive en una sola página, sin paginación
// real (la paginación visible es 100% client-side vía CSS `hide` — la carga
// inicial ya trae todo el HTML).
//
// El detalle completo (descripción, restricciones, fecha de vigencia real) NO
// está en el HTML de listado — el botón "Ver más" abre un modal por JS que
// llama a una API REST pública estilo Contentful:
//   /api/content/spaces/sp-personas-productos/types/promociones-beneficios-y-experiencias/entries/{uuid}
// Se llama una vez por promo de Restaurantes (~24 llamadas, con delay entre
// cada una — mismo criterio respetuoso que la paginación de BAC/Promerica).
// La misma respuesta trae `meta.slug`, que resuelve a una URL real por promo
// (verificado: un slug inventado cae a un soft-404 de GTC con el título
// genérico del home, uno real muestra el título de esa promo específica) — a
// diferencia de BAC/Promerica, acá sí hay `sourceUrl` real por promo, no solo
// la página de catálogo repetida.
//
// Nombre de comercio: a diferencia de Promerica (formato mixto), en las 24
// promos reales de esta categoría el comercio SIEMPRE está al inicio del
// título ("{Comercio} {cláusula de descuento}") — se extrae el texto antes de
// la primera cláusula de descuento reconocida (%, 2x1, "gratis", "entrada de
// cortesía", "mitad de precio", "precio GTC", "beneficio GTC"). Verificado
// contra las 24 promos reales de la categoría, sin excepciones.
//
// Fecha de vigencia: por primera vez entre los 3 bancos, el formato es lo
// bastante consistente ("Hasta DD/MM/AAAA") para parsearlo con confianza a
// `validUntil` real, en vez de dejarlo `null` como en BAC/Promerica.

import * as cheerio from 'cheerio';
import type { BankPromoSource, RawBankPromo } from './types';

const LISTING_URL = 'https://www.gtc.com.gt/personas/promociones-beneficios-y-experiencias';
const API_BASE = 'https://www.gtc.com.gt/api/content/spaces/sp-personas-productos/types/promociones-beneficios-y-experiencias/entries';
const DELAY_MS = 400;

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url: string): Promise<string | null> {
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

async function fetchJson<T>(url: string): Promise<T | null> {
    const text = await fetchText(url);
    if (!text) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

const DISCOUNT_CLAUSE_RE = /(entrada de cortes[ií]a|\d+\s*%|\d+\s*x\s*\d+|gratis|de cortes[ií]a|mitad de precio|precio gtc|beneficio gtc)/i;

function extractMerchantName(title: string): string {
    const match = title.match(DISCOUNT_CLAUSE_RE);
    if (match?.index) {
        const leading = title.slice(0, match.index).trim().replace(/[.,]+$/, '');
        if (leading) return leading;
    }
    return title.trim();
}

function htmlToText(html: string): string {
    return html
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/(p|div|section)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');
}

// "Hasta 05/08/2026" / "Hasta 30/9/2026" → "2026-08-05" (ISO).
function parseValidUntil(text: string | undefined | null): string | null {
    if (!text) return null;
    const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!match) return null;
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

type DetailResponse = {
    meta?: { slug?: string };
    fields?: {
        'Modal-Descripción'?: string;
        'Modal-Información importante'?: string;
        'Fecha de validez'?: string;
    };
};

async function fetchCardDetail(uuid: string): Promise<{ termsText: string | null; validUntil: string | null; sourceUrl: string }> {
    const data = await fetchJson<DetailResponse>(`${API_BASE}/${uuid}`);
    if (!data) return { termsText: null, validUntil: null, sourceUrl: LISTING_URL };

    const fields = data.fields ?? {};
    const parts = [fields['Modal-Descripción'], fields['Modal-Información importante']]
        .filter((html): html is string => Boolean(html))
        .map(htmlToText)
        .filter(Boolean);

    return {
        termsText: parts.length > 0 ? parts.join('\n') : null,
        validUntil: parseValidUntil(fields['Fecha de validez']),
        sourceUrl: data.meta?.slug ? `${LISTING_URL}/${data.meta.slug}` : LISTING_URL,
    };
}

async function fetchRestaurantPromos(): Promise<RawBankPromo[]> {
    const html = await fetchText(LISTING_URL);
    if (!html) throw new Error(`G&T: no se pudo obtener ${LISTING_URL} (red o sitio caído)`);

    const $ = cheerio.load(html);
    const cards = $('article.card-promociones[data-categoria="restaurantes"]').toArray();

    const promos: RawBankPromo[] = [];
    for (const el of cards) {
        const $card = $(el);
        const externalId = $card.find('.card-promociones__cta_link').attr('data-detalleid');
        const title = $card.find('.card-promociones__titulo h5').first().text().trim();
        if (!externalId || !title) continue;

        const imageSrc = $card.find('.card-promociones__imagen img').first().attr('src');
        const validezText = $card.find('.card-promociones__validez span').first().text().trim();

        const detail = await fetchCardDetail(externalId);
        await sleep(DELAY_MS);

        promos.push({
            externalId,
            merchantName: extractMerchantName(title),
            title,
            discountText: title,
            termsText: detail.termsText,
            imageUrl: imageSrc ?? null,
            category: 'Restaurantes',
            sourceUrl: detail.sourceUrl,
            validFrom: null,
            validUntil: detail.validUntil ?? parseValidUntil(validezText),
        });
    }

    return promos;
}

export const gtcSource: BankPromoSource = {
    bank: 'gtc',
    fetchRestaurantPromos,
};

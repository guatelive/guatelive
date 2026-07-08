/**
 * scrape-bank-promos.ts — Scraper agnóstico de promociones bancarias (Eje 5)
 *
 * Arranca solo con BAC Credomatic (ver scripts/bank-sources/bac.ts). Agregar un
 * banco nuevo = un archivo en scripts/bank-sources/ + una línea en
 * scripts/bank-sources/index.ts — este orquestador, el matching y el upsert son
 * agnósticos al banco.
 *
 * USO:
 *   npx tsx scripts/scrape-bank-promos.ts --bank=bac
 *   npx tsx scripts/scrape-bank-promos.ts --bank=bac --dry
 *
 * Nota: si el scrape del banco devuelve 0 resultados (error de red, sitio caído,
 * cambio de estructura), el script aborta ANTES de tocar la tabla — nunca marca
 * promos existentes como inactivas por un fallo transitorio del scraper.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/slug';
import { BANK_SOURCES } from './bank-sources/index';
import { buildPlaceMatchIndex, matchPlaceByName } from './bank-sources/match-place';
import type { RawBankPromo } from './bank-sources/types';

config({ path: resolve('.env.local') });

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseDiscountPct(text: string): number | null {
    const match = text.match(/(\d{1,3})\s*%/);
    if (!match) return null;
    const pct = parseInt(match[1], 10);
    return pct >= 1 && pct <= 100 ? pct : null;
}

function buildDiscountLabel(text: string, discountPct: number | null): string {
    if (discountPct !== null) return `${discountPct}% de descuento`;
    const trimmed = text.trim().replace(/\s+/g, ' ');
    return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed || 'Promoción vigente';
}

async function run(bank: string, isDry: boolean) {
    const source = BANK_SOURCES[bank];
    if (!source) {
        console.error(`❌ Banco desconocido: "${bank}". Disponibles: ${Object.keys(BANK_SOURCES).join(', ')}`);
        process.exit(1);
    }

    console.log(`\n🔄 SCRAPE — ${bank.toUpperCase()} (categoría Restaurantes)\n`);

    let raw: RawBankPromo[];
    try {
        raw = await source.fetchRestaurantPromos();
    } catch (err) {
        console.error(`❌ Scrape falló, no se toca la tabla:`, err instanceof Error ? err.message : err);
        process.exit(1);
    }

    if (raw.length === 0) {
        console.error('❌ 0 promos scrapeadas — probable error de red o cambio de estructura del sitio. No se toca la tabla.');
        process.exit(1);
    }

    console.log(`   ${raw.length} promos de Restaurantes encontradas\n`);

    const placeIndex = await buildPlaceMatchIndex(sb);

    let upserted = 0, matched = 0, errors = 0;
    const runStartedAt = new Date().toISOString();

    for (const promo of raw) {
        const hasPlaceMatch = matchPlaceByName(promo.merchantName, placeIndex);
        if (hasPlaceMatch) matched++;

        const discountPct = parseDiscountPct(promo.discountText);
        const row = {
            bank,
            external_id: promo.externalId,
            merchant_name: promo.merchantName,
            merchant_slug: slugify(promo.merchantName),
            title: promo.title,
            discount_label: buildDiscountLabel(promo.discountText, discountPct),
            discount_pct: discountPct,
            category: promo.category,
            terms: promo.termsText ?? promo.discountText,
            image_url: promo.imageUrl,
            source_url: promo.sourceUrl,
            valid_from: promo.validFrom,
            valid_until: promo.validUntil,
            is_active: true,
            last_seen_at: runStartedAt,
            updated_at: runStartedAt,
        };

        if (isDry) {
            console.log(`   [dry] ${promo.merchantName} — ${row.discount_label}${hasPlaceMatch ? ' (match ✅)' : ' (sin match)'}`);
            upserted++;
            continue;
        }

        const { error } = await sb
            .from('bank_promotions')
            .upsert(row, { onConflict: 'bank,external_id' });

        if (error) {
            console.error(`   ❌ DB error (${promo.merchantName}):`, error.message);
            errors++;
        } else {
            upserted++;
        }
    }

    // Si hubo errores de DB en el loop de arriba (ej. un upsert que falló por un
    // problema de schema), "no visto en este run" no significa "ya no existe en
    // BAC" — significa que no se pudo escribir. Desactivar en ese caso apagaría
    // promos que siguen vigentes. Solo se desactiva lo no visto cuando el run
    // completo de upserts salió limpio.
    if (!isDry && errors === 0) {
        const { error: deactivateError } = await sb
            .from('bank_promotions')
            .update({ is_active: false })
            .eq('bank', bank)
            .lt('last_seen_at', runStartedAt);

        if (deactivateError) {
            console.error('   ❌ Error marcando promos no vistas como inactivas:', deactivateError.message);
        }
    } else if (!isDry && errors > 0) {
        console.error(`   ⚠️  ${errors} error(es) de DB — se omite el paso de desactivar promos no vistas para no apagar promos vigentes por un fallo parcial.`);
    }

    console.log(`\n✅ Procesadas: ${upserted} | 🔗 Con match a lugar: ${matched} | ❌ Errores: ${errors}`);
    if (isDry) console.log('🧪 DRY RUN — sin escrituras a DB');
}

async function main() {
    const args = process.argv.slice(2);
    const isDry = args.includes('--dry');
    const bank = args.find((a) => a.startsWith('--bank='))?.split('=')[1];

    if (!bank) {
        console.log(`
USO: npx tsx scripts/scrape-bank-promos.ts --bank=<banco> [opciones]

Bancos disponibles: ${Object.keys(BANK_SOURCES).join(', ')}

Opciones:
  --dry   Sin escrituras a DB
`);
        process.exit(1);
    }

    await run(bank, isDry);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

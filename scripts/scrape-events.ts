/**
 * scrape-events.ts — Scraper agnóstico a la fuente de eventos (Eje 6), fuentes
 * públicas sin protección anti-bot. Facebook Events queda fuera a propósito (ver
 * docs/decisions.md) — Fredy lo sigue cargando a mano desde /admin/events.
 *
 * Arranca con eventos.guatemala.com y eticket.gt (ver scripts/event-sources/).
 * Agregar una fuente nueva = un archivo en scripts/event-sources/ + una línea en
 * scripts/event-sources/index.ts.
 *
 * USO:
 *   npx tsx scripts/scrape-events.ts --source=guatemala-com
 *   npx tsx scripts/scrape-events.ts --source=eticket --dry
 *
 * Reglas de escritura (distintas de scrape-bank-promos.ts — ver docs/decisions.md
 * para el porqué):
 *   - Todo evento nuevo entra con status='pending', nunca se auto-publica.
 *   - Un evento ya existente (mismo source+external_id) solo se actualiza si sigue
 *     'pending' — si Fredy ya lo publicó/editó desde el admin, la corrida no lo toca.
 *   - Si el scrape falla o devuelve 0 eventos, se aborta ANTES de tocar la tabla.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/slug';
import { EVENT_SOURCES } from './event-sources/index';
import type { RawEvent } from './event-sources/types';

config({ path: resolve('.env.local') });

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ensureUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 2;
    for (;;) {
        const { data } = await sb.from('events').select('id').eq('slug', candidate).maybeSingle();
        if (!data) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
}

async function run(source: string, isDry: boolean) {
    const adapter = EVENT_SOURCES[source];
    if (!adapter) {
        console.error(`❌ Fuente desconocida: "${source}". Disponibles: ${Object.keys(EVENT_SOURCES).join(', ')}`);
        process.exit(1);
    }

    console.log(`\n🔄 SCRAPE — ${source}\n`);

    let raw: RawEvent[];
    try {
        raw = await adapter.fetchEvents();
    } catch (err) {
        console.error(`❌ Scrape falló, no se toca la tabla:`, err instanceof Error ? err.message : err);
        process.exit(1);
    }

    if (raw.length === 0) {
        console.error('❌ 0 eventos scrapeados — probable error de red o cambio de estructura del sitio. No se toca la tabla.');
        process.exit(1);
    }

    console.log(`   ${raw.length} eventos encontrados\n`);

    let inserted = 0, updated = 0, skippedPublished = 0, errors = 0;

    for (const event of raw) {
        const { data: existing, error: selectError } = await sb
            .from('events')
            .select('id, status')
            .eq('source', source)
            .eq('external_id', event.externalId)
            .maybeSingle();

        if (selectError) {
            console.error(`   ❌ DB error consultando "${event.title}":`, selectError.message);
            errors++;
            continue;
        }

        if (existing && existing.status === 'published') {
            skippedPublished++;
            continue;
        }

        if (isDry) {
            console.log(`   [dry] ${existing ? 'update' : 'insert'} — ${event.title} (${event.zone}, ${event.category})`);
            if (existing) updated++; else inserted++;
            continue;
        }

        const row = {
            title: event.title,
            description: event.description,
            category: event.category,
            zone: event.zone,
            venue_name: event.venueName,
            date_start: event.dateStart,
            date_end: event.dateEnd,
            price: event.price,
            is_free: event.isFree,
            image_url: event.imageUrl,
            contact_link: event.sourceUrl,
            source,
            external_id: event.externalId,
            status: 'pending' as const,
        };

        if (existing) {
            const { error } = await sb.from('events').update(row).eq('id', existing.id);
            if (error) {
                console.error(`   ❌ DB error actualizando "${event.title}":`, error.message);
                errors++;
            } else {
                updated++;
            }
            continue;
        }

        const slug = await ensureUniqueSlug(slugify(event.title));
        const { error } = await sb.from('events').insert({ ...row, slug });
        if (error) {
            console.error(`   ❌ DB error insertando "${event.title}":`, error.message);
            errors++;
        } else {
            inserted++;
        }
    }

    console.log(`\n✅ Insertados: ${inserted} | Actualizados: ${updated} | Ya publicados (sin tocar): ${skippedPublished} | Errores: ${errors}`);
    if (isDry) console.log('🧪 DRY RUN — sin escrituras a DB');
}

async function main() {
    const args = process.argv.slice(2);
    const isDry = args.includes('--dry');
    const source = args.find((a) => a.startsWith('--source='))?.split('=')[1];

    if (!source) {
        console.log(`
USO: npx tsx scripts/scrape-events.ts --source=<fuente> [opciones]

Fuentes disponibles: ${Object.keys(EVENT_SOURCES).join(', ')}

Opciones:
  --dry   Sin escrituras a DB
`);
        process.exit(1);
    }

    await run(source, isDry);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

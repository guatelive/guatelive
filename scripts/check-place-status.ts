/**
 * check-place-status.ts — Detecta lugares cerrados consultando el business_status de
 * Google Places (API legacy, mismo endpoint que el resto de los scripts).
 *
 * Por qué existe: hasta 2026-10-24 el estado de los lugares no se actualizaba desde
 * junio (refresh-places.ts es manual), y Fredy encontró a mano tres restaurantes
 * cerrados que seguían publicados (La Tavola, Frisco Grill Cayalá, Arena).
 *
 * Qué hace, por cada lugar publicado con google_place_id:
 * - Pide solo `business_status` (una consulta liviana; ~1,600/mes con corrida semanal,
 *   dentro del cupo gratis de Place Details — confirmar en la consola de Google).
 * - Guarda business_status + last_synced_at.
 * - CLOSED_PERMANENTLY → despublica (is_published = false). No borra nada.
 * - CLOSED_TEMPORARILY → solo lo reporta, sin tocar.
 * Al final escribe el resumen en $GITHUB_STEP_SUMMARY (si corre en Actions).
 *
 * Seguridad (mismo criterio que los scrapers): si falla más del 20% de las consultas
 * o Google marca como cerrados más del 10% de los lugares, no despublica nada — eso
 * huele a problema de la API o de la clave, no a una ola de cierres reales.
 *
 * USO:
 *   npx tsx scripts/check-place-status.ts --dry    # solo reporta, no escribe
 *   npx tsx scripts/check-place-status.ts
 */

import { config } from 'dotenv';
import { appendFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve('.env.local') });

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DELAY_MS = 300;
const MAX_ERROR_RATE = 0.2;
const MAX_CLOSED_RATE = 0.1;

type Place = { id: string; name: string; zone: string | null; google_place_id: string };
type Status = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';

function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchStatus(placeId: string): Promise<Status | null> {
    const params = new URLSearchParams({ place_id: placeId, fields: 'business_status', key: API_KEY! });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
    const json = await res.json() as { status: string; result?: { business_status?: Status } };
    return json.status === 'OK' ? json.result?.business_status ?? null : null;
}

function summary(lines: string[]) {
    console.log(lines.join('\n'));
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}

async function main() {
    const isDry = process.argv.includes('--dry');
    if (!API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
        console.error('❌ Faltan variables: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data, error } = await sb
        .from('places')
        .select('id, name, zone, google_place_id')
        .eq('is_published', true)
        .not('google_place_id', 'is', null);
    if (error) { console.error('❌ DB:', error.message); process.exit(1); }
    const places = (data ?? []) as Place[];
    console.log(`🔎 Revisando ${places.length} lugares${isDry ? ' (dry run)' : ''}\n`);

    const results: { place: Place; status: Status | null }[] = [];
    for (const place of places) {
        results.push({ place, status: await fetchStatus(place.google_place_id) });
        await sleep(DELAY_MS);
    }

    const failed = results.filter(r => r.status === null);
    const permanent = results.filter(r => r.status === 'CLOSED_PERMANENTLY');
    const temporary = results.filter(r => r.status === 'CLOSED_TEMPORARILY');
    const tooManyErrors = failed.length / places.length > MAX_ERROR_RATE;
    const tooManyClosed = permanent.length / places.length > MAX_CLOSED_RATE;
    const safeToUnpublish = !isDry && !tooManyErrors && !tooManyClosed;

    if (!isDry && !tooManyErrors) {
        const now = new Date().toISOString();
        for (const r of results.filter(x => x.status !== null)) {
            const { error: e } = await sb.from('places')
                .update({ business_status: r.status, last_synced_at: now })
                .eq('id', r.place.id);
            if (e) console.error(`❌ ${r.place.name}: ${e.message}`);
        }
    }
    if (safeToUnpublish) {
        for (const r of permanent) {
            const { error: e } = await sb.from('places').update({ is_published: false }).eq('id', r.place.id);
            if (e) console.error(`❌ No se pudo despublicar ${r.place.name}: ${e.message}`);
        }
    }

    const fmt = (r: { place: Place }) => `- ${r.place.name} (${r.place.zone ?? 'sin zona'})`;
    summary([
        '## Estado de lugares (Google Places)',
        `Revisados: ${places.length} · errores de API: ${failed.length}`,
        '',
        `### Cerrados definitivamente: ${permanent.length}${safeToUnpublish ? ' (despublicados)' : ' (NO se despublicaron)'}`,
        ...permanent.map(fmt),
        ...(tooManyErrors ? ['', `⚠️ Más del ${MAX_ERROR_RATE * 100}% de consultas fallaron: no se escribió nada. Revisar la clave o la cuota de Google.`] : []),
        ...(tooManyClosed ? ['', `⚠️ Google marcó como cerrados más del ${MAX_CLOSED_RATE * 100}% de los lugares: no se despublicó nada. Revisar a mano.`] : []),
        '',
        `### Cerrados temporalmente: ${temporary.length} (revisar a mano, siguen publicados)`,
        ...temporary.map(fmt),
    ]);

    if (failed.length === places.length && places.length > 0) process.exit(1);
}

main();

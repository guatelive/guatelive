// Migra las imágenes existentes de Supabase Storage al formato pre-optimizado
// (webp, <base>-w1600.webp + <base>-w640.webp — ver lib/images/optimized.ts), para que
// el sitio las muestre con `unoptimized` y no gasten Image Optimization
// Transformations de Vercel.
//
// USO
//   npx tsx scripts/migrate-images-to-webp.ts                 # PRUEBA (default): no escribe nada
//   npx tsx scripts/migrate-images-to-webp.ts --sample 10     # prueba convirtiendo 10 en memoria
//   npx tsx scripts/migrate-images-to-webp.ts --apply         # sube webp + actualiza URLs en la DB
//   npx tsx scripts/migrate-images-to-webp.ts --apply --limit 20   # aplicar solo las primeras 20
//   ENV_FILE=/ruta/.env.local npx tsx …                       # si el .env.local está en otro lado
//
// QUÉ HACE --apply, por cada URL única de nuestro bucket que no esté migrada:
//   1. descarga el original, genera las dos versiones webp y las sube (upsert → re-ejecutable)
//   2. actualiza todas las filas que la referencian (place_photos, events, activities,
//      edition_places, editions, plans)
//   3. NO borra el original — queda de respaldo. Mapeo viejo→nuevo en
//      scripts/output/image-migration-<fecha>.json para poder revertir.

import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { optimizeImage } from '@/lib/images/upload';
import { LARGE_SUFFIX, SMALL_SUFFIX, isPreOptimized } from '@/lib/images/optimized';

config({ path: resolve(process.env.ENV_FILE ?? '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (usá ENV_FILE=… si el .env.local está en otro lado)');
    process.exit(1);
}

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const argNum = (flag: string, def: number) => {
    const i = args.indexOf(flag);
    return i === -1 ? def : Number(args[i + 1]);
};
const SAMPLE = argNum('--sample', 5);
const LIMIT = argNum('--limit', Infinity);
// --slugs a,b,c → solo eventos/actividades con esos slugs (para pruebas acotadas)
const SLUGS = (() => {
    const i = args.indexOf('--slugs');
    return i === -1 ? null : new Set(args[i + 1].split(',').map(x => x.trim()).filter(Boolean));
})();
const labels = new Map<string, string>(); // url → "evento: slug" (para el reporte)
const CONCURRENCY = 6;

const BUCKET = 'images';
const MARKER = `/storage/v1/object/public/${BUCKET}/`;

const isOurs = (url: unknown): url is string => typeof url === 'string' && url.includes(MARKER);
const needsMigration = (url: unknown): url is string => isOurs(url) && !isPreOptimized(url);

function storagePath(url: string): string {
    return url.slice(url.indexOf(MARKER) + MARKER.length).split('?')[0];
}
function basePathOf(path: string): string {
    return path.replace(/\.[a-z0-9]+$/i, '');
}

type Ref =
    | { table: 'place_photos' | 'edition_places'; id: string; column: 'url' | 'photo_url' }
    | { table: 'events' | 'activities' | 'editions' | 'plans'; id: string; column: 'image_url' | 'cover_image_url' }
    | { table: 'activities'; id: string; column: 'photo_urls'; array: string[] }
    | { table: 'editions'; id: string; column: 'strip_photos'; array: (string | null)[] };

async function collectRefs(supabase: SupabaseClient): Promise<Map<string, Ref[]>> {
    const refs = new Map<string, Ref[]>();
    const add = (url: unknown, ref: Ref) => {
        if (!needsMigration(url)) return;
        refs.set(url, [...(refs.get(url) ?? []), ref]);
    };
    const all = async <T,>(table: string, columns: string): Promise<T[]> => {
        const out: T[] = [];
        for (let from = 0; ; from += 1000) {
            const { data, error } = await supabase.from(table).select(columns).range(from, from + 999);
            if (error) throw new Error(`${table}: ${error.message}`);
            out.push(...((data ?? []) as T[]));
            if (!data || data.length < 1000) return out;
        }
    };

    const pick = (slug: string) => !SLUGS || SLUGS.has(slug);
    const label = (url: unknown, l: string) => { if (needsMigration(url) && !labels.has(url)) labels.set(url, l); };

    if (!SLUGS) {
    for (const r of await all<{ id: string; url: string }>('place_photos', 'id, url'))
        add(r.url, { table: 'place_photos', id: r.id, column: 'url' });
    for (const r of await all<{ id: string; photo_url: string }>('edition_places', 'id, photo_url'))
        add(r.photo_url, { table: 'edition_places', id: r.id, column: 'photo_url' });
    for (const r of await all<{ id: string; cover_image_url: string }>('plans', 'id, cover_image_url'))
        add(r.cover_image_url, { table: 'plans', id: r.id, column: 'cover_image_url' });
    }
    for (const r of await all<{ id: string; slug: string; image_url: string }>('events', 'id, slug, image_url')) {
        if (!pick(r.slug)) continue;
        label(r.image_url, `evento: ${r.slug}`);
        add(r.image_url, { table: 'events', id: r.id, column: 'image_url' });
    }
    for (const r of await all<{ id: string; slug: string; image_url: string; photo_urls: string[] | null }>('activities', 'id, slug, image_url, photo_urls')) {
        if (!pick(r.slug)) continue;
        label(r.image_url, `actividad: ${r.slug}`);
        for (const u of r.photo_urls ?? []) label(u, `actividad: ${r.slug}`);
        add(r.image_url, { table: 'activities', id: r.id, column: 'image_url' });
        for (const u of r.photo_urls ?? []) add(u, { table: 'activities', id: r.id, column: 'photo_urls', array: r.photo_urls! });
    }
    if (!SLUGS)
    for (const r of await all<{ id: string; cover_image_url: string; strip_photos: unknown }>('editions', 'id, cover_image_url, strip_photos')) {
        add(r.cover_image_url, { table: 'editions', id: r.id, column: 'cover_image_url' });
        if (Array.isArray(r.strip_photos))
            for (const u of r.strip_photos) add(u, { table: 'editions', id: r.id, column: 'strip_photos', array: r.strip_photos });
    }
    return refs;
}

async function pool<T>(items: T[], fn: (item: T, i: number) => Promise<void>) {
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
            while (next < items.length) {
                const i = next++;
                await fn(items[i], i);
            }
        }),
    );
}

async function download(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function main() {
    const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    const refs = await collectRefs(supabase);
    const urls = [...refs.keys()];

    const byTable = new Map<string, number>();
    for (const list of refs.values()) for (const r of list) byTable.set(`${r.table}.${r.column}`, (byTable.get(`${r.table}.${r.column}`) ?? 0) + 1);
    console.log(`\nModo: ${APPLY ? 'APPLY (escribe en Storage y DB)' : 'PRUEBA (no escribe nada)'}`);
    console.log(`URLs únicas a migrar: ${urls.length}`);
    for (const [k, v] of [...byTable].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v} referencias`);

    if (!APPLY) {
        const sample = urls.slice(0, SAMPLE);
        console.log(`\nConvirtiendo ${sample.length} de muestra en memoria (sin subir nada)…`);
        let before = 0, afterLg = 0, afterSm = 0, fails = 0;
        await pool(sample, async (url) => {
            try {
                const original = await download(url);
                const { large, small } = await optimizeImage(original);
                before += original.length; afterLg += large.length; afterSm += small.length;
                console.log(`  ${storagePath(url)}: ${kb(original.length)} → ${kb(large.length)} (w1600) / ${kb(small.length)} (w640)`);
            } catch (e) {
                fails++;
                console.log(`  ✗ ${storagePath(url)}: ${(e as Error).message}`);
            }
        });
        if (before > 0) {
            console.log(`\nMuestra: ${mb(before)} originales → ${mb(afterLg)} grandes + ${mb(afterSm)} chicas`);
            console.log(`Peso medio por foto en cards: ${kb(before / (sample.length - fails))} → ${kb(afterSm / (sample.length - fails))}`);
        }
        console.log('\nNada fue modificado. Para aplicar: --apply (probá primero con --limit 20).');
        return;
    }

    const todo = urls.slice(0, LIMIT);
    const mapping: Record<string, string> = {};
    const failures: { url: string; error: string }[] = [];
    let done = 0;

    await pool(todo, async (url) => {
        try {
            const base = basePathOf(storagePath(url));
            const { large, small } = await optimizeImage(await download(url));
            const opts = { contentType: 'image/webp', cacheControl: '31536000', upsert: true };
            const up1 = await supabase.storage.from(BUCKET).upload(`${base}${LARGE_SUFFIX}`, large, opts);
            if (up1.error) throw new Error(`upload w1600: ${up1.error.message}`);
            const up2 = await supabase.storage.from(BUCKET).upload(`${base}${SMALL_SUFFIX}`, small, opts);
            if (up2.error) throw new Error(`upload w640: ${up2.error.message}`);
            console.log(`  ✓ ${labels.get(url) ?? 'lugar/edición'} — ${storagePath(url)}`);
            mapping[url] = supabase.storage.from(BUCKET).getPublicUrl(`${base}${LARGE_SUFFIX}`).data.publicUrl;
        } catch (e) {
            failures.push({ url, error: (e as Error).message });
        }
        if (++done % 50 === 0) console.log(`  ${done}/${todo.length} convertidas…`);
    });

    // Actualizar la DB — columnas simples fila por fila; arrays con el mapeo completo
    // aplicado de una vez (una fila puede tener varias URLs migradas).
    const arrayRows = new Map<string, Extract<Ref, { array: unknown }>>();
    let updated = 0;
    for (const [oldUrl, newUrl] of Object.entries(mapping)) {
        for (const ref of refs.get(oldUrl)!) {
            if ('array' in ref) { arrayRows.set(`${ref.table}:${ref.id}:${ref.column}`, ref); continue; }
            const { error } = await supabase.from(ref.table).update({ [ref.column]: newUrl }).eq('id', ref.id).eq(ref.column, oldUrl);
            if (error) failures.push({ url: oldUrl, error: `${ref.table}.${ref.column} ${ref.id}: ${error.message}` });
            else updated++;
        }
    }
    for (const ref of arrayRows.values()) {
        const next = ref.array.map(u => (u && mapping[u]) || u);
        const { error } = await supabase.from(ref.table).update({ [ref.column]: next }).eq('id', ref.id);
        if (error) failures.push({ url: '-', error: `${ref.table}.${ref.column} ${ref.id}: ${error.message}` });
        else updated++;
    }

    mkdirSync(resolve('scripts/output'), { recursive: true });
    const logPath = resolve(`scripts/output/image-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeFileSync(logPath, JSON.stringify({ mapping, failures }, null, 2));

    console.log(`\nConvertidas: ${Object.keys(mapping).length}/${todo.length} · filas actualizadas: ${updated} · errores: ${failures.length}`);
    for (const f of failures.slice(0, 20)) console.log(`  ✗ ${f.url}: ${f.error}`);
    console.log(`Mapeo para revertir: ${logPath}`);
    console.log('Los originales siguen en Storage (respaldo). Borrarlos es un paso aparte.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

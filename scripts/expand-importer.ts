import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PLACES_PER_TARGET = 30;
const MAX_PHOTOS_PER_PLACE = 5;
const PHOTO_MAX_WIDTH = 800;
const DELAY_MS = 200;
const DELAY_BETWEEN_TARGETS = 2000;

const targets = [
    { query: 'restaurantes zona 1 Guatemala City', zone: 'Zona 1' },
    { query: 'restaurantes zona 4 Guatemala City', zone: 'Zona 4' },
    { query: 'restaurantes zona 9 Guatemala City', zone: 'Zona 9' },
    { query: 'restaurantes zona 10 Guatemala City', zone: 'Zona 10' },
    { query: 'restaurantes zona 11 Guatemala City', zone: 'Zona 11' },
    { query: 'restaurantes zona 12 Guatemala City', zone: 'Zona 12' },
    { query: 'restaurantes zona 13 Guatemala City', zone: 'Zona 13' },
    { query: 'restaurantes zona 14 Guatemala City', zone: 'Zona 14' },
    { query: 'restaurantes zona 15 Guatemala City', zone: 'Zona 15' },
    { query: 'restaurantes zona 16 Guatemala City', zone: 'Zona 16' },
    { query: 'restaurantes zona 18 Guatemala City', zone: 'Zona 18' },
    { query: 'restaurantes Cayalá Guatemala City', zone: 'Cayalá' },
    { query: 'restaurantes Mixco Guatemala', zone: 'Mixco' },
    { query: 'restaurantes Villa Nueva Guatemala', zone: 'Villa Nueva' },
    { query: 'restaurantes San Cristóbal Guatemala', zone: 'San Cristóbal' },
    { query: 'restaurantes Carretera El Salvador Guatemala', zone: 'Carretera El Salvador' },
    { query: 'restaurantes Muxbal Santa Rosalía Guatemala', zone: 'Muxbal' },
    { query: 'restaurantes Pradera Concepción Guatemala', zone: 'Pradera Concepción' },
    { query: 'restaurantes Antigua Guatemala', zone: 'Antigua' },
    { query: 'cafes Antigua Guatemala', zone: 'Antigua' },
    { query: 'bares Antigua Guatemala', zone: 'Antigua' },
];

type Summary = {
    inserted: number;
    skipped: number;
    photosNew: number;
    photosBackfilled: number;
    errors: string[];
};

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function getPrimaryCategory(types: string[]): string {
    if (types.includes('cafe') || types.includes('bakery')) return 'Café';
    if (types.includes('bar')) return 'Bar';
    return 'Restaurante';
}

function buildPhotoUrl(photoReference: string): string {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${PHOTO_MAX_WIDTH}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

async function insertPhotos(
    placeId: string,
    placeName: string,
    photos: { photo_reference: string }[],
    summary: Summary,
    isBackfill = false
): Promise<number> {
    const toInsert = photos.slice(0, MAX_PHOTOS_PER_PLACE);
    let count = 0;
    for (let i = 0; i < toInsert.length; i++) {
        const { error } = await supabase.from('place_photos').insert({
            place_id: placeId,
            url: buildPhotoUrl(toInsert[i].photo_reference),
            alt_text: placeName,
            is_primary: i === 0,
            order_index: i,
            source: 'google_places',
        });
        if (error) {
            summary.errors.push(`Foto ${i + 1} de ${placeName}: ${error.message}`);
        } else {
            count++;
            if (isBackfill) summary.photosBackfilled++;
            else summary.photosNew++;
        }
    }
    return count;
}

async function processTarget(
    target: { query: string; zone: string },
    index: number,
    summary: Summary
) {
    console.log(`\n[${index + 1}/${targets.length}] 📍 ${target.zone} — "${target.query}"`);

    // PASO 1: Text Search
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', target.query);
    searchUrl.searchParams.append('key', GOOGLE_API_KEY);

    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json() as {
        results?: { place_id: string }[];
        status: string;
        error_message?: string;
    };

    if (!searchData.results?.length) {
        console.log(`  ⚠️  Sin resultados (status: ${searchData.status} ${searchData.error_message ?? ''})`);
        return;
    }

    const toProcess = searchData.results.slice(0, PLACES_PER_TARGET);
    console.log(`  Encontrados ${searchData.results.length} → procesando ${toProcess.length}`);

    for (const result of toProcess) {
        await sleep(DELAY_MS);

        // PASO 2: Place Details
        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.append('place_id', result.place_id);
        detailsUrl.searchParams.append('key', GOOGLE_API_KEY);
        detailsUrl.searchParams.append(
            'fields',
            'name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos,formatted_phone_number,website,types'
        );

        const detailsRes = await fetch(detailsUrl.toString());
        const detailsData = await detailsRes.json() as {
            result?: {
                name: string;
                formatted_address: string;
                geometry?: { location?: { lat: number; lng: number } };
                rating?: number;
                user_ratings_total?: number;
                opening_hours?: unknown;
                photos?: { photo_reference: string }[];
                formatted_phone_number?: string;
                website?: string;
                types?: string[];
            };
        };

        if (!detailsData.result) {
            summary.errors.push(`Sin detalles para place_id ${result.place_id}`);
            continue;
        }

        const place = detailsData.result;

        // PASO 3: Verificar si ya existe
        const { data: existing } = await supabase
            .from('places')
            .select('id')
            .eq('google_place_id', result.place_id)
            .single();

        if (existing) {
            const { count } = await supabase
                .from('place_photos')
                .select('id', { count: 'exact', head: true })
                .eq('place_id', existing.id);

            if (count === 0 && place.photos?.length) {
                const n = await insertPhotos(existing.id, place.name, place.photos, summary, true);
                console.log(`  ⏭️  Skip: ${place.name} (backfill ${n} fotos)`);
            } else {
                console.log(`  ⏭️  Skip: ${place.name} (fotos: ${count})`);
            }
            summary.skipped++;
            continue;
        }

        // PASO 4: Insertar en places
        const { data: inserted, error: insertError } = await supabase
            .from('places')
            .insert({
                google_place_id: result.place_id,
                slug: generateSlug(place.name),
                name: place.name,
                address: place.formatted_address,
                photo_reference: place.photos?.[0]?.photo_reference || null,
                zone: target.zone,
                city: 'Guatemala',
                latitude: place.geometry?.location?.lat || null,
                longitude: place.geometry?.location?.lng || null,
                phone: place.formatted_phone_number || null,
                website: place.website || null,
                rating: place.rating || null,
                rating_count: place.user_ratings_total || 0,
                hours: place.opening_hours || null,
                primary_category: getPrimaryCategory(place.types || []),
                category: getPrimaryCategory(place.types || []),
                tags: place.types || [],
                source: 'google_places',
                is_active: true,
                is_published: true,
                is_verified: false,
                is_featured: false,
                last_synced_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (insertError || !inserted) {
            const msg = `Error insertando ${place.name}: ${insertError?.message}`;
            console.log(`  ❌ ${msg}`);
            summary.errors.push(msg);
            continue;
        }

        // PASO 5: Insertar fotos
        const n = await insertPhotos(inserted.id, place.name, place.photos || [], summary);
        console.log(`  ✅ ${place.name} (${n} fotos)`);
        summary.inserted++;
    }
}

async function main() {
    console.log('🚀 EXPAND IMPORTER — GuateLive');
    console.log(`   Targets: ${targets.length} | Límite: ${PLACES_PER_TARGET}/target | Fotos: ${MAX_PHOTOS_PER_PLACE}/lugar`);
    console.log(`   Estimado: ~${targets.length * PLACES_PER_TARGET} lugares, ~${Math.round(targets.length * PLACES_PER_TARGET * 1.5)} minutos\n`);

    const summary: Summary = { inserted: 0, skipped: 0, photosNew: 0, photosBackfilled: 0, errors: [] };
    const startTime = Date.now();

    for (let i = 0; i < targets.length; i++) {
        await processTarget(targets[i], i, summary);
        if (i < targets.length - 1) await sleep(DELAY_BETWEEN_TARGETS);
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('\n═══════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log(`   ✅ Insertados:         ${summary.inserted} lugares`);
    console.log(`   ⏭️  Skipped:            ${summary.skipped} (ya existían)`);
    console.log(`   📸 Fotos nuevas:       ${summary.photosNew}`);
    console.log(`   📸 Fotos backfilled:   ${summary.photosBackfilled}`);
    console.log(`   ❌ Errores:            ${summary.errors.length}`);
    if (summary.errors.length > 0) {
        summary.errors.forEach(e => console.log(`      - ${e}`));
    }
    console.log(`   ⏱️  Tiempo total:       ${duration} min`);
    console.log('═══════════════════════════════════');
}

main().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar .env.local
config({ path: resolve('.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuración de límites
const ZONES = ['Zona 10', 'Zona 14', 'Zona 15', 'Zona 4', 'Cayalá', 'Antigua'];
const PLACES_PER_ZONE = 30;
const DELAY_BETWEEN_REQUESTS = 100;
const DELAY_BETWEEN_ZONES = 2000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generar slug desde nombre
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Extraer categoría principal de types
function getPrimaryCategory(types: string[]): string {
    if (!types) return 'Restaurante';

    if (types.includes('cafe')) return 'Café';
    if (types.includes('bakery')) return 'Café';
    if (types.includes('bar')) return 'Bar';
    if (types.includes('restaurant')) return 'Restaurante';

    return 'Restaurante';
}

async function importPlaces() {
    console.log('🔍 Importando restaurantes de Google Places...\n');

    let totalImported = 0;
    let totalRequests = 0;

    for (const zone of ZONES) {
        console.log(`📍 Procesando ${zone}...`);

        try {
            // PASO 1: Text Search
            const searchUrl = new URL(
                'https://maps.googleapis.com/maps/api/place/textsearch/json'
            );
            searchUrl.searchParams.append('query', `restaurantes ${zone} Guatemala`);
            searchUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);

            const searchResponse = await fetch(searchUrl.toString());
            const searchData = (await searchResponse.json()) as any;

            if (!searchData.results || searchData.results.length === 0) {
                console.log(`  ⚠️  Sin resultados para ${zone}`);
                continue;
            }

            const placesToProcess = searchData.results.slice(0, PLACES_PER_ZONE);
            console.log(`  Found ${placesToProcess.length} places...`);

            for (const result of placesToProcess) {
                totalRequests++;
                await sleep(DELAY_BETWEEN_REQUESTS);

                try {
                    // PASO 2: Get Details
                    const detailsUrl = new URL(
                        'https://maps.googleapis.com/maps/api/place/details/json'
                    );
                    detailsUrl.searchParams.append('place_id', result.place_id);
                    detailsUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
                    detailsUrl.searchParams.append(
                        'fields',
                        'name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos,formatted_phone_number,website,types'
                    );

                    const detailsResponse = await fetch(detailsUrl.toString());
                    const detailsData = (await detailsResponse.json()) as any;

                    if (!detailsData.result) {
                        console.log(`    ⚠️  No details`);
                        continue;
                    }

                    const place = detailsData.result;

                    // PASO 3: Mapear campos de forma correcta
                    const slug = generateSlug(place.name);
                    const primaryCategory = getPrimaryCategory(place.types || []);

                    // PASO 4: Insertar en Supabase
                    const { error } = await supabase.from('places').upsert(
                        {
                            google_place_id: result.place_id,
                            slug: slug,
                            name: place.name,
                            address: place.formatted_address,
                            photo_reference: place.photos?.[0]?.photo_reference || null,
                            zone: zone,
                            city: 'Guatemala',
                            latitude: place.geometry?.location?.lat || null,
                            longitude: place.geometry?.location?.lng || null,
                            phone: place.formatted_phone_number || null,
                            website: place.website || null,
                            rating: place.rating || null,
                            rating_count: place.user_ratings_total || 0,
                            hours: place.opening_hours || null,
                            primary_category: primaryCategory,
                            tags: place.types || [],
                            category: primaryCategory,
                            source: 'google_places',
                            is_active: true,
                            is_published: false,
                            is_verified: false,
                            is_featured: false,
                            last_synced_at: new Date().toISOString(),
                        },
                        { onConflict: 'google_place_id' }
                    );

                    if (error) {
                        console.log(`    ❌ ${place.name}: ${error.message}`);
                    } else {
                        totalImported++;
                        console.log(`    ✅ ${place.name}`);
                    }
                } catch (e) {
                    console.error(`    ❌ Error:`, e);
                }
            }

            await sleep(DELAY_BETWEEN_ZONES);
        } catch (error) {
            console.error(`❌ Error en ${zone}:`, error);
        }
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n✨ Import completado.`);
    console.log(`   Total importados: ${totalImported}`);
    console.log(`   Total requests: ${totalRequests}`);
    console.log(`   Tiempo: ${duration} minutos`);
    console.log(`   Costo estimado: $${(totalRequests * 0.04).toFixed(2)}`);
}

const startTime = Date.now();
importPlaces().catch(console.error);
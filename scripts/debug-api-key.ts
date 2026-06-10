import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('.env.local') });

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const nextPublicKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

console.log('🔍 Diagnóstico de API Key\n');
console.log('GOOGLE_PLACES_API_KEY:        ', apiKey ? apiKey.slice(0, 10) + '...' : '❌ NO DEFINIDA');
console.log('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY:', nextPublicKey ? nextPublicKey.slice(0, 10) + '...' : '❌ NO DEFINIDA');
console.log('Son iguales:', apiKey === nextPublicKey);

const keyToUse = apiKey || nextPublicKey;

if (!keyToUse) {
    console.log('\n❌ Ninguna API key encontrada. Revisá tu .env.local');
    process.exit(1);
}

console.log('\n📡 Haciendo fetch de prueba...\n');

const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurantes+zona+10+Guatemala&key=${keyToUse}`;

const res = await fetch(url);
const data = await res.json();

console.log('Status HTTP:', res.status);
console.log('Respuesta completa:');
console.log(JSON.stringify(data, null, 2));

import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: places } = await supabase
    .from('places')
    .select('id, name, zone, rating')
    .limit(5);

  return (
    <main className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-serif mb-4">
        GuateLive
      </h1>
      <p className="text-gray-600 mb-8">
        Conexión a Supabase funcionando ✓
      </p>

      <ul className="space-y-2">
        {places?.map(place => (
          <li key={place.id} className="border-b py-2">
            <strong>{place.name}</strong> · {place.zone} · ⭐ {place.rating}
          </li>
        ))}
      </ul>
    </main>
  );
}
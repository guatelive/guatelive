import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = {
    title: '¿Qué hacemos hoy? — GuateLive',
    description: 'La guía editorial de planes en Guatemala. Restaurantes, bares, cafés curados semanalmente.',
    openGraph: {
        title: '¿Qué hacemos hoy? — GuateLive',
        description: 'Descubre planes en Guatemala con voz editorial',
        type: 'website',
        url: 'https://guatelive.gt',
        images: [{ url: '/og-home.jpg', width: 1200, height: 630 }],
    },
};

export default async function Home() {
    const supabase = await createClient();

    // Test: traer algunos lugares
    const { data: places } = await supabase
        .from('places')
        .select('id, name, slug, zone, rating, primary_category')
        .eq('is_active', true)
        .limit(6);


    console.log(places)

    return (
        <main className="container mx-auto px-4 py-12">
            {/* Hero */}
            <section className="max-w-2xl mx-auto text-center mb-16">
                <h1 className="font-serif text-5xl md:text-6xl mb-4">
                    ¿Qué hacemos <em className="italic text-[#E11D2E]">hoy</em>?
                </h1>
                <p className="text-lg text-[#666666] mb-8">
                    Te ayudamos a salir del piloto automático
                </p>

                {/* Input de búsqueda */}
                <input
                    type="text"
                    placeholder="café con amigas, cena romántica, donde trabajar..."
                    className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#E11D2E] mb-8"
                />

                {/* Burbujas iniciales (Capa 1: qué) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Cenar afuera', 'Tomar algo', 'Música viva', 'Brunch', 'Trabajar', 'Plan familia', 'Evento cultural', 'Sorprendeme'].map(
                        (option, i) => (
                            <button
                                key={i}
                                className="py-3 px-2 border border-[#E5E5E5] rounded-lg hover:border-[#E11D2E] hover:bg-[#FAFAFA] transition text-sm font-medium"
                            >
                                {option}
                            </button>
                        )
                    )}
                </div>
            </section>

            {/* Edición de la semana */}
            <section className="mb-16">
                <div className="mb-4 flex items-center gap-3">
                    <div className="line-red" />
                    <span className="badge-editorial">EDICIÓN Nº 1</span>
                </div>
                <h2 className="font-serif text-4xl mb-2">
                    Cafés para <em className="italic">trabajar</em> en Zona 14
                </h2>
                <p className="text-[#666666] mb-6">
                    Encontramos los 5 mejores cafés con wifi, enchufes y buena vibe para pasar el día trabajando.
                </p>
                <Link href="/edicion/n1-cafes-zona-14" className="btn-primary px-6 py-2 rounded inline-block">
                    Leer edición →
                </Link>
            </section>

            {/* Lugares recientes */}
            <section>
                <h3 className="font-serif text-2xl mb-6">Lugares destacados</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {places?.map(place => (
                        <Link key={place.id} href={`/lugar/${place.slug}`}>
                            <article className="place-card cursor-pointer">
                                <div className="w-full h-48 bg-[#FAFAFA] flex items-center justify-center">
                                    <span className="text-[#999999]">Foto de {place.name}</span>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-serif text-lg mb-1">{place.name}</h4>
                                    <p className="text-sm text-[#666666] mb-2">
                                        {place.zone} · {place.primary_category}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">⭐ {place.rating || '-'}</span>
                                        <span className="text-xs badge-editorial">Ver</span>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
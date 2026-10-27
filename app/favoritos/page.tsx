import { FavoritesClient } from '@/components/favorites/favorites-client';

export const metadata = {
    title: 'Mis favoritos | GuateLive',
    description: 'Los lugares, eventos y actividades que guardaste en GuateLive.',
    // Contenido distinto para cada visitante (vive en su navegador): no se indexa.
    robots: { index: false, follow: true },
};

export default function FavoritosPage() {
    return (
        <div className="mx-auto max-w-6xl px-6 py-10">
            <h1 className="mb-2 font-serif text-3xl font-bold text-[#0A0A0A]">Mis favoritos</h1>
            <p className="mb-8 text-sm text-[#666666]">
                Se guardan en este navegador, sin cuenta. Si borrás los datos del navegador, se pierden.
            </p>
            <FavoritesClient />
        </div>
    );
}

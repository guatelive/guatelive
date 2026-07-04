import type { Metadata } from 'next';
import BuscarClient from './BuscarClient';
import { SITE_URL } from '@/lib/site-config';

type SearchParams = Promise<{ zone?: string; q?: string; tipo?: string }>;

export async function generateMetadata(props: { searchParams: SearchParams }): Promise<Metadata> {
    const { zone } = await props.searchParams;

    if (zone) {
        return {
            title: `Restaurantes y planes en ${zone} — GuateLive`,
            description: `Descubre restaurantes, cafés y bares en ${zone}, Guatemala — con horarios, ubicación y reseñas.`,
            alternates: { canonical: `${SITE_URL}/buscar?zone=${encodeURIComponent(zone)}` },
        };
    }

    return {
        title: 'Buscar — GuateLive',
        description: 'Busca restaurantes, cafés, bares y eventos en Guatemala por zona, categoría o nombre.',
        alternates: { canonical: `${SITE_URL}/buscar` },
    };
}

export default function BuscarPage() {
    return <BuscarClient />;
}

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 3600;

export const metadata = {
    title: 'Ediciones — GuateLive',
    description: 'Todas las ediciones editoriales de GuateLive. Curaduría semanal de los mejores planes en Guatemala.',
    alternates: { canonical: `${SITE_URL}/edicion` },
};

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default async function EdicionesPage() {
    const supabase = getSupabase();
    const { data: editions } = await supabase
        .from('editions')
        .select('number, slug, title, subtitle, published_at, cover_image_url')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    return (
        <SiteLayout>
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
                <div className="mb-12">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                        Archivo
                    </p>
                    <div className="mt-2 h-[2px] w-8 bg-[#E11D2E]" />
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">
                        Ediciones
                    </h1>
                    <p className="mt-3 text-lg text-muted-foreground">
                        Curaduría editorial semanal. Sin spam, sin patrocinios disfrazados.
                    </p>
                </div>

                {!editions || editions.length === 0 ? (
                    <p className="text-muted-foreground">Próximamente la primera edición.</p>
                ) : (
                    <div className="space-y-6">
                        {editions.map((edition) => {
                            const publishDate = edition.published_at
                                ? new Date(edition.published_at).toLocaleDateString('es-GT', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })
                                : null;

                            return (
                                <Link
                                    key={edition.slug}
                                    href={`/edicion/${edition.slug}`}
                                    className="group flex gap-5 rounded-2xl border border-border p-5 transition-all hover:border-[#E11D2E] hover:-translate-y-0.5"
                                >
                                    {edition.cover_image_url && (
                                        <div className="hidden shrink-0 overflow-hidden rounded-lg sm:block" style={{ width: 120, height: 90 }}>
                                            <img
                                                src={edition.cover_image_url}
                                                alt={edition.title}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E11D2E]">
                                                Edición Nº {edition.number}
                                            </p>
                                            <h2 className="mt-1 font-serif text-xl text-foreground group-hover:text-[#E11D2E] transition-colors">
                                                {edition.title}
                                            </h2>
                                            {edition.subtitle && (
                                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                    {edition.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            {publishDate && (
                                                <span className="text-xs text-muted-foreground">{publishDate}</span>
                                            )}
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E11D2E]">
                                                Leer <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </SiteLayout>
    );
}

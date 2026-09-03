import Link from 'next/link';
import { SITE_URL } from '@/lib/site-config';

type BreadcrumbItem = { name: string; url: string };

interface Props {
    items: BreadcrumbItem[];
    className?: string;
}

// Renderiza visualmente el mismo array que cada página ya le pasa a
// `buildBreadcrumbSchema()` (lib/schema-builders.ts) para el JSON-LD — un solo dato,
// sin duplicar la lista de items entre el schema y la UI.
export function Breadcrumb({ items, className }: Props) {
    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[#666666]">
                {items.map((item, i) => {
                    const isLast = i === items.length - 1;
                    const href = item.url.replace(SITE_URL, '') || '/';
                    return (
                        <li key={item.url} className="flex items-center gap-x-1.5">
                            {isLast ? (
                                <span>{item.name}</span>
                            ) : (
                                <>
                                    <Link href={href} className="hover:text-[#0A0A0A] transition-colors">
                                        {item.name}
                                    </Link>
                                    <span aria-hidden="true">/</span>
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

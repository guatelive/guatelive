import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { PriceTier } from '@/lib/types';

export type InfoRow = {
    icon: LucideIcon;
    label: string;
    content: ReactNode;
};

// Ficha de datos clave (cuándo, dónde, precios) para /evento/[slug] y
// /actividad/[slug] — en desktop vive en la columna derecha (sticky), en mobile
// va justo bajo el título. `footer` lleva las acciones (CTA externo, compartir).
export function DetailInfoCard({ rows, footer }: { rows: InfoRow[]; footer?: ReactNode }) {
    if (rows.length === 0 && !footer) return null;
    return (
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA]">
            <dl className="divide-y divide-[#E5E5E5]">
                {rows.map(({ icon: Icon, label, content }) => (
                    <div key={label} className="flex gap-4 px-5 py-4">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#0A0A0A] shadow-sm">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <dt className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-[#666666]">
                                {label}
                            </dt>
                            <dd className="text-sm text-[#0A0A0A]">{content}</dd>
                        </div>
                    </div>
                ))}
            </dl>
            {footer && (
                <div className="flex flex-col items-stretch gap-2 border-t border-[#E5E5E5] bg-white px-5 py-4">
                    {footer}
                </div>
            )}
        </div>
    );
}

function formatQ(price: number): string {
    return `Q${price.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Contenido de la fila "Precios": lista de tiers ordenada de menor a mayor,
// precio único, "Gratis", o null si no se sabe (la fila no se muestra).
export function priceRowContent(input: { is_free: boolean; price: number | null; price_tiers: PriceTier[] }): ReactNode | null {
    if (input.price_tiers.length > 0) {
        const tiers = [...input.price_tiers].sort((a, b) => a.price - b.price);
        return (
            <ul className="mt-1 space-y-1.5">
                {tiers.map(tier => (
                    <li key={tier.label} className="flex items-baseline gap-2">
                        <span>{tier.label}</span>
                        <span className="flex-1 border-b border-dotted border-[#CCCCCC]" aria-hidden />
                        <span className="font-semibold tabular-nums">{formatQ(tier.price)}</span>
                    </li>
                ))}
            </ul>
        );
    }
    if (input.is_free) {
        return (
            <span className="inline-block rounded bg-[#EFF4E8] px-2.5 py-0.5 text-sm font-semibold text-[#3B6D11]">
                Gratis
            </span>
        );
    }
    if (input.price !== null) return <span className="font-semibold">{formatQ(input.price)}</span>;
    return null;
}

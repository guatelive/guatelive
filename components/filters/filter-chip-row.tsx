'use client';

import { FEATURED_TAGS } from '@/lib/event-tags';

export type ChipOption = { value: string; label: string };

export function chipClass(active: boolean) {
    return `shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition ${active
        ? 'bg-[#E11D2E] text-white'
        : 'bg-[#F0F0F0] text-[#0A0A0A] hover:bg-[#E5E5E5]'
        }`;
}

// Fila de chips de selección única. En mobile scrollea en horizontal (con 15
// categorías o 17 zonas, envolver en varias líneas empuja los resultados fuera de
// pantalla); en desktop envuelve.
export function FilterChipRow({
    label,
    allLabel,
    options,
    selected,
    onSelect,
}: {
    label: string;
    allLabel?: string;
    options: ChipOption[];
    selected: string | null;
    onSelect: (value: string | null) => void;
}) {
    return (
        <div className="mb-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#666666]">{label}</p>
            <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {allLabel && (
                    <button onClick={() => onSelect(null)} className={chipClass(selected === null)}>
                        {allLabel}
                    </button>
                )}
                {options.map(o => (
                    <button
                        key={o.value}
                        onClick={() => onSelect(selected === o.value ? null : o.value)}
                        className={chipClass(selected === o.value)}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Opciones derivadas de los items ya cargados, para no mostrar chips con 0 resultados.
export function distinctOptions(values: string[]): ChipOption[] {
    return Array.from(new Set(values.filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map(v => ({ value: v, label: v }));
}

// Intereses de moda (FEATURED_TAGS) presentes en al menos un item.
export function interestOptions(items: { tags: string[] }[]): ChipOption[] {
    const used = new Set(items.flatMap(i => i.tags));
    return FEATURED_TAGS
        .filter(f => used.has(f.tag))
        .map(f => ({ value: f.tag, label: `${f.emoji} ${f.label}` }));
}

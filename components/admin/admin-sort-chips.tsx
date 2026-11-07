import Link from 'next/link';

interface Props<K extends string> {
    options: { key: K; label: string }[];
    active: K;
    // Otros query params que el orden no debe pisar (ej. filtro y búsqueda de /admin/places).
    params?: Record<string, string>;
}

export function AdminSortChips<K extends string>({ options, active, params = {} }: Props<K>) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#666666] mr-1">Ordenar:</span>
            {options.map(opt => (
                <Link
                    key={opt.key}
                    href={`?${new URLSearchParams({ ...params, sort: opt.key })}`}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active === opt.key
                            ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                            : 'border-[#E5E5E5] text-[#666666] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                    }`}
                >
                    {opt.label}
                </Link>
            ))}
        </div>
    );
}

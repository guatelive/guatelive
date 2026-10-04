'use client';

import { useEffect, useState } from 'react';

interface Props {
    name: string;
    defaultValue?: string[];
    onChange?: (dates: string[]) => void;
}

// "2026-10-12T20:00:00" (DB) → "2026-10-12T20:00" (lo que acepta datetime-local).
function toDatetimeLocal(iso: string): string {
    return iso.slice(0, 16);
}

// Funciones adicionales de un evento (obra con varias fechas) — calcado de
// PriceTiersInput: filas editables + hidden input con JSON. Filas vacías no se
// serializan; el orden/dedup final lo hace la server action (normalizeShowtimes).
export function ExtraDatesInput({ name, defaultValue = [], onChange }: Props) {
    const [rows, setRows] = useState<string[]>(defaultValue.map(toDatetimeLocal));
    const serialized = rows.filter(r => r.trim() !== '');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { onChange?.(serialized); }, [JSON.stringify(serialized)]);

    function updateRow(i: number, value: string) {
        setRows(prev => prev.map((r, idx) => (idx === i ? value : r)));
    }

    function addRow() {
        setRows(prev => [...prev, '']);
    }

    function removeRow(i: number) {
        setRows(prev => prev.filter((_, idx) => idx !== i));
    }

    return (
        <div>
            <input type="hidden" name={name} value={JSON.stringify(serialized)} />

            {rows.length > 0 && (
                <div className="mb-2 space-y-2">
                    {rows.map((row, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-20 shrink-0 text-xs text-[#666666]">Función {i + 2}</span>
                            <input
                                type="datetime-local"
                                value={row}
                                onChange={e => updateRow(i, e.target.value)}
                                className="h-9 flex-1 rounded-md border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0A0A0A]"
                            />
                            <button
                                type="button"
                                onClick={() => removeRow(i)}
                                aria-label={`Quitar función ${i + 2}`}
                                className="text-sm text-[#999999] hover:text-[#E11D2E]"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={addRow}
                className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
            >
                + Agregar otra función
            </button>
        </div>
    );
}

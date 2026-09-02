'use client';

import { useEffect, useState } from 'react';
import type { PriceTier } from '@/lib/types';

interface Props {
    name: string;
    defaultValue?: PriceTier[];
    onChange?: (tiers: PriceTier[]) => void;
}

type Row = { label: string; price: string };

function toRows(tiers: PriceTier[]): Row[] {
    return tiers.map(t => ({ label: t.label, price: String(t.price) }));
}

// Filas con label o precio vacíos no se serializan — le permite al admin escribir en
// cualquier orden sin perder lo que ya tecleó en la otra columna de esa fila.
function serialize(rows: Row[]): PriceTier[] {
    return rows
        .filter(r => r.label.trim() !== '' && r.price.trim() !== '' && !isNaN(parseFloat(r.price)))
        .map(r => ({ label: r.label.trim(), price: parseFloat(r.price) }));
}

export function PriceTiersInput({ name, defaultValue = [], onChange }: Props) {
    const [rows, setRows] = useState<Row[]>(toRows(defaultValue));
    const serialized = serialize(rows);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { onChange?.(serialized); }, [JSON.stringify(serialized)]);

    function updateRow(i: number, field: keyof Row, value: string) {
        setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    }

    function addRow() {
        setRows(prev => [...prev, { label: '', price: '' }]);
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
                            <input
                                type="text"
                                value={row.label}
                                onChange={e => updateRow(i, 'label', e.target.value)}
                                placeholder="Nombre (ej. Nacional, VIP, Niño)"
                                className="h-9 flex-1 rounded-md border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0A0A0A]"
                            />
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-[#666666]">Q</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.price}
                                    onChange={e => updateRow(i, 'price', e.target.value)}
                                    className="h-9 w-24 rounded-md border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0A0A0A]"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeRow(i)}
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
                + Agregar precio
            </button>
        </div>
    );
}

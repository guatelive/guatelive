'use client';

import { useState } from 'react';
import type { ActivityLocation } from '@/lib/types';

interface Props {
    name: string;
    zoneListId: string;
    defaultValue?: ActivityLocation[];
}

const INPUT_CLASS = 'h-9 w-full rounded-md border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0A0A0A]';

// A diferencia de PriceTiersInput, los campos son `required`: una sede a medio llenar
// bloquea el guardado en vez de descartarse sin avisar.
export function ActivityLocationsInput({ name, zoneListId, defaultValue = [] }: Props) {
    const [rows, setRows] = useState<ActivityLocation[]>(defaultValue);

    function updateRow(i: number, field: keyof ActivityLocation, value: string) {
        setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    }

    function addRow() {
        setRows(prev => [...prev, { name: '', zone: '', schedule: '' }]);
    }

    function removeRow(i: number) {
        setRows(prev => prev.filter((_, idx) => idx !== i));
    }

    return (
        <div>
            <input type="hidden" name={name} value={JSON.stringify(rows)} />

            {rows.length > 0 && (
                <div className="mb-2 space-y-3">
                    {rows.map((row, i) => (
                        <div key={i} className="space-y-2 rounded-md border border-[#E5E5E5] p-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={row.name}
                                    onChange={e => updateRow(i, 'name', e.target.value)}
                                    placeholder="Nombre de la sede (ej. Padel Arena Cayalá)"
                                    aria-label="Nombre de la sede"
                                    required
                                    className={INPUT_CLASS}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRow(i)}
                                    aria-label="Quitar sede"
                                    className="text-sm text-[#999999] hover:text-[#E11D2E]"
                                >
                                    ×
                                </button>
                            </div>
                            <input
                                type="text"
                                list={zoneListId}
                                value={row.zone}
                                onChange={e => updateRow(i, 'zone', e.target.value)}
                                placeholder="Zona (ej. Cayalá)"
                                aria-label="Zona de la sede"
                                required
                                className={INPUT_CLASS}
                            />
                            <input
                                type="text"
                                value={row.schedule}
                                onChange={e => updateRow(i, 'schedule', e.target.value)}
                                placeholder="Horario (ej. Lunes a domingo 7am–10pm)"
                                aria-label="Horario de la sede"
                                required
                                className={INPUT_CLASS}
                            />
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={addRow}
                className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
            >
                + Agregar sede
            </button>
        </div>
    );
}

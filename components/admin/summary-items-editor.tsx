'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

export type SummaryItem = { label: string; value: string };

interface Props {
    name: string;
    defaultValue?: SummaryItem[];
    onSummaryChange?: (items: SummaryItem[]) => void;
}

export function SummaryItemsEditor({ name, defaultValue = [], onSummaryChange }: Props) {
    const [items, setItems] = useState<SummaryItem[]>(
        defaultValue.length > 0 ? defaultValue : [{ label: '', value: '' }]
    );

    function setAndNotify(next: SummaryItem[]) {
        setItems(next);
        onSummaryChange?.(next.filter(i => i.label.trim() && i.value.trim()));
    }

    function updateItem(i: number, field: keyof SummaryItem, value: string) {
        setAndNotify(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
    }

    function addItem() {
        setAndNotify([...items, { label: '', value: '' }]);
    }

    function removeItem(i: number) {
        setAndNotify(items.filter((_, idx) => idx !== i));
    }

    const validItems = items.filter(item => item.label.trim() && item.value.trim());

    return (
        <div>
            <input type="hidden" name={name} value={JSON.stringify(validItems)} />
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <Input
                            placeholder="Ej. Club Graciela"
                            value={item.label}
                            onChange={e => updateItem(i, 'label', e.target.value)}
                            className="flex-1"
                        />
                        <Input
                            placeholder="Ej. Q93"
                            value={item.value}
                            onChange={e => updateItem(i, 'value', e.target.value)}
                            className="w-28"
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="rounded-md border border-[#E5E5E5] px-3 text-sm text-[#666666] hover:bg-[#FAFAFA]"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={addItem}
                className="mt-2 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#0A0A0A] hover:bg-[#FAFAFA]"
            >
                + Agregar línea
            </button>
        </div>
    );
}

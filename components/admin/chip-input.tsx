'use client';

import { useState } from 'react';

interface Props {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    renderChip?: (chip: string, onRemove: () => void) => React.ReactNode;
}

// Chips de texto libre, sin taxonomía curada — a diferencia de TagPicker (eventos),
// que sí agrupa por categorías porque esos tags alimentan búsqueda. Acá son solo
// etiquetas editoriales/visuales.
export function ChipInput({ value, onChange, placeholder, renderChip }: Props) {
    const [draft, setDraft] = useState('');

    function addChip() {
        const chip = draft.trim();
        if (chip && !value.includes(chip)) {
            onChange([...value, chip]);
        }
        setDraft('');
    }

    function removeChip(chip: string) {
        onChange(value.filter(c => c !== chip));
    }

    return (
        <div>
            {value.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {value.map(chip =>
                        renderChip ? (
                            <span key={chip}>{renderChip(chip, () => removeChip(chip))}</span>
                        ) : (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => removeChip(chip)}
                                className="rounded-full bg-[#0A0A0A] px-3 py-1 text-xs text-white"
                                title="Quitar"
                            >
                                {chip} ×
                            </button>
                        )
                    )}
                </div>
            )}
            <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addChip();
                    }
                }}
                placeholder={placeholder}
                className="h-9 w-full rounded-md border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0A0A0A]"
            />
        </div>
    );
}

'use client';

import { useState } from 'react';
import { EVENT_TAG_GROUPS } from '@/lib/event-tags';

interface Props {
    name: string;
    defaultValue?: string[];
}

export function TagPicker({ name, defaultValue = [] }: Props) {
    const [selected, setSelected] = useState<string[]>(defaultValue);
    const [customTag, setCustomTag] = useState('');

    const allKnownTags = new Set(EVENT_TAG_GROUPS.flatMap(g => g.tags));
    const extraTags = selected.filter(t => !allKnownTags.has(t));

    function toggle(tag: string) {
        setSelected(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
    }

    function addCustomTag() {
        const tag = customTag.trim().toLowerCase().replace(/\s+/g, '-');
        if (tag && !selected.includes(tag)) {
            setSelected(prev => [...prev, tag]);
        }
        setCustomTag('');
    }

    return (
        <div>
            <input type="hidden" name={name} value={selected.join(',')} />

            {extraTags.length > 0 && (
                <div className="mb-3">
                    <p className="mb-1 text-xs text-[#666666]">Tus tags</p>
                    <div className="flex flex-wrap gap-2">
                        {extraTags.map(tag => (
                            <TagChip key={tag} tag={tag} selected onClick={() => toggle(tag)} />
                        ))}
                    </div>
                </div>
            )}

            {EVENT_TAG_GROUPS.map(group => (
                <div key={group.label} className="mb-3">
                    <p className="mb-1 text-xs text-[#666666]">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                        {group.tags.map(tag => (
                            <TagChip key={tag} tag={tag} selected={selected.includes(tag)} onClick={() => toggle(tag)} />
                        ))}
                    </div>
                </div>
            ))}

            <div className="mt-2 flex gap-2">
                <input
                    type="text"
                    value={customTag}
                    onChange={e => setCustomTag(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTag();
                        }
                    }}
                    placeholder="Agregar tag nuevo…"
                    className="h-9 flex-1 rounded-md border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0A0A0A]"
                />
                <button
                    type="button"
                    onClick={addCustomTag}
                    className="rounded-md border border-[#E5E5E5] px-3 text-sm text-[#0A0A0A] hover:bg-[#FAFAFA]"
                >
                    Agregar
                </button>
            </div>
        </div>
    );
}

function TagChip({ tag, selected, onClick }: { tag: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                selected
                    ? 'rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-3 py-1 text-xs text-white'
                    : 'rounded-full border border-[#E5E5E5] bg-white px-3 py-1 text-xs text-[#666666] hover:border-[#0A0A0A]'
            }
        >
            {tag}
        </button>
    );
}

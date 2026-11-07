'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';

export type PlanItemOption = {
    type: 'place' | 'event' | 'activity';
    id: string;
    title: string;
    meta: string;
    published: boolean;
};

export type PlanEditorItem = {
    key: number;         // key estable de React — nunca el índice (ver activity-gallery-editor.tsx)
    item_type: 'place' | 'event' | 'activity' | 'custom';
    ref_id?: string;     // place_id / event_id / activity_id según item_type
    ref_title?: string;  // solo para mostrar
    ref_meta?: string;
    ref_published?: boolean;
    custom_title?: string;
    custom_subtitle?: string;
    label?: string;
    editorial_note?: string;
    sponsored: boolean;
};

const TYPE_BADGE: Record<PlanEditorItem['item_type'], { label: string; className: string }> = {
    place: { label: 'LUGAR', className: 'bg-[#DBEAFE] text-[#1D4ED8]' },
    event: { label: 'EVENTO', className: 'bg-[#FFEDD5] text-[#9A3412]' },
    activity: { label: 'ACTIVIDAD', className: 'bg-[#E4E4E7] text-[#3F3F46]' },
    custom: { label: 'CUSTOM', className: 'border border-dashed border-[#A1A1AA] bg-[#F4F4F5] text-[#3F3F46]' },
};

let nextKey = 0;
function newEditorKey() {
    return nextKey++;
}

function normalize(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Lo que se manda a la server action (hidden input "items"), en orden.
function serialize(items: PlanEditorItem[]) {
    return items.map(item => ({
        item_type: item.item_type,
        place_id: item.item_type === 'place' ? item.ref_id : undefined,
        event_id: item.item_type === 'event' ? item.ref_id : undefined,
        activity_id: item.item_type === 'activity' ? item.ref_id : undefined,
        custom_title: item.custom_title,
        custom_subtitle: item.custom_subtitle,
        label: item.label,
        editorial_note: item.editorial_note,
        sponsored: item.sponsored,
    }));
}

const inputClass = 'h-9 w-full rounded-md border border-[#E5E5E5] px-2 text-sm focus:border-[#0A0A0A] focus:outline-none';

export type PlanEditorItemInput = Omit<PlanEditorItem, 'key'>;

export function PlanItemsEditor({ options, defaultValue = [] }: { options: PlanItemOption[]; defaultValue?: PlanEditorItemInput[] }) {
    const [items, setItems] = useState<PlanEditorItem[]>(() => defaultValue.map(item => ({ ...item, key: newEditorKey() })));
    const [query, setQuery] = useState('');

    const results = useMemo(() => {
        const q = normalize(query.trim());
        if (q.length < 2) return [];
        return options.filter(o => normalize(o.title).includes(q)).slice(0, 8);
    }, [options, query]);

    function addOption(option: PlanItemOption) {
        setItems(prev => [
            ...prev,
            {
                key: newEditorKey(),
                item_type: option.type,
                ref_id: option.id,
                ref_title: option.title,
                ref_meta: option.meta,
                ref_published: option.published,
                sponsored: false,
            },
        ]);
        setQuery('');
    }

    function addCustom() {
        // Hereda el label del item custom anterior: cargar 4 partidos seguidos es el caso común.
        const lastCustom = [...items].reverse().find(i => i.item_type === 'custom');
        setItems(prev => [...prev, { key: newEditorKey(), item_type: 'custom', label: lastCustom?.label, sponsored: false }]);
    }

    function update(key: number, patch: Partial<PlanEditorItem>) {
        setItems(prev => prev.map(i => (i.key === key ? { ...i, ...patch } : i)));
    }

    function remove(key: number) {
        setItems(prev => prev.filter(i => i.key !== key));
    }

    function move(index: number, dir: -1 | 1) {
        setItems(prev => {
            const target = index + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault(); // no mandar el form
            if (results[0]) addOption(results[0]);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <input type="hidden" name="items" value={JSON.stringify(serialize(items))} />

            <div className="flex flex-col gap-2.5 rounded-xl border border-[#E5E5E5] bg-white p-4">
                <label htmlFor="plan-item-search" className="text-sm font-semibold text-[#0A0A0A]">Agregar item</label>
                <div className="flex flex-wrap gap-2">
                    <input
                        id="plan-item-search"
                        type="search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={onSearchKeyDown}
                        placeholder="Buscar lugar, evento o actividad…"
                        autoComplete="off"
                        className="h-10 min-w-0 flex-[1_1_260px] rounded-md border border-[#E5E5E5] px-3 text-sm focus:border-[#0A0A0A] focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={addCustom}
                        className="h-10 rounded-md border border-dashed border-[#999999] bg-white px-3.5 text-sm hover:border-[#0A0A0A]"
                    >
                        + Item custom
                    </button>
                </div>
                {query.trim().length >= 2 && (
                    <ul className="overflow-hidden rounded-md border border-[#E5E5E5]">
                        {results.map((option, i) => (
                            <li key={`${option.type}-${option.id}`} className="border-b border-[#F0F0F0] last:border-0">
                                <button
                                    type="button"
                                    onClick={() => addOption(option)}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[#F5F4F0] ${i === 0 ? 'bg-[#FAFAF8]' : ''}`}
                                >
                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${TYPE_BADGE[option.type].className}`}>
                                        {TYPE_BADGE[option.type].label}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate">
                                        {option.title} {option.meta && <span className="text-[#666666]">· {option.meta}</span>}
                                    </span>
                                    {!option.published && <span className="text-xs text-[#B45309]">No publicado</span>}
                                    {i === 0 && <span className="hidden text-xs text-[#666666] sm:inline">Enter</span>}
                                </button>
                            </li>
                        ))}
                        {results.length === 0 && <li className="px-3 py-2.5 text-sm text-[#666666]">Sin resultados.</li>}
                    </ul>
                )}
            </div>

            <div className="flex flex-col gap-2.5 rounded-xl border border-[#E5E5E5] bg-white p-4">
                <h2 className="text-sm font-semibold text-[#0A0A0A]">Items del plan ({items.length})</h2>
                {items.length === 0 && <p className="text-sm text-[#666666]">Todavía no hay items. Buscá arriba o agregá uno custom.</p>}
                {items.map((item, i) => (
                    <div key={item.key} className="flex flex-col gap-2.5 rounded-lg border border-[#E5E5E5] p-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="w-5 text-sm font-bold text-[#666666]">{i + 1}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${TYPE_BADGE[item.item_type].className}`}>
                                {TYPE_BADGE[item.item_type].label}
                            </span>
                            {item.item_type === 'custom' ? (
                                <span className="flex-1 text-sm text-[#666666]">Sin link — texto libre</span>
                            ) : (
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0A0A0A]">
                                    {item.ref_title ?? '(no encontrado)'}
                                    {item.ref_meta && <span className="font-normal text-[#666666]"> · {item.ref_meta}</span>}
                                    {item.ref_published === false && (
                                        <span className="ml-2 text-xs font-normal text-[#B45309]">No publicado — no se va a ver en el plan</span>
                                    )}
                                </span>
                            )}
                            <div className="flex gap-1">
                                <button type="button" aria-label="Subir" onClick={() => move(i, -1)} disabled={i === 0}
                                    className="h-8 w-8 rounded-md border border-[#E5E5E5] text-sm disabled:opacity-30">↑</button>
                                <button type="button" aria-label="Bajar" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                                    className="h-8 w-8 rounded-md border border-[#E5E5E5] text-sm disabled:opacity-30">↓</button>
                                <button type="button" aria-label="Quitar" onClick={() => remove(item.key)}
                                    className="h-8 w-8 rounded-md border border-[#E5E5E5] text-sm text-[#E11D2E]">×</button>
                            </div>
                        </div>
                        {item.item_type === 'custom' && (
                            <div className="grid gap-2 sm:grid-cols-2">
                                <label className="flex flex-col gap-1 text-xs font-semibold">
                                    Título *
                                    <input className={inputClass} value={item.custom_title ?? ''} placeholder="Barcelona vs Aston Villa"
                                        onChange={e => update(item.key, { custom_title: e.target.value })} />
                                </label>
                                <label className="flex flex-col gap-1 text-xs font-semibold">
                                    Subtítulo
                                    <input className={inputClass} value={item.custom_subtitle ?? ''} placeholder="2:00 PM"
                                        onChange={e => update(item.key, { custom_subtitle: e.target.value })} />
                                </label>
                            </div>
                        )}
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
                            <label className="flex flex-col gap-1 text-xs font-semibold">
                                Label
                                <input className={inputClass} value={item.label ?? ''} placeholder="DÓNDE VERLO"
                                    onChange={e => update(item.key, { label: e.target.value })} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold">
                                Nota editorial
                                <input className={inputClass} value={item.editorial_note ?? ''} placeholder="Pantallas, tacos de birria y podés llevar a tu perro"
                                    onChange={e => update(item.key, { editorial_note: e.target.value })} />
                            </label>
                            <label className="flex h-9 items-center gap-2 text-sm">
                                <input type="checkbox" checked={item.sponsored} onChange={e => update(item.key, { sponsored: e.target.checked })} />
                                Patrocinado
                            </label>
                        </div>
                    </div>
                ))}
                {items.some(i => i.item_type === 'custom') && (
                    <p className="text-xs text-[#666666]">
                        Items custom seguidos con el mismo label se muestran juntos en un solo bloque (ej. los partidos).
                    </p>
                )}
            </div>
        </div>
    );
}

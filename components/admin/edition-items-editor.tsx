'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChipInput } from './chip-input';
import { ImageCropper } from './image-cropper';
import { getBadgeStyle, getBadgeStyleStatic, saveCustomBadgeColor, dismissBadgeSuggestion, getDismissedBadges, contrastColor, BADGE_PRESETS } from '@/lib/badge-colors';

type PlaceOption = { id: string; name: string };

export type MentionType = 'highlighted' | 'mentioned' | 'drinks' | 'desserts' | 'not_recommended' | 'place_note';

export type EditionItem = {
    place_id?: string;
    place_name?: string;
    title?: string;
    mention_type: MentionType;
    badges: string[];
    editorial_text?: string;
    photo_url?: string;
    photo_orientation: 'portrait' | 'landscape';
    photo_preview?: string; // objectURL — solo client, no se serializa
};

interface Props {
    defaultValue?: EditionItem[];
    onItemsChange?: (items: EditionItem[]) => void;
}

const MENTION_LABELS: Record<MentionType, string> = {
    highlighted: 'La selección',
    mentioned: 'También vale la pena',
    place_note: 'El lugar',
    drinks: 'Bebidas',
    desserts: 'Postres',
    not_recommended: 'No recomendamos',
};

const CROP_ASPECT: Record<'portrait' | 'landscape', number> = {
    portrait: 2 / 3,   // vertical — imagen izquierda en la card
    landscape: 4 / 3,  // horizontal — imagen arriba en la card
};

type NewBadgeState = { itemIdx: number; text: string; bg: string; textColor: string };

function BadgePill({ badge }: { badge: string }) {
    const [s, setS] = useState(() => getBadgeStyleStatic(badge));
    useEffect(() => { setS(getBadgeStyle(badge)); }, [badge]);
    const base = 'inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide';
    if (s.type === 'inline') {
        return <span className={base} style={{ backgroundColor: s.bg, color: s.text }}>{badge}</span>;
    }
    return <span className={`${base} ${s.cls}`}>{badge}</span>;
}

export function EditionItemsEditor({ defaultValue = [], onItemsChange }: Props) {
    const [items, setItems] = useState<EditionItem[]>(defaultValue);
    const [places, setPlaces] = useState<PlaceOption[]>([]);
    const [cropTarget, setCropTarget] = useState<{ index: number; file: File } | null>(null);
    const [existingBadges, setExistingBadges] = useState<string[]>([]);
    const [dismissedBadges, setDismissedBadges] = useState<string[]>([]);
    const [newBadge, setNewBadge] = useState<NewBadgeState | null>(null);
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setDismissedBadges(getDismissedBadges());
        fetch('/api/places')
            .then(r => r.json())
            .then((data: PlaceOption[]) => setPlaces(data.map(p => ({ id: p.id, name: p.name }))))
            .catch(console.error);
        fetch('/api/edition-badges')
            .then(r => r.json())
            .then(setExistingBadges)
            .catch(console.error);
    }, []);

    function setAndNotify(next: EditionItem[]) {
        setItems(next);
        onItemsChange?.(next);
    }

    function update(i: number, patch: Partial<EditionItem>) {
        setAndNotify(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
    }

    function addItem() {
        setAndNotify([...items, { mention_type: 'highlighted', badges: [], photo_orientation: 'portrait' }]);
    }

    function removeItem(i: number) {
        setAndNotify(items.filter((_, idx) => idx !== i));
    }

    function moveItem(i: number, dir: -1 | 1) {
        const target = i + dir;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[i], next[target]] = [next[target], next[i]];
        setAndNotify(next);
    }

    function handleImageChange(i: number, e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setCropTarget({ index: i, file });
    }

    function handleCropConfirm(blob: Blob, previewUrl: string) {
        if (!cropTarget) return;
        const i = cropTarget.index;
        const croppedFile = new File([blob], cropTarget.file.name, { type: 'image/jpeg' });
        const dt = new DataTransfer();
        dt.items.add(croppedFile);
        const ref = fileInputRefs.current[i];
        if (ref) ref.files = dt.files;
        update(i, { photo_preview: previewUrl });
        setCropTarget(null);
    }

    function removeItemPhoto(i: number) {
        update(i, { photo_url: undefined, photo_preview: undefined });
        const ref = fileInputRefs.current[i];
        if (ref) ref.value = '';
    }

    // photo_preview y place_name son solo client — no van al servidor
    const itemsForSubmit = items.map(({ place_name, photo_preview, ...rest }) => {
        void place_name;
        void photo_preview;
        return rest;
    });

    return (
        <div>
            {cropTarget && (
                <ImageCropper
                    file={cropTarget.file}
                    aspect={CROP_ASPECT[items[cropTarget.index]?.photo_orientation ?? 'portrait']}
                    onCrop={handleCropConfirm}
                    onCancel={() => setCropTarget(null)}
                />
            )}

            <input type="hidden" name="items" value={JSON.stringify(itemsForSubmit)} />
            <div className="space-y-4">
                {items.map((item, i) => (
                    <div key={i} className="rounded-lg border border-[#E5E5E5] p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#0A0A0A]">Item {i + 1}</span>
                            <div className="flex gap-1">
                                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0}
                                    className="px-2 text-sm text-[#666666] disabled:opacity-30">↑</button>
                                <button type="button" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                                    className="px-2 text-sm text-[#666666] disabled:opacity-30">↓</button>
                                <button type="button" onClick={() => removeItem(i)}
                                    className="px-2 text-sm text-[#E11D2E]">Quitar</button>
                            </div>
                        </div>

                        <div className="mb-3 grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs text-[#666666]">Lugar (opcional)</label>
                                <Input
                                    list={`places-${i}`}
                                    placeholder="Buscar por nombre…"
                                    defaultValue={item.place_name ?? ''}
                                    onChange={e => {
                                        const match = places.find(p => p.name === e.target.value);
                                        update(i, { place_id: match?.id, place_name: e.target.value });
                                    }}
                                />
                                <datalist id={`places-${i}`}>
                                    {places.map(p => <option key={p.id} value={p.name} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-[#666666]">Título (si no usás el del lugar)</label>
                                <Input value={item.title ?? ''} onChange={e => update(i, { title: e.target.value })} />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="mb-1 block text-xs text-[#666666]">Sección</label>
                            <select
                                value={item.mention_type}
                                onChange={e => update(i, { mention_type: e.target.value as MentionType })}
                                className="h-10 w-full rounded-md border border-[#E5E5E5] px-3 text-sm"
                            >
                                {Object.entries(MENTION_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="mb-1 block text-xs text-[#666666]">Orientación de foto</label>
                            <div className="flex gap-2">
                                {(['portrait', 'landscape'] as const).map(o => (
                                    <button
                                        key={o}
                                        type="button"
                                        onClick={() => update(i, { photo_orientation: o })}
                                        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                            item.photo_orientation === o
                                                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                                                : 'border-[#E5E5E5] text-[#666666] hover:border-[#0A0A0A]'
                                        }`}
                                    >
                                        <span className={o === 'portrait' ? 'text-base leading-none' : 'text-base leading-none rotate-90 inline-block'}>▯</span>
                                        {o === 'portrait' ? 'Vertical (2:3)' : 'Horizontal (4:3)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="mb-1 block text-xs text-[#666666]">Foto</label>
                            {(item.photo_preview || item.photo_url) && (
                                <div
                                    className={`relative mb-2 overflow-hidden rounded-md bg-[#F5F4F0] ${
                                        item.photo_orientation === 'landscape' ? 'h-24 w-32' : 'h-28 w-[75px]'
                                    }`}
                                >
                                    <Image src={item.photo_preview ?? item.photo_url!} alt="" fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeItemPhoto(i)}
                                        className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <input
                                ref={el => { fileInputRefs.current[i] = el; }}
                                type="file"
                                name={`item_image_${i}`}
                                accept="image/*"
                                onChange={e => handleImageChange(i, e)}
                                className="text-sm text-[#666666] file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-[#E5E5E5] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#0A0A0A] file:transition-colors hover:file:border-[#0A0A0A]"
                            />
                            <p className="mt-1 text-[10px] text-[#666666] opacity-70">
                                Al subir la foto se abre el recortador con proporción {item.photo_orientation === 'landscape' ? '4:3' : '2:3'}
                            </p>
                        </div>

                        <div className="mb-3">
                            <label className="mb-1 block text-xs text-[#666666]">Badges</label>
                            <ChipInput
                                value={item.badges}
                                onChange={badges => update(i, { badges })}
                                placeholder="Escribí y Enter para añadir…"
                                renderChip={(chip, onRemove) => (
                                    <span className="inline-flex items-center gap-0.5">
                                        <BadgePill badge={chip} />
                                        <button
                                            type="button"
                                            onClick={onRemove}
                                            className="text-[10px] text-[#999] hover:text-[#E11D2E] leading-none"
                                            title="Quitar"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            />

                            {/* Sugerencias del histórico */}
                            {existingBadges.filter(b => !item.badges.includes(b) && !dismissedBadges.includes(b)).length > 0 && (
                                <div className="mt-2">
                                    <p className="mb-1.5 text-[10px] text-[#999]">Usados antes — click para añadir</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {existingBadges
                                            .filter(b => !item.badges.includes(b) && !dismissedBadges.includes(b))
                                            .map(b => (
                                                <span key={b} className="inline-flex items-center gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => update(i, { badges: [...item.badges, b] })}
                                                        className="opacity-60 hover:opacity-100 transition-opacity"
                                                    >
                                                        <BadgePill badge={b} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Ocultar de sugerencias"
                                                        onClick={() => {
                                                            dismissBadgeSuggestion(b);
                                                            setDismissedBadges(d => [...d, b]);
                                                        }}
                                                        className="text-[10px] text-[#CCC] hover:text-[#E11D2E] leading-none"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Creador de badge con color libre */}
                            {newBadge?.itemIdx === i ? (
                                <div className="mt-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3 space-y-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#666]">Nuevo badge</p>

                                    <Input
                                        value={newBadge.text}
                                        onChange={e => setNewBadge({ ...newBadge, text: e.target.value.toUpperCase() })}
                                        placeholder="Nombre del badge…"
                                        className="text-sm"
                                        autoFocus
                                    />

                                    {/* Presets rápidos */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {BADGE_PRESETS.map(opt => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                title={opt.label}
                                                onClick={() => setNewBadge({ ...newBadge, bg: opt.bg, textColor: contrastColor(opt.bg) })}
                                                style={{ backgroundColor: opt.bg, color: contrastColor(opt.bg) }}
                                                className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                                                    newBadge.bg === opt.bg ? 'ring-2 ring-offset-1 ring-[#0A0A0A] scale-105' : 'opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                {newBadge.text || opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Pickers de color */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="mb-1 text-[10px] text-[#999]">Fondo</p>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="color"
                                                    value={newBadge.bg.length === 7 ? newBadge.bg : '#F1EFE8'}
                                                    onChange={e => setNewBadge({ ...newBadge, bg: e.target.value, textColor: contrastColor(e.target.value) })}
                                                    className="h-7 w-8 cursor-pointer rounded border border-[#E5E5E5] p-0.5"
                                                />
                                                <input
                                                    type="text"
                                                    value={newBadge.bg}
                                                    onChange={e => {
                                                        const v = e.target.value;
                                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                                                            setNewBadge({ ...newBadge, bg: v, textColor: v.length === 7 ? contrastColor(v) : newBadge.textColor });
                                                        }
                                                    }}
                                                    className="w-full rounded border border-[#E5E5E5] px-2 py-1 font-mono text-xs"
                                                    placeholder="#F1EFE8"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] text-[#999]">Texto</p>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="color"
                                                    value={newBadge.textColor.length === 7 ? newBadge.textColor : '#0A0A0A'}
                                                    onChange={e => setNewBadge({ ...newBadge, textColor: e.target.value })}
                                                    className="h-7 w-8 cursor-pointer rounded border border-[#E5E5E5] p-0.5"
                                                />
                                                <input
                                                    type="text"
                                                    value={newBadge.textColor}
                                                    onChange={e => {
                                                        const v = e.target.value;
                                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setNewBadge({ ...newBadge, textColor: v });
                                                    }}
                                                    className="w-full rounded border border-[#E5E5E5] px-2 py-1 font-mono text-xs"
                                                    placeholder="#0A0A0A"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vista previa live */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[#999]">Preview:</span>
                                        <span
                                            style={{
                                                backgroundColor: newBadge.bg.length === 7 ? newBadge.bg : '#F1EFE8',
                                                color: newBadge.textColor.length === 7 ? newBadge.textColor : '#5F5E5A',
                                            }}
                                            className="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                                        >
                                            {newBadge.text || 'BADGE'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={!newBadge.text.trim() || newBadge.bg.length !== 7}
                                            onClick={() => {
                                                const text = newBadge.text.trim();
                                                const colorVal = {
                                                    bg: newBadge.bg,
                                                    text: newBadge.textColor.length === 7 ? newBadge.textColor : contrastColor(newBadge.bg),
                                                };
                                                saveCustomBadgeColor(text, colorVal);
                                                update(i, { badges: [...item.badges, text] });
                                                setExistingBadges(prev => prev.includes(text) ? prev : [...prev, text]);
                                                setNewBadge(null);
                                            }}
                                            className="rounded-md bg-[#0A0A0A] px-3 py-1.5 text-xs text-white disabled:opacity-40"
                                        >
                                            Agregar badge
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewBadge(null)}
                                            className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs text-[#666]"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setNewBadge({ itemIdx: i, text: '', bg: '#F1EFE8', textColor: '#5F5E5A' })}
                                    className="mt-2 text-[11px] text-[#999] underline hover:text-[#0A0A0A] transition-colors"
                                >
                                    + Crear badge con color
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-[#666666]">Texto editorial (opcional)</label>
                            <Textarea
                                value={item.editorial_text ?? ''}
                                onChange={e => update(i, { editorial_text: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addItem}
                className="mt-3 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#0A0A0A] hover:bg-[#FAFAFA]"
            >
                + Agregar item
            </button>
        </div>
    );
}

'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TagPicker } from './tag-picker';
import { ImageCropper } from './image-cropper';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { EventPreview } from './event-preview';
import type { DbEvent } from '@/lib/types';

type PlaceOption = { id: string; name: string };

interface Props {
    mode: 'create' | 'edit';
    event?: DbEvent;
    initialPlaceName?: string;
    action: (formData: FormData) => void | Promise<void>;
}

function toDatetimeLocal(iso: string): string {
    return iso.slice(0, 16);
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
    const { pending } = useFormStatus();
    const label = mode === 'create' ? 'Crear evento' : 'Guardar cambios';
    return (
        <Button type="submit" disabled={pending} className="normal-case tracking-normal">
            {pending ? 'Guardando…' : label}
        </Button>
    );
}

export function EventForm({ mode, event, initialPlaceName, action }: Props) {
    const [zones, setZones] = useState<string[]>([]);
    const [places, setPlaces] = useState<PlaceOption[]>([]);
    const [placeName, setPlaceName] = useState(initialPlaceName ?? '');
    const [imagePreview, setImagePreview] = useState<string | null>(event?.image_url ?? null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [cropFile, setCropFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Controlled fields for live preview
    const [title, setTitle] = useState(event?.title ?? '');
    const [category, setCategory] = useState(event?.category ?? 'Otros');
    const [zone, setZone] = useState(event?.zone ?? '');
    const [dateStart, setDateStart] = useState(event ? toDatetimeLocal(event.date_start) : '');
    const [price, setPrice] = useState(event?.price != null ? String(event.price) : '');
    const [isFree, setIsFree] = useState(event?.is_free ?? false);
    const [venueName, setVenueName] = useState(event?.venue_name ?? '');

    useEffect(() => {
        fetch('/api/zones')
            .then(r => r.json())
            .then((data: { zone: string }[]) => setZones(data.map(d => d.zone)))
            .catch(console.error);
        fetch('/api/places')
            .then(r => r.json())
            .then((data: PlaceOption[]) => setPlaces(data.map(p => ({ id: p.id, name: p.name }))))
            .catch(console.error);
    }, []);

    const matchedPlace = places.find(p => p.name === placeName);

    function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setCropFile(file);
        // reset input so selecting the same file again still triggers onChange
        e.target.value = '';
    }

    function handleCropDone(blob: Blob, previewUrl: string) {
        setImagePreview(previewUrl);
        setImageRemoved(false);
        setCropFile(null);
        // inject cropped file into the hidden input for FormData submission
        if (fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(new File([blob], 'event-image.jpg', { type: 'image/jpeg' }));
            fileInputRef.current.files = dt.files;
        }
    }

    function handleRemoveImage() {
        setImagePreview(null);
        setImageRemoved(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const previewData = { title, category, zone, date_start: dateStart, price, isFree, imageUrl: imagePreview, venue_name: venueName };

    return (
        <div className="flex gap-8 items-start">
        <form action={action} className="w-full max-w-xl space-y-5">
            <div>
                <label className="mb-1 block text-sm text-[#666666]">Título</label>
                <Input name="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Slug (opcional, se genera automático)</label>
                <Input name="slug" defaultValue={event?.slug} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Descripción</label>
                <Textarea
                    name="description"
                    defaultValue={event?.description ?? ''}
                    rows={5}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Categoría</label>
                    <select
                        name="category"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="h-10 w-full rounded-md border border-[#E5E5E5] px-3 text-sm"
                    >
                        {EVENT_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Zona</label>
                    <Input name="zone" list="zone-options" value={zone} onChange={e => setZone(e.target.value)} required />
                    <datalist id="zone-options">
                        {zones.map(z => <option key={z} value={z} />)}
                    </datalist>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Lugar / venue (nombre libre)</label>
                    <Input name="venue_name" value={venueName} onChange={e => setVenueName(e.target.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">¿Es en un lugar ya catalogado?</label>
                    <Input
                        list="place-options"
                        value={placeName}
                        onChange={e => setPlaceName(e.target.value)}
                        placeholder="Buscar por nombre…"
                    />
                    <datalist id="place-options">
                        {places.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                    <input type="hidden" name="place_id" value={matchedPlace?.id ?? ''} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Fecha y hora de inicio</label>
                    <Input
                        type="datetime-local"
                        name="date_start"
                        value={dateStart}
                        onChange={e => setDateStart(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Hora de fin (opcional)</label>
                    <Input
                        type="datetime-local"
                        name="date_end"
                        defaultValue={event?.date_end ? toDatetimeLocal(event.date_end) : ''}
                    />
                </div>
            </div>

            <div>
                <label className="mb-1 flex items-center gap-2 text-sm text-[#666666]">
                    <input
                        type="checkbox"
                        name="is_free"
                        checked={isFree}
                        onChange={e => {
                            setIsFree(e.target.checked);
                            if (e.target.checked) setPrice('');
                        }}
                    />
                    Este evento es gratis
                </label>
                <label className="mb-1 mt-2 block text-sm text-[#666666]">
                    Precio {isFree ? '' : '(dejar vacío si no sabés el precio)'}
                </label>
                <Input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={price}
                    disabled={isFree}
                    onChange={e => setPrice(e.target.value)}
                />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Tags</label>
                <TagPicker name="tags" defaultValue={event?.tags ?? []} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Imagen</label>
                {imagePreview && (
                    <div className="relative mb-2 overflow-hidden rounded-md" style={{ width: 200, height: 112 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                        >
                            ×
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
                    >
                        {imagePreview ? 'Cambiar imagen…' : 'Elegir imagen…'}
                    </button>
                    {imagePreview && (
                        <span className="text-[11px] text-[#999]">La imagen se recortará en 16:9</span>
                    )}
                </div>
                {/* Hidden inputs — el file real lo inyecta handleCropDone via DataTransfer */}
                <input
                    ref={fileInputRef}
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <input type="hidden" name="remove_image" value={imageRemoved ? '1' : ''} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Link de contacto</label>
                <Input type="url" name="contact_link" defaultValue={event?.contact_link ?? ''} placeholder="https://…" />
            </div>

            <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" name="sponsored" defaultChecked={event?.sponsored} />
                    Patrocinado
                </label>

                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" name="featured" defaultChecked={event?.featured} />
                    Destacado
                </label>

                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Estado</label>
                    <select
                        name="status"
                        defaultValue={event?.status ?? 'pending'}
                        className="h-10 rounded-md border border-[#E5E5E5] px-3 text-sm"
                    >
                        <option value="pending">Borrador</option>
                        <option value="published">Publicado</option>
                    </select>
                </div>
            </div>

            <SubmitButton mode={mode} />
        </form>

        {/* Cropper modal */}
        {cropFile && (
            <ImageCropper
                file={cropFile}
                aspect={16 / 9}
                onCrop={handleCropDone}
                onCancel={() => setCropFile(null)}
            />
        )}

        {/* Preview panel */}
        <div className="hidden lg:block w-[580px] shrink-0">
            <EventPreview data={previewData} />
        </div>
        </div>
    );
}

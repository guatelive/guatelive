'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TagPicker, type TagGroup } from './tag-picker';
import { PriceTiersInput } from './price-tiers-input';
import { ActivityLocationsInput } from './activity-locations-input';
import { ActivityGalleryEditor } from './activity-gallery-editor';
import { ImageCropper } from './image-cropper';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { EVENT_TAG_GROUPS } from '@/lib/event-tags';
import { MAX_UPLOAD_BYTES } from '@/lib/compress-image';
import type { DbActivity } from '@/lib/types';

type PlaceOption = { id: string; name: string };

interface Props {
    mode: 'create' | 'edit';
    activity?: DbActivity;
    initialPlaceName?: string;
    action: (formData: FormData) => void | Promise<void>;
    tagGroups?: TagGroup[];
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
    const { pending } = useFormStatus();
    const label = mode === 'create' ? 'Crear actividad' : 'Guardar cambios';
    return (
        <Button type="submit" disabled={pending} className="normal-case tracking-normal">
            {pending ? 'Guardando…' : label}
        </Button>
    );
}

export function ActivityForm({ mode, activity, initialPlaceName, action, tagGroups = EVENT_TAG_GROUPS }: Props) {
    const [zones, setZones] = useState<string[]>([]);
    const [places, setPlaces] = useState<PlaceOption[]>([]);
    const [placeName, setPlaceName] = useState(initialPlaceName ?? '');
    const [imagePreview, setImagePreview] = useState<string | null>(activity?.image_url ?? null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState(activity?.title ?? '');
    const [category, setCategory] = useState(activity?.category ?? 'Otros');
    const [zone, setZone] = useState(activity?.zone ?? '');
    const [price, setPrice] = useState(activity?.price != null ? String(activity.price) : '');
    const [isFree, setIsFree] = useState(activity?.is_free ?? false);
    const [venueName, setVenueName] = useState(activity?.venue_name ?? '');

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
            dt.items.add(new File([blob], 'activity-image.jpg', { type: 'image/jpeg' }));
            fileInputRef.current.files = dt.files;
        }
    }

    function handleRemoveImage() {
        setImagePreview(null);
        setImageRemoved(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // Aun comprimidas, muchas fotos nuevas juntas pueden pasarse del límite de Vercel.
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        let totalBytes = 0;
        new FormData(e.currentTarget).forEach(value => {
            if (value instanceof File) totalBytes += value.size;
        });
        if (totalBytes > MAX_UPLOAD_BYTES) {
            e.preventDefault();
            setUploadError('Son demasiadas fotos nuevas para un solo guardado. Quitá algunas, guardá y agregalas después.');
            return;
        }
        setUploadError(null);
    }

    return (
        <form action={action} onSubmit={handleSubmit} className="w-full max-w-xl space-y-5">
            <div>
                <label className="mb-1 block text-sm text-[#666666]">Título</label>
                <Input name="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Slug (opcional, se genera automático)</label>
                <Input name="slug" defaultValue={activity?.slug} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Descripción</label>
                <Textarea
                    name="description"
                    defaultValue={activity?.description ?? ''}
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

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Otras categorías (opcional)</label>
                <p className="mb-2 text-xs text-[#999999]">
                    La actividad también aparece al filtrar por estas. La categoría de arriba es la
                    principal: define el color y el badge de la card.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {EVENT_CATEGORIES.filter(c => c !== category).map(c => (
                        <label key={c} className="flex items-center gap-1.5 text-sm text-[#0A0A0A]">
                            <input
                                type="checkbox"
                                name="extra_categories"
                                value={c}
                                defaultChecked={activity?.extra_categories?.includes(c)}
                            />
                            {c}
                        </label>
                    ))}
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

            <p className="-mt-3 text-xs text-[#999999]">
                Los botones de Google Maps y Waze van a las coordenadas del lugar catalogado. Si no
                hay, buscan el nombre libre: que sea un solo lugar, fácil de encontrar en el mapa.
            </p>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">¿Cuándo se puede hacer?</label>
                <Input
                    name="recurrence_text"
                    defaultValue={activity?.recurrence_text ?? ''}
                    placeholder="Ej. Todos los sábados 8am, Abierto todos los días 9am–5pm"
                    required
                />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Otras sedes (opcional)</label>
                <p className="mb-2 text-xs text-[#999999]">
                    Si la actividad se puede hacer en más de un lugar, la zona, el lugar y el
                    horario de arriba son la sede principal — agregá acá las demás, cada una con
                    su propio horario.
                </p>
                <ActivityLocationsInput
                    name="extra_locations"
                    zoneListId="zone-options"
                    defaultValue={activity?.extra_locations}
                />
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
                    Esta actividad es gratis
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
                <label className="mb-1 block text-sm text-[#666666]">
                    Precios múltiples (opcional)
                </label>
                <p className="mb-2 text-xs text-[#999999]">
                    Si la actividad cobra distinto según tipo de entrada (ej. Nacional/Extranjero,
                    Adulto/Niño), agregalos acá — reemplazan al precio de arriba en las cards y el
                    detalle.
                </p>
                <PriceTiersInput name="price_tiers" defaultValue={activity?.price_tiers} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">
                    Otros precios (opcional)
                </label>
                <p className="mb-2 text-xs text-[#999999]">
                    Lo que se paga aparte de la entrada (ej. boletos para juegos, parqueo, alquiler
                    de equipo). Se lista en el detalle y no cuenta para el &quot;Desde&quot; de las cards.
                </p>
                <PriceTiersInput
                    name="extra_prices"
                    defaultValue={activity?.extra_prices}
                    placeholder="Nombre (ej. Pasaporte de 12 juegos)"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Tags</label>
                <TagPicker name="tags" groups={tagGroups} defaultValue={activity?.tags ?? []} />
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
                <label className="mb-1 block text-sm text-[#666666]">Galería (opcional)</label>
                <p className="mb-2 text-xs text-[#999999]">
                    Fotos adicionales para el carrusel de la página de detalle — no reemplazan
                    la imagen de portada de arriba, se suman a ella.
                </p>
                <ActivityGalleryEditor defaultValue={activity?.photo_urls ?? []} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Crédito de la foto (opcional)</label>
                <Input name="image_credit" defaultValue={activity?.image_credit ?? ''} maxLength={120} placeholder="Ej. eticket.gt, Instagram @organizador" />
                <p className="mt-1 text-xs text-[#999999]">Se muestra debajo de las fotos (portada y galería) en la página de la actividad. Vacío = no se muestra crédito.</p>
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Link de contacto</label>
                <Input type="url" name="contact_link" defaultValue={activity?.contact_link ?? ''} placeholder="https://…" />
            </div>

            <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" name="sponsored" defaultChecked={activity?.sponsored} />
                    Patrocinado
                </label>

                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" name="featured" defaultChecked={activity?.featured} />
                    Destacado
                </label>

                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Estado</label>
                    <select
                        name="status"
                        defaultValue={activity?.status ?? 'pending'}
                        className="h-10 rounded-md border border-[#E5E5E5] px-3 text-sm"
                    >
                        <option value="pending">Borrador</option>
                        <option value="published">Publicado</option>
                    </select>
                </div>
            </div>

            {uploadError && <p className="text-sm text-[#E11D2E]">{uploadError}</p>}

            <SubmitButton mode={mode} />

            {/* Cropper modal */}
            {cropFile && (
                <ImageCropper
                    file={cropFile}
                    aspect={16 / 9}
                    onCrop={handleCropDone}
                    onCancel={() => setCropFile(null)}
                />
            )}
        </form>
    );
}

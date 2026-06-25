'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TagPicker } from './tag-picker';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
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

    function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setImagePreview(URL.createObjectURL(file));
    }

    return (
        <form action={action} className="max-w-2xl space-y-5">
            <div>
                <label className="mb-1 block text-sm text-[#666666]">Título</label>
                <Input name="title" defaultValue={event?.title} required />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Slug (opcional, se genera automático)</label>
                <Input name="slug" defaultValue={event?.slug} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Descripción</label>
                <textarea
                    name="description"
                    defaultValue={event?.description ?? ''}
                    rows={3}
                    className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm outline-none focus:border-[#0A0A0A]"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Categoría</label>
                    <select
                        name="category"
                        defaultValue={event?.category ?? 'Otros'}
                        className="h-10 w-full rounded-md border border-[#E5E5E5] px-3 text-sm"
                    >
                        {EVENT_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Zona</label>
                    <Input name="zone" list="zone-options" defaultValue={event?.zone} required />
                    <datalist id="zone-options">
                        {zones.map(z => <option key={z} value={z} />)}
                    </datalist>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm text-[#666666]">Lugar / venue (nombre libre)</label>
                    <Input name="venue_name" defaultValue={event?.venue_name ?? ''} />
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
                        defaultValue={event ? toDatetimeLocal(event.date_start) : ''}
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
                <label className="mb-1 block text-sm text-[#666666]">Precio (vacío = gratis)</label>
                <Input type="number" name="price" min="0" step="0.01" defaultValue={event?.price ?? ''} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Tags</label>
                <TagPicker name="tags" defaultValue={event?.tags ?? []} />
            </div>

            <div>
                <label className="mb-1 block text-sm text-[#666666]">Imagen</label>
                {imagePreview && (
                    <div className="relative mb-2 h-32 w-48 overflow-hidden rounded-md">
                        <Image src={imagePreview} alt="" fill className="object-cover" />
                    </div>
                )}
                <input type="file" name="image" accept="image/*" onChange={handleImageChange} className="text-sm" />
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
    );
}

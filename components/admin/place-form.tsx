'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TagPicker } from './tag-picker';
import { PlacePhotosEditor } from './place-photos-editor';
import { PLACE_TAG_GROUPS } from '@/lib/place-tags';
import type { Place, PlacePhoto } from '@/lib/types';

interface Props {
    mode: 'create' | 'edit';
    place?: Place;
    photos?: PlacePhoto[];
    action: (formData: FormData) => void | Promise<void>;
}

const ZONE_OPTIONS = [
    'Zona 1', 'Zona 4', 'Zona 10', 'Zona 14', 'Zona 15',
    'Cayalá', 'Carretera al Salvador', 'Antigua Guatemala',
];

const DAY_KEYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DAY_LABELS: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miércoles: 'Miércoles', jueves: 'Jueves',
    viernes: 'Viernes', sábado: 'Sábado', domingo: 'Domingo',
};

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
    const { pending } = useFormStatus();
    const label = mode === 'create' ? 'Crear lugar' : 'Guardar cambios';
    return (
        <Button type="submit" disabled={pending} className="normal-case tracking-normal">
            {pending ? 'Guardando…' : label}
        </Button>
    );
}

function GoogleSyncNote({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
        <p className="mt-1 text-[11px] text-[#999]">
            Se sincroniza automático con Google — tu cambio puede sobreescribirse en el próximo refresh.
        </p>
    );
}

export function PlaceForm({ mode, place, photos, action }: Props) {
    const isKnownZone = !place?.zone || ZONE_OPTIONS.includes(place.zone);
    const [zoneChoice, setZoneChoice] = useState(isKnownZone ? (place?.zone ?? ZONE_OPTIONS[0]) : 'Otra');
    const [customZone, setCustomZone] = useState(isKnownZone ? '' : (place?.zone ?? ''));
    const [name, setName] = useState(place?.name ?? '');
    const [hours, setHours] = useState<Record<string, string>>(place?.hours ?? {});

    const syncsWithGoogle = !!place?.google_place_id;

    function updateHour(day: string, value: string) {
        setHours(prev => {
            const next = { ...prev };
            if (value.trim() === '') delete next[day];
            else next[day] = value;
            return next;
        });
    }

    return (
        <form action={action} className="max-w-3xl space-y-8">
            {/* Identidad */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#666666]">Identidad</h2>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Nombre</label>
                        <Input name="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Slug (opcional, se genera automático)</label>
                        <Input name="slug" defaultValue={place?.slug} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Zona</label>
                            <select
                                value={zoneChoice}
                                onChange={e => setZoneChoice(e.target.value)}
                                className="h-10 w-full rounded-md border border-[#E5E5E5] px-3 text-sm"
                            >
                                {ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                                <option value="Otra">Otra…</option>
                            </select>
                            {zoneChoice === 'Otra' && (
                                <Input
                                    className="mt-2"
                                    value={customZone}
                                    onChange={e => setCustomZone(e.target.value)}
                                    placeholder="Escribí la zona"
                                />
                            )}
                            <input type="hidden" name="zone" value={zoneChoice === 'Otra' ? customZone : zoneChoice} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Ciudad</label>
                            <Input name="city" defaultValue={place?.city ?? 'Ciudad de Guatemala'} />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Dirección</label>
                        <Input name="address" defaultValue={place?.address ?? ''} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Categoría principal</label>
                            <Input name="primary_category" defaultValue={place?.primary_category ?? ''} placeholder="Restaurante, Café, Bar…" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Categoría secundaria</label>
                            <Input name="category" defaultValue={place?.category ?? ''} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Contenido editorial */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#666666]">Contenido editorial</h2>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Descripción</label>
                        <Textarea name="description" defaultValue={place?.description ?? ''} rows={4} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Tags</label>
                        <TagPicker name="tags" groups={PLACE_TAG_GROUPS} defaultValue={place?.tags ?? []} />
                    </div>
                </div>
            </section>

            {/* Fotos */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#666666]">Fotos</h2>
                <PlacePhotosEditor defaultValue={photos ?? []} />
            </section>

            {/* Contacto y sincronización con Google */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#666666]">
                    Contacto y datos de Google
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Teléfono</label>
                            <Input name="phone" defaultValue={place?.phone ?? ''} />
                            <GoogleSyncNote visible={syncsWithGoogle} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">WhatsApp</label>
                            <Input name="whatsapp" defaultValue={place?.whatsapp ?? ''} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Website</label>
                            <Input type="url" name="website" defaultValue={place?.website ?? ''} placeholder="https://…" />
                            <GoogleSyncNote visible={syncsWithGoogle} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Link de Google Maps</label>
                            <Input type="url" name="google_maps_url" defaultValue={place?.google_maps_url ?? ''} placeholder="https://…" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Rating (1-5)</label>
                            <Input type="number" name="rating" min="0" max="5" step="0.1" defaultValue={place?.rating ?? ''} />
                            <GoogleSyncNote visible={syncsWithGoogle} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Cantidad de reseñas</label>
                            <Input type="number" name="rating_count" min="0" step="1" defaultValue={place?.rating_count ?? ''} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Rango de precio</label>
                            <select name="price_range" defaultValue={place?.price_range ?? ''} className="h-10 w-full rounded-md border border-[#E5E5E5] px-3 text-sm">
                                <option value="">Sin definir</option>
                                <option value="$">$</option>
                                <option value="$$">$$</option>
                                <option value="$$$">$$$</option>
                                <option value="$$$$">$$$$</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Horario</label>
                        <GoogleSyncNote visible={syncsWithGoogle} />
                        <input type="hidden" name="hours" value={JSON.stringify(hours)} />
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {DAY_KEYS.map(day => (
                                <div key={day} className="flex items-center gap-2">
                                    <span className="w-20 shrink-0 text-xs text-[#666666]">{DAY_LABELS[day]}</span>
                                    <Input
                                        value={hours[day] ?? ''}
                                        onChange={e => updateHour(day, e.target.value)}
                                        placeholder="8:00 AM – 10:00 PM / Cerrado"
                                        className="text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Coordenadas */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#666666]">Coordenadas (opcional)</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Latitud</label>
                        <Input type="number" step="any" name="latitude" defaultValue={place?.latitude ?? ''} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#666666]">Longitud</label>
                        <Input type="number" step="any" name="longitude" defaultValue={place?.longitude ?? ''} />
                    </div>
                </div>
            </section>

            {/* Publicación */}
            <section className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" name="is_published" defaultChecked={place?.is_published ?? false} />
                    Publicado
                </label>
                <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
                    <input type="checkbox" name="is_featured" defaultChecked={place?.is_featured ?? false} />
                    Destacado
                </label>
            </section>

            <SubmitButton mode={mode} />
        </form>
    );
}

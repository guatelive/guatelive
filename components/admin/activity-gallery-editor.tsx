'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';

type PhotoItem = {
    url?: string;      // foto existente
    preview?: string;  // objectURL — solo client, no se serializa
};

interface Props {
    defaultValue?: string[];
}

// Editor de fotos extra para el carrusel de `/actividad/[slug]` — a diferencia de
// PlacePhotosEditor no maneja `is_primary`: la portada la resuelve el campo "Imagen"
// del form, esto es solo la galería adicional.
export function ActivityGalleryEditor({ defaultValue = [] }: Props) {
    const [photos, setPhotos] = useState<PhotoItem[]>(defaultValue.map(url => ({ url })));

    function addSlot() {
        setPhotos(prev => [...prev, {}]);
    }

    function removeSlot(i: number) {
        setPhotos(prev => prev.filter((_, idx) => idx !== i));
    }

    function moveSlot(i: number, dir: -1 | 1) {
        setPhotos(prev => {
            const target = i + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[i], next[target]] = [next[target], next[i]];
            return next;
        });
    }

    function handleFileSelect(i: number, e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPhotos(prev => prev.map((p, idx) => (idx === i ? { ...p, preview } : p)));
    }

    // preview es solo client — no va al servidor. `url: null` le dice a la Server
    // Action "este slot trae un archivo nuevo, buscalo en activity_gallery_{i}".
    const metaForSubmit = photos.map(p => ({ url: p.url ?? null }));

    return (
        <div>
            <input type="hidden" name="photo_urls_meta" value={JSON.stringify(metaForSubmit)} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo, i) => (
                    <div key={i} className="rounded-lg border border-[#E5E5E5] p-2">
                        <div className="relative mb-2 h-28 w-full overflow-hidden rounded-md bg-[#F5F4F0]">
                            {photo.preview || photo.url ? (
                                <Image src={photo.preview ?? photo.url!} alt="" fill className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-[#999]">Sin foto</div>
                            )}
                        </div>
                        <input
                            type="file"
                            name={`activity_gallery_${i}`}
                            accept="image/*"
                            onChange={e => handleFileSelect(i, e)}
                            className="mb-2 w-full text-xs text-[#666666] file:mr-2 file:cursor-pointer file:rounded file:border file:border-[#E5E5E5] file:bg-white file:px-2 file:py-1 file:text-[11px] file:font-medium file:text-[#0A0A0A] hover:file:border-[#0A0A0A]"
                        />
                        <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => moveSlot(i, -1)} disabled={i === 0}
                                className="px-1 text-xs text-[#666666] disabled:opacity-30">↑</button>
                            <button type="button" onClick={() => moveSlot(i, 1)} disabled={i === photos.length - 1}
                                className="px-1 text-xs text-[#666666] disabled:opacity-30">↓</button>
                            <button type="button" onClick={() => removeSlot(i)}
                                className="px-1 text-xs text-[#E11D2E]">×</button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addSlot}
                className="mt-3 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#0A0A0A] hover:bg-[#FAFAFA]"
            >
                + Agregar foto
            </button>
        </div>
    );
}

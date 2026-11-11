'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { compressImage } from '@/lib/compress-image';

type PhotoItem = {
    id: number;        // key estable — ver nota en el render
    url?: string;      // foto existente
    preview?: string;  // objectURL — solo client, no se serializa
    error?: string;    // la foto elegida no se pudo leer
};

interface Props {
    defaultValue?: string[];
}

// Editor de fotos extra para el carrusel de `/actividad/[slug]` — a diferencia de
// PlacePhotosEditor no maneja `is_primary`: la portada la resuelve el campo "Imagen"
// del form, esto es solo la galería adicional.
let nextPhotoId = 0;

export function ActivityGalleryEditor({ defaultValue = [] }: Props) {
    const [photos, setPhotos] = useState<PhotoItem[]>(() => defaultValue.map(url => ({ id: nextPhotoId++, url })));

    function addSlot() {
        setPhotos(prev => [...prev, { id: nextPhotoId++ }]);
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

    // Por id, no por índice: el slot se puede mover mientras se comprime. Una foto de celular
    // sin comprimir tumba el guardado (ver MAX_UPLOAD_BYTES), así que el archivo del input se
    // reemplaza por la versión chica, igual que handleCropDone con la portada.
    async function handleFileSelect(id: number, e: ChangeEvent<HTMLInputElement>) {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            const dt = new DataTransfer();
            dt.items.add(compressed);
            input.files = dt.files;
            const preview = URL.createObjectURL(compressed);
            setPhotos(prev => prev.map(p => (p.id === id ? { ...p, preview, error: undefined } : p)));
        } catch {
            input.value = '';
            const error = 'No se pudo leer esta foto. Probá con JPG o PNG.';
            setPhotos(prev => prev.map(p => (p.id === id ? { ...p, preview: undefined, error } : p)));
        }
    }

    // preview es solo client — no va al servidor. `url: null` le dice a la Server
    // Action "este slot trae un archivo nuevo, buscalo en activity_gallery_{i}".
    const metaForSubmit = photos.map(p => ({ url: p.url ?? null }));

    return (
        <div>
            <input type="hidden" name="photo_urls_meta" value={JSON.stringify(metaForSubmit)} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* key por id, no por índice: el <input type="file"> no es controlado, así
                    que con key={i} quitar/mover un slot dejaba el archivo elegido en el nodo
                    equivocado (o lo descartaba) y la foto nueva nunca llegaba al servidor. */}
                {photos.map((photo, i) => (
                    <div key={photo.id} className="rounded-lg border border-[#E5E5E5] p-2">
                        <div className="relative mb-2 h-28 w-full overflow-hidden rounded-md bg-[#F5F4F0]">
                            {photo.preview || photo.url ? (
                                <Image src={photo.preview ?? photo.url!} alt="" fill unoptimized className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-[#999]">Sin foto</div>
                            )}
                        </div>
                        <input
                            type="file"
                            name={`activity_gallery_${i}`}
                            accept="image/*"
                            onChange={e => handleFileSelect(photo.id, e)}
                            className="mb-2 w-full text-xs text-[#666666] file:mr-2 file:cursor-pointer file:rounded file:border file:border-[#E5E5E5] file:bg-white file:px-2 file:py-1 file:text-[11px] file:font-medium file:text-[#0A0A0A] hover:file:border-[#0A0A0A]"
                        />
                        {photo.error && <p className="mb-2 text-[11px] text-[#E11D2E]">{photo.error}</p>}
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

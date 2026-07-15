'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import type { PlacePhoto } from '@/lib/types';

type PhotoItem = {
    url?: string;
    preview?: string; // objectURL — solo client, no se serializa
    is_primary: boolean;
};

interface Props {
    defaultValue?: PlacePhoto[];
}

export function PlacePhotosEditor({ defaultValue = [] }: Props) {
    const [photos, setPhotos] = useState<PhotoItem[]>(
        [...defaultValue]
            .sort((a, b) => a.order_index - b.order_index)
            .map(p => ({ url: p.url, is_primary: p.is_primary }))
    );

    function addPhoto() {
        setPhotos(prev => [...prev, { is_primary: prev.length === 0 }]);
    }

    function removePhoto(i: number) {
        setPhotos(prev => {
            const next = prev.filter((_, idx) => idx !== i);
            if (!next.some(p => p.is_primary) && next.length > 0) {
                next[0] = { ...next[0], is_primary: true };
            }
            return next;
        });
    }

    function movePhoto(i: number, dir: -1 | 1) {
        setPhotos(prev => {
            const target = i + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[i], next[target]] = [next[target], next[i]];
            return next;
        });
    }

    function setPrimary(i: number) {
        setPhotos(prev => prev.map((p, idx) => ({ ...p, is_primary: idx === i })));
    }

    function handleFileSelect(i: number, e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPhotos(prev => prev.map((p, idx) => (idx === i ? { ...p, preview } : p)));
    }

    // preview es solo client — no va al servidor
    const photosForSubmit = photos.map(({ url, is_primary }) => ({ url, is_primary }));

    return (
        <div>
            <input type="hidden" name="photos" value={JSON.stringify(photosForSubmit)} />
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
                            name={`place_photo_${i}`}
                            accept="image/*"
                            onChange={e => handleFileSelect(i, e)}
                            className="mb-2 w-full text-xs text-[#666666] file:mr-2 file:cursor-pointer file:rounded file:border file:border-[#E5E5E5] file:bg-white file:px-2 file:py-1 file:text-[11px] file:font-medium file:text-[#0A0A0A] hover:file:border-[#0A0A0A]"
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1 text-[11px] text-[#666666]">
                                <input type="radio" checked={photo.is_primary} onChange={() => setPrimary(i)} />
                                Principal
                            </label>
                            <div className="flex gap-1">
                                <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0}
                                    className="px-1 text-xs text-[#666666] disabled:opacity-30">↑</button>
                                <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === photos.length - 1}
                                    className="px-1 text-xs text-[#666666] disabled:opacity-30">↓</button>
                                <button type="button" onClick={() => removePhoto(i)}
                                    className="px-1 text-xs text-[#E11D2E]">×</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addPhoto}
                className="mt-3 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#0A0A0A] hover:bg-[#FAFAFA]"
            >
                + Agregar foto
            </button>
        </div>
    );
}

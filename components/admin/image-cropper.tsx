'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';

interface Props {
    file: File;
    aspect?: number;
    onCrop: (blob: Blob, previewUrl: string) => void;
    onCancel: () => void;
}

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height);
}

const MAX_OUTPUT_PX = 1800; // lado más largo del output — suficiente para web, reduce tamaño de archivo ~70%

async function getCroppedBlob(img: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const srcW = crop.width * scaleX;
    const srcH = crop.height * scaleY;

    // Escalar hacia abajo si la foto del celular supera MAX_OUTPUT_PX en cualquier dimensión
    const ratio = Math.min(1, MAX_OUTPUT_PX / Math.max(srcW, srcH));
    const outW = Math.round(srcW * ratio);
    const outH = Math.round(srcH * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
        img,
        crop.x * scaleX, crop.y * scaleY,
        srcW, srcH,
        0, 0,
        outW, outH,
    );
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas vacío')), 'image/jpeg', 0.88);
    });
}

export function ImageCropper({ file, aspect, onCrop, onCancel }: Props) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const srcUrl = useRef(URL.createObjectURL(file)).current;

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
        }
    }, [aspect]);

    async function handleConfirm() {
        if (!completedCrop || !imgRef.current) return;
        setIsProcessing(true);
        try {
            const blob = await getCroppedBlob(imgRef.current, completedCrop);
            const previewUrl = URL.createObjectURL(blob);
            onCrop(blob, previewUrl);
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-4">
                    <p className="font-serif text-base text-[#0A0A0A]">Recortar foto</p>
                    <span className="text-xs text-[#666666]">
                        {aspect ? `Relación ${aspect === 16 / 9 ? '16:9' : aspect.toFixed(2)}` : 'Recorte libre'}
                    </span>
                </div>
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 bg-[#FAFAFA]">
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={aspect}
                        minWidth={50}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={srcUrl}
                            alt="Recortar"
                            style={{ maxHeight: '60vh', maxWidth: '100%' }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                </div>
                <div className="flex justify-end gap-3 border-t border-[#E5E5E5] px-5 py-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!completedCrop || isProcessing}
                        className="normal-case tracking-normal"
                    >
                        {isProcessing ? 'Procesando…' : 'Usar este recorte'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

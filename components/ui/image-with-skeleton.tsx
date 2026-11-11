'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { isPreOptimized, smallVariant } from '@/lib/images/optimized';

// Respaldo si la imagen falla (p. ej. 402 de Vercel al agotar las Image
// Optimization Transformations del plan, o un archivo borrado de Storage).
// Se sirve como archivo estático con `unoptimized` → no gasta transformaciones.
const FALLBACK_SRC = '/placeholder-image.svg';

type Props = ImageProps & {
    /**
     * Qué versión usar si la imagen ya viene optimizada desde Storage
     * (ver lib/images/optimized.ts): 'sm' = 640px para cards, 'lg' = 1600px.
     */
    variant?: 'sm' | 'lg';
};

export function ImageWithSkeleton({ className, alt, onLoad, onError, src, unoptimized, variant = 'lg', ...props }: Props) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    const preOptimized = typeof src === 'string' && isPreOptimized(src);
    const resolvedSrc = failed
        ? FALLBACK_SRC
        : preOptimized && variant === 'sm'
            ? smallVariant(src as string)
            : src;

    return (
        <>
            {!loaded && <Skeleton className="absolute inset-0" />}
            <Image
                {...props}
                src={resolvedSrc}
                // Ya optimizada (webp + ancho fijo) o respaldo → no pasa por el optimizador de Vercel.
                unoptimized={failed || preOptimized || unoptimized}
                alt={alt}
                className={cn(className, 'transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
                onLoad={(e) => {
                    setLoaded(true);
                    onLoad?.(e);
                }}
                onError={(e) => {
                    setLoaded(true);
                    if (!failed) setFailed(true);
                    onError?.(e);
                }}
            />
        </>
    );
}

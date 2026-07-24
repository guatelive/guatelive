'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ImageWithSkeleton({ className, alt, onLoad, onError, ...props }: ImageProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <>
            {!loaded && <Skeleton className="absolute inset-0" />}
            <Image
                {...props}
                alt={alt}
                className={cn(className, 'transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
                onLoad={(e) => {
                    setLoaded(true);
                    onLoad?.(e);
                }}
                onError={(e) => {
                    setLoaded(true);
                    onError?.(e);
                }}
            />
        </>
    );
}

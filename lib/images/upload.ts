// Solo servidor (server actions del admin y scripts) — importa sharp.
import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LARGE_SUFFIX, LARGE_WIDTH, SMALL_SUFFIX, SMALL_WIDTH, WEBP_QUALITY, isPreOptimized, smallVariant } from './optimized';

const BUCKET = 'images';
const STORAGE_MARKER = `/storage/v1/object/public/${BUCKET}/`;

export type OptimizedImage = { large: Buffer; small: Buffer };

/** Convierte cualquier imagen a dos webp de ancho fijo (sin agrandar las chicas). */
export async function optimizeImage(input: Buffer | ArrayBuffer): Promise<OptimizedImage> {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    // .rotate() sin argumentos aplica la orientación EXIF (fotos de celular) antes de
    // que sharp descarte la metadata.
    const resize = (width: number) =>
        sharp(buf)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
    const [large, small] = await Promise.all([resize(LARGE_WIDTH), resize(SMALL_WIDTH)]);
    return { large, small };
}

/**
 * Sube las dos versiones a Storage y devuelve la URL pública de la grande.
 * `basePath` es la ruta sin extensión, p. ej. `events/mi-evento-1731200000000`.
 */
export async function uploadOptimizedImage(
    supabase: SupabaseClient,
    input: File | Buffer | ArrayBuffer,
    basePath: string,
): Promise<string> {
    const raw = input instanceof File ? await input.arrayBuffer() : input;
    let optimized: OptimizedImage;
    try {
        optimized = await optimizeImage(raw);
    } catch {
        throw new Error('No se pudo procesar la imagen (¿formato no soportado?)');
    }

    const largePath = `${basePath}${LARGE_SUFFIX}`;
    const smallPath = `${basePath}${SMALL_SUFFIX}`;
    const opts = { contentType: 'image/webp', cacheControl: '31536000' };

    const { error: largeError } = await supabase.storage.from(BUCKET).upload(largePath, optimized.large, opts);
    if (largeError) throw new Error(`No se pudo subir la imagen: ${largeError.message}`);
    const { error: smallError } = await supabase.storage.from(BUCKET).upload(smallPath, optimized.small, opts);
    if (smallError) {
        await supabase.storage.from(BUCKET).remove([largePath]);
        throw new Error(`No se pudo subir la imagen: ${smallError.message}`);
    }

    return supabase.storage.from(BUCKET).getPublicUrl(largePath).data.publicUrl;
}

/**
 * Rutas de Storage a borrar para una URL guardada en la DB: incluye la versión
 * chica si la imagen está pre-optimizada. Vacío si la URL no es de nuestro bucket.
 */
export function storagePathsFor(imageUrl: string): string[] {
    const toPath = (url: string) => {
        const idx = url.indexOf(STORAGE_MARKER);
        return idx === -1 ? null : url.slice(idx + STORAGE_MARKER.length).split('?')[0];
    };
    const main = toPath(imageUrl);
    if (!main) return [];
    if (!isPreOptimized(imageUrl)) return [main];
    const small = toPath(smallVariant(imageUrl));
    return small ? [main, small] : [main];
}

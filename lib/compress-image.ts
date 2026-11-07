export const MAX_OUTPUT_PX = 1800; // lado más largo del output — suficiente para web, reduce tamaño de archivo ~70%
export const JPEG_QUALITY = 0.88;

// Vercel rechaza con 413 cualquier request de más de 4.5 MB, antes de llegar a la Server
// Action (el `bodySizeLimit` de next.config.ts no lo cambia). Margen para el resto del form.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Achica una foto en el navegador antes de mandarla al servidor. Rechaza si el navegador
// no puede decodificarla (ej. HEIC en Chrome).
export async function compressImage(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, MAX_OUTPUT_PX / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext('2d')!;
    // Fondo blanco: JPEG no tiene transparencia y un PNG quedaría con fondo negro.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas vacío')), 'image/jpeg', JPEG_QUALITY);
    });
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
}

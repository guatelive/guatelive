// Convención de nombres para imágenes ya optimizadas al subirlas a Supabase Storage
// (ver lib/images/upload.ts). Este archivo no importa sharp → seguro en el cliente.
//
// Por qué: el plan Hobby de Vercel trae 5,000 Image Optimization Transformations
// al mes. Si la imagen ya está en webp y en un ancho fijo, se muestra con
// `unoptimized` y no gasta ninguna.
//
// Cada subida guarda dos archivos hermanos:
//   <base>-w1600.webp  → versión grande (heroes, galerías)
//   <base>-w640.webp   → versión chica (cards, miniaturas)
// En la DB se guarda siempre la URL de la grande.

export const LARGE_WIDTH = 1600;
export const SMALL_WIDTH = 640;
export const WEBP_QUALITY = 75;

export const LARGE_SUFFIX = `-w${LARGE_WIDTH}.webp`;
export const SMALL_SUFFIX = `-w${SMALL_WIDTH}.webp`;

export function isPreOptimized(url: string): boolean {
    // Ignora query strings (?v=…) por si alguna URL los trae.
    return url.split('?')[0].endsWith(LARGE_SUFFIX);
}

/** URL de la versión chica, o la misma URL si la imagen no está pre-optimizada. */
export function smallVariant(url: string): string {
    if (!isPreOptimized(url)) return url;
    const [path, query] = url.split('?');
    const small = path.slice(0, -LARGE_SUFFIX.length) + SMALL_SUFFIX;
    return query ? `${small}?${query}` : small;
}

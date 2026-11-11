import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, Turbopack detecta la raíz del workspace mirando el package-lock.json
  // más cercano hacia arriba en el filesystem — y encuentra uno en /Users/<user>/
  // (de otro proyecto, no relacionado) antes de llegar a este repo. Eso rompe la
  // resolución de archivos de /app/api/* (404 en todas las rutas de API en dev).
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    // Plan Hobby de Vercel: 5,000 transformaciones/mes. Cada combinación única de
    // (imagen, ancho, calidad, formato) cuenta como una transformación, y se vuelve
    // a cobrar cada vez que vence el caché. Por eso: un solo formato, una sola
    // calidad, pocos anchos y caché largo.
    formats: ["image/webp"],
    qualities: [75],
    // Anchos reales que pedimos (ver `sizes` de cada <Image>): cards ~200–400px,
    // destacados ~66vw, heroes a ancho completo. 1920 es el tope (hero a 2x).
    deviceSizes: [640, 828, 1200, 1920],
    // Solo para imágenes con `sizes` chico (polaroids de 200px, cards de 200px a 2x).
    imageSizes: [384],
    // 31 días (máximo de caché de Vercel). Las fotos de Storage no cambian en la
    // misma URL — al reemplazarlas el admin sube un archivo con nombre nuevo.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/place/photo",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
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
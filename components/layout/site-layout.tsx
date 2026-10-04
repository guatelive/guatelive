import { ReactNode } from "react";
// import { BottomNav } from "./bottom-nav";
// BottomNav comentado — las rutas /eventos /promos /dashboard no existen aún.
// Reactivar cuando estén listas y ajustar pb-20 md:pb-0 en el wrapper.

// El Footer ya no va acá: vive en app/layout.tsx para salir en todas las páginas
// públicas, no solo en las que usan SiteLayout.
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-10 md:pb-0">
      <main>{children}</main>
      {/* <BottomNav /> */}
    </div>
  );
}

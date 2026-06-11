import { ReactNode } from "react";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main>{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}

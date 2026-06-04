import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

export function SiteLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <Header />
            <main>{children}</main>
            <Footer />
            <BottomNav />
        </div>
    );
}

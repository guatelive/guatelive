import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

const nav = [
    { to: "/buscar", label: "Lugares" },
    { to: "/eventos", label: "Eventos" },
    { to: "/promos", label: "Promos" },
];

export function Header() {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-primary">
                    GuateLive
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {nav.map((n) => (
                        <Link
                            key={n.to}
                            to={n.to}
                            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                        >
                            {n.label}
                        </Link>
                    ))}
                    <Link
                        to="/login"
                        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        Iniciar sesión
                    </Link>
                </nav>

                <Link
                    to="/buscar"
                    aria-label="Buscar"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground md:hidden"
                >
                    <Search className="h-4 w-4" />
                </Link>
            </div>
        </header>
    );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, CalendarDays, Tag, User } from "lucide-react";

const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/buscar", label: "Explorar", icon: Compass },
    { to: "/eventos", label: "Eventos", icon: CalendarDays },
    { to: "/promos", label: "Promos", icon: Tag },
    { to: "/dashboard", label: "Mi cuenta", icon: User },
];

export function BottomNav() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
            <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)] pt-1">
                {items.map((it) => {
                    const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
                    const Icon = it.icon;
                    return (
                        <li key={it.to} className="flex-1">
                            <Link
                                to={it.to}
                                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                                <span>{it.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

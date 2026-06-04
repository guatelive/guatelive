import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — GuateLive" }] }),
  component: () => <AuthPage mode="login" />,
});

export function AuthPage({ mode: initialMode }: { mode: "login" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10 md:justify-center">
        <Link to="/" className="font-serif text-2xl text-primary">GuateLive</Link>

        <div className="mt-12 md:rounded-3xl md:border md:border-border md:bg-card md:p-8 md:shadow-sm">
          <h1 className="font-serif text-3xl text-foreground">
            {isLogin ? "Bienvenido de vuelta" : "Creá tu cuenta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? "Entrá para guardar lugares y reservar eventos." : "Un solo lugar para descubrir Guate."}
          </p>

          <div className="mt-8 space-y-3">
            <Field label="Email" type="email" placeholder="tu@email.com" />
            <Field label="Contraseña" type="password" placeholder="••••••••" />
            <button className="mt-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> o <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <button className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:border-primary">
              Continuar con Google
            </button>
            <button className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:border-primary">
              Enviarme un magic link
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button onClick={() => setMode(isLogin ? "signup" : "login")} className="font-medium text-primary hover:underline">
              {isLogin ? "Creá una" : "Iniciá sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder }: { label: string; type: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

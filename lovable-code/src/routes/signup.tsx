import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Crear cuenta — GuateLive" }] }),
  component: () => <AuthPage mode="signup" />,
});

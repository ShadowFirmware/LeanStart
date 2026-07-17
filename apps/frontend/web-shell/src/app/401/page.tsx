import type { Metadata } from "next";
import { Lock, LogIn } from "lucide-react";
import { ErrorScreen } from "@/components/error-screen";

// Render por request para que la ilustración sea aleatoria en cada carga.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sesión requerida · LeanStart",
};

export default function UnauthorizedPage() {
  return (
    <ErrorScreen
      code="401"
      icon={Lock}
      title="Necesitas iniciar sesión"
      description="Tu sesión expiró o no has iniciado sesión. Ingresa con tu cuenta para continuar."
      actions={[
        { label: "Iniciar sesión", href: "/login", icon: LogIn, variant: "primary" },
        { label: "Inicio", href: "/", variant: "outline" },
      ]}
    />
  );
}

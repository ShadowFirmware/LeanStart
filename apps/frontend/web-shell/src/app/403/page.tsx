import type { Metadata } from "next";
import { ShieldAlert, Home } from "lucide-react";
import { ErrorScreen } from "@/components/error-screen";

// Render por request para que la ilustración sea aleatoria en cada carga.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acceso denegado · LeanStart",
};

export default function ForbiddenPage() {
  return (
    <ErrorScreen
      code="403"
      icon={ShieldAlert}
      title="Acceso denegado"
      description="No tienes permisos para ver esta sección. Si crees que es un error, contacta al administrador de tu organización."
      accent="#EF6E6E"
      accentBg="rgba(239,110,110,0.09)"
      accentBorder="rgba(239,110,110,0.2)"
      actions={[{ label: "Volver al inicio", href: "/", icon: Home, variant: "primary" }]}
    />
  );
}

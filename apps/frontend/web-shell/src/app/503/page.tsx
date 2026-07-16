import type { Metadata } from "next";
import { Wrench, Home } from "lucide-react";
import { ErrorScreen } from "@/components/error-screen";

// Render por request para que la ilustración sea aleatoria en cada carga.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "En mantenimiento · LeanStart",
};

export default function ServiceUnavailablePage() {
  return (
    <ErrorScreen
      code="503"
      icon={Wrench}
      title="Servicio no disponible"
      description="LeanStart está temporalmente en mantenimiento para mejorar tu experiencia. Vuelve a intentarlo en unos minutos."
      actions={[{ label: "Volver al inicio", href: "/", icon: Home, variant: "primary" }]}
    />
  );
}

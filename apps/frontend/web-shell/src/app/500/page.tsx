import type { Metadata } from "next";
import { ServerCrash, Home } from "lucide-react";
import { ErrorScreen } from "@/components/error-screen";

export const metadata: Metadata = {
  title: "Error del servidor · LeanStart",
};

export default function ServerErrorPage() {
  return (
    <ErrorScreen
      code="500"
      icon={ServerCrash}
      title="Error interno del servidor"
      description="Algo falló de nuestro lado al procesar tu solicitud. Ya estamos al tanto; intenta de nuevo en unos minutos."
      accent="#EF6E6E"
      accentBg="rgba(239,110,110,0.09)"
      accentBorder="rgba(239,110,110,0.2)"
      actions={[{ label: "Volver al inicio", href: "/", icon: Home, variant: "primary" }]}
    />
  );
}

import type { Metadata } from "next";
import { FileWarning, Home } from "lucide-react";
import { ErrorScreen } from "@/components/error-screen";

export const metadata: Metadata = {
  title: "Solicitud inválida · LeanStart",
};

export default function BadRequestPage() {
  return (
    <ErrorScreen
      code="400"
      icon={FileWarning}
      title="Solicitud inválida"
      description="Los datos enviados no son correctos o están incompletos. Revisa la información e inténtalo de nuevo."
      actions={[{ label: "Volver al inicio", href: "/", icon: Home, variant: "primary" }]}
    />
  );
}

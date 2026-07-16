import { Compass } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { ErrorScreen } from "@/components/error-screen";

// Render por request para que la ilustración sea aleatoria en cada carga.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      icon={Compass}
      title="Página no encontrada"
      description="La página que buscas no existe o fue movida. Verifica la dirección o regresa al inicio para seguir validando tu idea."
      actions={[{ label: "Volver al inicio", href: "/", icon: ArrowLeft, variant: "primary" }]}
    />
  );
}

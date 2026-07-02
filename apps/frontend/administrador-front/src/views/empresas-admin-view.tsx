"use client";

import { Building2 } from "lucide-react";
import { PlaceholderView } from "../components/placeholder-view";

export function EmpresasAdminView() {
  return (
    <PlaceholderView
      title="Empresas"
      description="Supervisa todas las empresas registradas en la plataforma."
      icon={Building2}
    />
  );
}

"use client";

import { BarChart3 } from "lucide-react";
import { PlaceholderView } from "../components/placeholder-view";

export function ReportesView() {
  return (
    <PlaceholderView
      title="Reportes"
      description="Consulta información global del sistema: empresas, proyectos, usuarios y scores."
      icon={BarChart3}
    />
  );
}

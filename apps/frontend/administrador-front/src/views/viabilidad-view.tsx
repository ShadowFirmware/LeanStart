"use client";

import { TrendingUp } from "lucide-react";
import { PlaceholderView } from "../components/placeholder-view";

export function ViabilidadView() {
  return (
    <PlaceholderView
      title="Viabilidad"
      description="Configura los pesos del Score de Viabilidad y los niveles de clasificación."
      icon={TrendingUp}
    />
  );
}

"use client";

import { ClipboardList } from "lucide-react";
import { PlaceholderView } from "../components/placeholder-view";

export function CriteriosEvaluacionView() {
  return (
    <PlaceholderView
      title="Criterios de Evaluación"
      description="Configura la rúbrica utilizada por los evaluadores (criterios y pesos, deben sumar 100%)."
      icon={ClipboardList}
    />
  );
}

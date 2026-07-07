"use client";

import { History } from "lucide-react";
import { PlaceholderView } from "../components/placeholder-view";

export function MentorHistorialView() {
  return (
    <PlaceholderView
      title="Historial de Mentorías"
      description="Consulta el historial de proyectos que has revisado y sus observaciones."
      icon={History}
    />
  );
}

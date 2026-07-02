"use client";

import { Users } from "lucide-react";
import { PlaceholderView } from "../components/placeholder-view";

export function UsuariosView() {
  return (
    <PlaceholderView
      title="Usuarios"
      description="Crear, editar, activar y desactivar usuarios del sistema."
      icon={Users}
    />
  );
}

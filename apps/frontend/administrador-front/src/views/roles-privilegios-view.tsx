"use client";

import { ShieldCheck } from "lucide-react";
import { PlaceholderView } from "../components/placeholder-view";

export function RolesPrivilegiosView() {
  return (
    <PlaceholderView
      title="Roles y Privilegios"
      description="Administra roles funcionales y privilegios dinámicos por módulo y acción."
      icon={ShieldCheck}
    />
  );
}

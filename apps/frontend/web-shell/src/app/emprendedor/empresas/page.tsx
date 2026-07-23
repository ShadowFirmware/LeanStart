"use client";

import { EmpresasListView } from "@leanstart/empresas-front";
import { useViabilidadStore } from "@leanstart/administrador-front";

export default function Page() {
  const niveles = useViabilidadStore((s) => s.niveles);
  return <EmpresasListView filtrarPorDueno nivelesViabilidad={niveles} />;
}

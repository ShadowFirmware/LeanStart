import { ViewLoader } from "@leanstart/commons";

/** Frontera de carga del módulo del evaluador (empresas por evaluar, evaluación, historial…). */
export default function Loading() {
  return <ViewLoader message="Cargando módulo" />;
}

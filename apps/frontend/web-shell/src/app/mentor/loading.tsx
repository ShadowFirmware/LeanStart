import { ViewLoader } from "@leanstart/commons";

/** Frontera de carga del módulo del mentor (empresas acompañadas, observaciones, historial…). */
export default function Loading() {
  return <ViewLoader message="Cargando módulo" />;
}

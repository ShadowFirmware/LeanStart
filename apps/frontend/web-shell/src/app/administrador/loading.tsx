import { ViewLoader } from "@leanstart/commons";

/**
 * Frontera de carga del módulo de administración: cubre todas sus rutas
 * (dashboard, usuarios, roles, criterios, viabilidad, reportes, empresas…)
 * sin tapar el sidebar, que sigue navegable mientras la vista llega.
 */
export default function Loading() {
  return <ViewLoader message="Cargando módulo" />;
}

// Views (consumidas por los route shims de web-shell)
export { AdminDashboardView } from "./views/dashboard-view";
export { UsuariosView } from "./views/usuarios-view";
export { EmpresasAdminView } from "./views/empresas-admin-view";
export { RolesPrivilegiosView } from "./views/roles-privilegios-view";
export { CriteriosEvaluacionView } from "./views/criterios-evaluacion-view";
export { ViabilidadView } from "./views/viabilidad-view";
export { ReportesView } from "./views/reportes-view";
export { BitacoraView } from "./views/bitacora-view";
export { SoporteView } from "./views/soporte-view";

// Stores (para rehidratación centralizada en web-shell)
export { useEvaluacionesStore } from "./store/evaluaciones";
export type { EvaluacionEmpresa, ResultadoFinalizar } from "./store/evaluaciones";
export { usePrivilegiosStore } from "./store/privilegios";
export { useReportesGeneradosStore } from "./store/reportes-generados";
export { useBitacoraStore } from "./store/bitacora";
export type { EntradaBitacora, ServicioBitacora } from "./store/bitacora";
export { useSoporteStore } from "./store/soporte";
export type { ReporteSoporte, RespuestaSoporte, EstadoReporte } from "./store/soporte";
export { useRolesStore } from "./store/roles";
export type { RolPersonalizado } from "./store/roles";
export type { ReporteGenerado, TipoReporte } from "./store/reportes-generados";

// Configuración de evaluación (consumida también por el evaluador)
export { useCriteriosStore } from "./store/criterios";
export type { Criterio } from "./store/criterios";
export { useViabilidadStore } from "./store/viabilidad";
export type { NivelViabilidad, NuevoNivel } from "./store/viabilidad";
export { calcularReporte, rangoNivel } from "./lib/reporte";
export type { ReporteCalculo, CriterioCalculado } from "./lib/reporte";

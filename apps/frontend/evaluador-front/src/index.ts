// Views (consumidas por los route shims de web-shell)
export { EvaluadorDashboardView } from "./views/dashboard-view";
export { EvaluadorEmpresasView } from "./views/empresas-view";
export { EvaluadorEmpresaDetailView } from "./views/empresa-detail-view";
export { EvaluadorEvaluacionView } from "./views/evaluacion-view";
export { EvaluadorHistorialView } from "./views/historial-view";

// Componentes reutilizados fuera del rol evaluador (p. ej. la vista de solo-lectura del emprendedor)
export { ResultadoEvaluacion } from "./components/evaluacion-form";
export type { ResultadoEvaluacionProps } from "./components/evaluacion-form";

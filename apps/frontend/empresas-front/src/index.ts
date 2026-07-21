// Views (consumed by web-shell route shims)
export { EmpresasListView } from "./views/empresas-list-view";
export { EmpresaNewView } from "./views/empresa-new-view";
export { EmpresaDetailView } from "./views/empresa-detail-view";
export { CanvasView } from "./views/canvas-view";
export { HipotesisNewView } from "./views/hipotesis-new-view";
export { HipotesisEditView } from "./views/hipotesis-edit-view";
export { ProductosListView } from "./views/productos-list-view";
export { ProductoNewView } from "./views/producto-new-view";
export { ServicioNewView } from "./views/servicio-new-view";
export { ProductoEditView } from "./views/producto-edit-view";

// Store
export { useEmpresasStore } from "./store/empresas";
export type {
  Empresa,
  Producto,
  Hipotesis,
  CanvasData,
  Progreso,
  ExperimentoDiseno,
  ResultadosHipotesis,
  TipoEvidencia,
} from "./store/empresas";
export { DEFAULT_CANVAS } from "./store/empresas";
export { useObservacionesStore } from "./store/observaciones";
export type { Observacion, TipoElementoObservacion } from "./store/observaciones";
export { useReportesEmpresaStore } from "./store/reportes-empresa";
export type { ReporteEmpresa } from "./store/reportes-empresa";

// Componentes compartidos
export { ObservacionesButton } from "./components/observaciones-button";

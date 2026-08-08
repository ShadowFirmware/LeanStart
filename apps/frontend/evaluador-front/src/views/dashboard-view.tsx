"use client";

import { ClipboardCheck } from "lucide-react";
import { ProyectosAsignadosDashboard } from "@leanstart/empresas-front";
import type { EstadoEmpresa } from "@leanstart/commons";

/** Estado en el que un proyecto espera la evaluación formal del evaluador. */
const ESTADO_PENDIENTE: EstadoEmpresa = "en_evaluacion";
/** Estados en los que el proyecto ya recibió una resolución del evaluador. */
const ESTADOS_REALIZADOS: EstadoEmpresa[] = ["publicado", "devuelto"];

export function EvaluadorDashboardView() {
  return (
    <ProyectosAsignadosDashboard
      descripcion="Resumen de los proyectos que tienes asignados para evaluación."
      basePath="/evaluador/empresas"
      campoAsignado="evaluadorId"
      esPendiente={(e) => e.estado === ESTADO_PENDIENTE}
      esResuelto={(e) => ESTADOS_REALIZADOS.includes(e.estado)}
      etiquetaPendientes="Evaluaciones pendientes"
      etiquetaResueltos="Evaluaciones realizadas"
      tituloPendientes="Pendientes de evaluación"
      textoVacio="No tienes proyectos pendientes de evaluación por ahora."
      iconoVacio={ClipboardCheck}
    />
  );
}

"use client";

import { GraduationCap } from "lucide-react";
import { ProyectosAsignadosDashboard } from "@leanstart/empresas-front";
import type { EstadoEmpresa } from "@leanstart/commons";

/** Estados en los que un proyecto sigue activo dentro del proceso de mentoría. */
const ESTADOS_EN_MENTORIA: EstadoEmpresa[] = ["en_mentoria", "observaciones_pendientes", "observaciones_atendidas"];
/** Estados en los que el proyecto espera una acción del mentor (primera revisión o re-revisión). */
const ESTADOS_REQUIEREN_ACCION: EstadoEmpresa[] = ["en_mentoria", "observaciones_atendidas"];

export function MentorDashboardView() {
  return (
    <ProyectosAsignadosDashboard
      descripcion="Resumen de los proyectos que tienes en mentoría."
      basePath="/mentor/empresas"
      campoAsignado="mentorId"
      esPendiente={(e) => ESTADOS_REQUIEREN_ACCION.includes(e.estado)}
      esResuelto={(e) => !ESTADOS_EN_MENTORIA.includes(e.estado)}
      etiquetaPendientes="Pendientes de revisión"
      etiquetaResueltos="Revisados"
      tituloPendientes="Pendientes de revisión"
      textoVacio="No tienes proyectos pendientes de revisión por ahora."
      iconoVacio={GraduationCap}
    />
  );
}

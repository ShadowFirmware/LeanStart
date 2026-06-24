"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Building2, CheckCircle2, Circle, Package, Lightbulb, Trash2, Send } from "lucide-react";
import {
  Button,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@leanstart/commons";
import { toast } from "sonner";
import type { EstadoEmpresa, GiroEmpresa } from "@leanstart/commons";
import { useEmpresasStore, type Progreso } from "../store/empresas";

const ESTADO_CONFIG: Record<EstadoEmpresa, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador", color: "#9A62FA", bg: "rgba(154,98,250,0.12)" },
  pendiente_mentoria: { label: "Pendiente de mentoría", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_mentoria: { label: "En mentoría", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  observaciones_pendientes: { label: "Observaciones pendientes", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  observaciones_atendidas: { label: "Obs. atendidas", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pendiente_evaluacion: { label: "Pendiente de evaluación", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_evaluacion: { label: "En evaluación", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  evaluado: { label: "Evaluado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  publicado: { label: "Publicado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  devuelto: { label: "Devuelto", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const GIRO_LABELS: Record<GiroEmpresa, string> = {
  tecnologia: "Tecnología",
  educacion: "Educación",
  salud: "Salud",
  sustentabilidad: "Sustentabilidad",
  alimentacion: "Alimentación",
  comercio: "Comercio",
  servicios: "Servicios",
};

const TODOS_LOS_ESTADOS = "todos";

const FILTROS_ESTADO = [
  { value: TODOS_LOS_ESTADOS, label: "Todos" },
  { value: "borrador", label: "Borrador" },
  { value: "pendiente_mentoria", label: "En proceso" },
  { value: "evaluado", label: "Evaluado" },
];

const REQUISITOS = [
  { key: "tieneProducto" as keyof Progreso, label: "Producto" },
  { key: "tieneCanvas" as keyof Progreso, label: "Canvas" },
  { key: "tieneHipotesis" as keyof Progreso, label: "Hipótesis" },
];

function ProgressoBorrador({ progreso }: { progreso: Progreso }) {
  const completados = REQUISITOS.filter((r) => progreso[r.key]).length;
  const total = REQUISITOS.length;
  const pct = Math.round((completados / total) * 100);

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: "#7E7C86" }}>
          {completados} de {total} requisitos para enviar
        </span>
        <span className="text-xs font-medium" style={{ color: pct === 100 ? "#10B981" : "#7E7C86" }}>
          {pct}%
        </span>
      </div>
      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#10B981" : "#9A62FA",
          }}
        />
      </div>
      <div className="flex items-center gap-4 mt-2.5">
        {REQUISITOS.map(({ key, label }) => {
          const done = progreso[key];
          return (
            <div key={key} className="flex items-center gap-1">
              {done ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#10B981" }} />
              ) : (
                <Circle className="w-3 h-3 shrink-0" style={{ color: "#4A4850" }} />
              )}
              <span className="text-[11px]" style={{ color: done ? "#F2F0F7" : "#4A4850" }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EmpresasListView() {
  const empresas = useEmpresasStore((s) => s.empresas);
  const eliminarEmpresa = useEmpresasStore((s) => s.eliminarEmpresa);
  const actualizarEmpresa = useEmpresasStore((s) => s.actualizarEmpresa);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(TODOS_LOS_ESTADOS);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);

  function confirmDelete() {
    if (!deleteTarget) return;
    eliminarEmpresa(deleteTarget.id);
    toast.success(`"${deleteTarget.nombre}" fue eliminada.`);
    setDeleteTarget(null);
  }

  const empresasFiltradas = empresas.filter((e) => {
    const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado =
      filtroEstado === TODOS_LOS_ESTADOS ||
      (filtroEstado === "pendiente_mentoria"
        ? ["pendiente_mentoria", "en_mentoria", "observaciones_pendientes", "observaciones_atendidas", "pendiente_evaluacion", "en_evaluacion"].includes(e.estado)
        : e.estado === filtroEstado);
    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>
            Mis Empresas
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
            {empresas.length} {empresas.length === 1 ? "empresa registrada" : "empresas registradas"}
          </p>
        </div>
        <Button
          size="lg"
          nativeButton={false}
          className="h-9 px-4 text-sm font-medium border-0 shrink-0 justify-center w-full sm:w-auto"
          style={{
            background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
            color: "#FBFBFC",
          }}
          render={<Link href="/emprendedor/empresas/nueva" />}
        >
          <Plus className="w-4 h-4" />
          Crear empresa
        </Button>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#4A4850" }}
          />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
            style={{
              backgroundColor: "#131219",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#F2F0F7",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
          />
        </div>

        {/* Filtros de estado */}
        <div
          className="flex items-center gap-1 rounded-lg p-1 shrink-0"
          style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {FILTROS_ESTADO.map(({ value, label }) => {
            const isActive = filtroEstado === value;
            return (
              <button
                key={value}
                onClick={() => setFiltroEstado(value)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? "rgba(154,98,250,0.18)" : "transparent",
                  color: isActive ? "#F2F0F7" : "#7E7C86",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grilla de tarjetas */}
      {empresasFiltradas.length === 0 ? (
        <div
          className="rounded-xl p-14 text-center"
          style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Building2 className="w-9 h-9 mx-auto mb-3" style={{ color: "#4A4850" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "#F2F0F7" }}>
            {busqueda || filtroEstado !== TODOS_LOS_ESTADOS
              ? "Sin resultados"
              : "Aún no tienes empresas"}
          </p>
          <p className="text-sm" style={{ color: "#7E7C86" }}>
            {busqueda || filtroEstado !== TODOS_LOS_ESTADOS
              ? "Prueba con otros términos o filtros."
              : "Crea tu primera empresa para comenzar."}
          </p>
          {!busqueda && filtroEstado === TODOS_LOS_ESTADOS && (
            <Button
              size="sm"
              nativeButton={false}
              className="mt-5 h-8 px-4 text-xs font-medium border-0"
              style={{
                background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
                color: "#FBFBFC",
              }}
              render={<Link href="/emprendedor/empresas/nueva" />}
            >
              <Plus className="w-3.5 h-3.5" />
              Crear empresa
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresasFiltradas.map((empresa) => {
            const estadoConfig = ESTADO_CONFIG[empresa.estado];
            return (
              <Link
                key={empresa.id}
                href={`/emprendedor/empresas/${empresa.id}`}
                className="flex flex-col rounded-xl p-5 transition-[border-color]"
                style={{
                  backgroundColor: "#131219",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)")
                }
              >
                {/* Header: logo + nombre/giro + estado */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden"
                    style={{ backgroundColor: "rgba(154,98,250,0.12)", color: "#9A62FA" }}
                  >
                    {empresa.logoUrl ? (
                      <Image src={empresa.logoUrl} alt={empresa.nombre} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      empresa.nombre.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug truncate" style={{ color: "#F2F0F7" }}>
                      {empresa.nombre}
                    </p>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#7E7C86" }}
                    >
                      {GIRO_LABELS[empresa.giro]}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={{ color: estadoConfig.color, backgroundColor: estadoConfig.bg }}
                  >
                    {estadoConfig.label}
                  </span>
                </div>

                {/* Stats */}
                <div
                  className="flex items-center gap-4 pt-3.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" style={{ color: "#4A4850" }} />
                    <span className="text-xs" style={{ color: "#7E7C86" }}>
                      {empresa.productosList?.length ?? 0} {(empresa.productosList?.length ?? 0) === 1 ? "producto" : "productos"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" style={{ color: "#4A4850" }} />
                    <span className="text-xs" style={{ color: "#7E7C86" }}>
                      {(empresa.hipotesisList ?? []).length} hipótesis
                    </span>
                  </div>
                </div>

                {/* Fecha */}
                <span className="text-[11px] mt-2" style={{ color: "#4A4850" }}>
                  Creada el {empresa.creadaEn}
                </span>

                {/* Progreso borrador */}
                {empresa.estado === "borrador" && empresa.progreso && (
                  <ProgressoBorrador progreso={empresa.progreso} />
                )}

                {/* Pie: enviar a mentoría (izq) + eliminar (der) */}
                <div
                  className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {empresa.estado === "borrador" && empresa.progreso?.tieneProducto && empresa.progreso?.tieneCanvas && empresa.progreso?.tieneHipotesis ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        actualizarEmpresa(empresa.id, { estado: "pendiente_mentoria" });
                        toast.success(`"${empresa.nombre}" fue enviada a mentoría.`);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-85"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "#FBFBFC" }}
                    >
                      <Send className="w-3 h-3" />
                      Enviar a mentoría
                    </button>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget({ id: empresa.id, nombre: empresa.nombre });
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                    style={{ color: "#7E7C86" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#EF4444";
                      e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#7E7C86";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Eliminar empresa"
                    aria-label="Eliminar empresa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Confirmación de eliminado */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar empresa</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `¿Seguro que quieres eliminar "${deleteTarget.nombre}"? Se borrarán también todos sus productos, canvas e hipótesis. Esta acción no se puede deshacer.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

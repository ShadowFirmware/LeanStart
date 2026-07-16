"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Building2, Package, Lightbulb, Trash2, Send, UserCog } from "lucide-react";
import {
  Button,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  useUsuariosStore, useCurrentUser, useHasHydrated,
} from "@leanstart/commons";
import { toast } from "sonner";
import type { EstadoEmpresa, GiroEmpresa } from "@leanstart/commons";
import { useEmpresasStore, type Empresa, type Progreso } from "../store/empresas";

const ESTADO_CONFIG: Record<EstadoEmpresa, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador", color: "var(--brand)", bg: "var(--brand-tint)" },
  pendiente_mentoria: { label: "Pendiente de mentoría", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_mentoria: { label: "En mentoría", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  observaciones_pendientes: { label: "Observaciones pendientes", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  observaciones_atendidas: { label: "Obs. atendidas", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pendiente_evaluacion: { label: "Pendiente de evaluación", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_evaluacion: { label: "En evaluación", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
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
  { value: "publicado", label: "Publicado" },
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
    <div className="flex items-center gap-2 mt-2.5">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border-hair)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#10B981" : "var(--brand)",
          }}
        />
      </div>
      <span className="text-[11px] font-medium shrink-0" style={{ color: pct === 100 ? "#10B981" : "var(--text-dim)" }}>
        {pct}%
      </span>
    </div>
  );
}

const TODOS_LOS_GIROS = "todos";

interface EmpresasListViewProps {
  /** Ruta base para los enlaces (crear, detalle). */
  basePath?: string;
  /** Cuando es true, oculta crear/eliminar/enviar a mentoría — solo consulta. */
  readOnly?: boolean;
  /** Título de la página. */
  title?: string;
  /** Cuando es true, permite asignar mentor/evaluador a proyectos pendientes (uso exclusivo del administrador). */
  permitirAsignaciones?: boolean;
  /** Restringe la lista a las empresas con ese rol asignado (mentorId/evaluadorId presente). */
  soloAsignados?: TipoAsignacion;
  /** Cuando es true, muestra únicamente las empresas cuyo `ownerId` es el del usuario actual. */
  filtrarPorDueno?: boolean;
  /** Junto con `soloAsignados`, restringe a las empresas asignadas a este id concreto (mi id). */
  scopeAsignadoId?: string;
  /** Restringe la lista (y las opciones del filtro de estado) a estos estados. */
  estadosPermitidos?: EstadoEmpresa[];
  /** Muestra un filtro adicional por giro. */
  mostrarFiltroGiro?: boolean;
}

type TipoAsignacion = "mentor" | "evaluador";

export function EmpresasListView({
  basePath = "/emprendedor/empresas",
  readOnly = false,
  title = "Mis Empresas",
  permitirAsignaciones = false,
  soloAsignados,
  filtrarPorDueno = false,
  scopeAsignadoId,
  estadosPermitidos,
  mostrarFiltroGiro = false,
}: EmpresasListViewProps = {}) {
  const hydrated = useHasHydrated();
  const currentUser = useCurrentUser();
  const todasLasEmpresas = useEmpresasStore((s) => s.empresas);
  const eliminarEmpresa = useEmpresasStore((s) => s.eliminarEmpresa);
  const actualizarEmpresa = useEmpresasStore((s) => s.actualizarEmpresa);
  const asignarMentor = useEmpresasStore((s) => s.asignarMentor);
  const asignarEvaluador = useEmpresasStore((s) => s.asignarEvaluador);
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(TODOS_LOS_ESTADOS);
  const [filtroGiro, setFiltroGiro] = useState(TODOS_LOS_GIROS);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [asignarTarget, setAsignarTarget] = useState<{ empresa: Empresa; tipo: TipoAsignacion } | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");

  const empresas = todasLasEmpresas.filter((e) => {
    const asignadoKey = soloAsignados === "mentor" ? "mentorId" : "evaluadorId";
    // Aislamiento por dueño: el emprendedor sólo ve sus propias empresas.
    const coincideDueno = !filtrarPorDueno || e.ownerId === currentUser?.id;
    const coincideAsignacion = !soloAsignados || Boolean(e[asignadoKey]);
    // Aislamiento por asignación: el mentor/evaluador sólo ve las asignadas a su id.
    const coincideAsignadoMio = !scopeAsignadoId || e[asignadoKey] === scopeAsignadoId;
    const coincideEstadoPermitido = !estadosPermitidos || estadosPermitidos.includes(e.estado);
    return coincideDueno && coincideAsignacion && coincideAsignadoMio && coincideEstadoPermitido;
  });

  function confirmDelete() {
    if (!deleteTarget) return;
    eliminarEmpresa(deleteTarget.id);
    toast.success(`"${deleteTarget.nombre}" fue eliminada.`);
    setDeleteTarget(null);
  }

  function abrirAsignar(empresa: Empresa, tipo: TipoAsignacion) {
    setAsignarTarget({ empresa, tipo });
    setUsuarioSeleccionado(empresa[tipo === "mentor" ? "mentorId" : "evaluadorId"] ?? "");
  }

  function confirmarAsignar() {
    if (!asignarTarget || !usuarioSeleccionado) return;
    const { empresa, tipo } = asignarTarget;
    const usuario = usuarios.find((u) => u.id === usuarioSeleccionado);
    if (tipo === "mentor") {
      asignarMentor(empresa.id, usuarioSeleccionado);
    } else {
      asignarEvaluador(empresa.id, usuarioSeleccionado);
    }
    toast.success(`${tipo === "mentor" ? "Mentor" : "Evaluador"} "${usuario?.nombre}" asignado a "${empresa.nombre}".`);
    setAsignarTarget(null);
  }

  const opcionesAsignables = asignarTarget
    ? usuarios.filter((u) => u.rol === asignarTarget.tipo && u.estado === "activo")
    : [];

  const empresasFiltradas = empresas.filter((e) => {
    const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado =
      filtroEstado === TODOS_LOS_ESTADOS ||
      (readOnly
        ? e.estado === filtroEstado
        : filtroEstado === "pendiente_mentoria"
          ? ["pendiente_mentoria", "en_mentoria", "observaciones_pendientes", "observaciones_atendidas", "pendiente_evaluacion", "en_evaluacion"].includes(e.estado)
          : e.estado === filtroEstado);
    const coincideGiro = filtroGiro === TODOS_LOS_GIROS || e.giro === filtroGiro;
    return coincideBusqueda && coincideEstado && coincideGiro;
  });

  const hayFiltrosActivos = Boolean(busqueda) || filtroEstado !== TODOS_LOS_ESTADOS || filtroGiro !== TODOS_LOS_GIROS;

  // Hasta que el store persistido rehidrate, servidor y primer render de cliente
  // muestran el mismo esqueleto neutro para evitar mismatches de hidratación.
  if (!hydrated) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-7 w-40 rounded-md animate-pulse" style={{ backgroundColor: "var(--border-subtle)" }} />
          <div className="h-4 w-28 rounded-md mt-2 animate-pulse" style={{ backgroundColor: "var(--hover-surface)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {empresas.length} {empresas.length === 1 ? "empresa registrada" : "empresas registradas"}
          </p>
        </div>
        {!readOnly && (
          <Button
            size="lg"
            nativeButton={false}
            className="h-9 px-4 text-sm font-medium border-0 shrink-0 justify-center w-full sm:w-auto"
            style={{
              background: "var(--brand-gradient)",
              color: "var(--brand-fg)",
            }}
            render={<Link href={`${basePath}/nueva`} />}
          >
            <Plus className="w-4 h-4" />
            Crear empresa
          </Button>
        )}
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--text-faint)" }}
          />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--surface-profile)",
              border: "1px solid var(--border-hair)",
              color: "var(--text-strong)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
          />
        </div>

        {/* Filtros de estado */}
        {readOnly ? (
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? TODOS_LOS_ESTADOS)}>
            <SelectTrigger
              className="w-full sm:w-56 h-9 text-sm shrink-0"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_ESTADOS}>Todos los estados</SelectItem>
              {(Object.entries(ESTADO_CONFIG) as [EstadoEmpresa, typeof ESTADO_CONFIG[EstadoEmpresa]][])
                .filter(([value]) => !estadosPermitidos || estadosPermitidos.includes(value))
                .map(([value, cfg]) => (
                  <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
          <div
            className="flex items-center gap-1 rounded-lg p-1 shrink-0"
            style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
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
                    color: isActive ? "var(--text-strong)" : "var(--text-dim)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Filtro de giro */}
        {mostrarFiltroGiro && (
          <Select value={filtroGiro} onValueChange={(v) => setFiltroGiro(v ?? TODOS_LOS_GIROS)}>
            <SelectTrigger
              className="w-full sm:w-44 h-9 text-sm shrink-0"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              <SelectValue placeholder="Filtrar por giro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_GIROS}>Todos los giros</SelectItem>
              {(Object.entries(GIRO_LABELS) as [GiroEmpresa, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Grilla de tarjetas */}
      {empresasFiltradas.length === 0 ? (
        <div
          className="rounded-xl p-14 text-center"
          style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
        >
          <Building2 className="w-9 h-9 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>
            {hayFiltrosActivos
              ? "Sin resultados"
              : readOnly ? "Aún no hay empresas registradas" : "Aún no tienes empresas"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            {hayFiltrosActivos
              ? "Prueba con otros términos o filtros."
              : readOnly ? "Cuando se registren empresas aparecerán aquí." : "Crea tu primera empresa para comenzar."}
          </p>
          {!readOnly && !hayFiltrosActivos && (
            <Button
              size="sm"
              nativeButton={false}
              className="mt-5 h-8 px-4 text-xs font-medium border-0"
              style={{
                background: "var(--brand-gradient)",
                color: "var(--brand-fg)",
              }}
              render={<Link href={`${basePath}/nueva`} />}
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
            // El emprendedor solo puede eliminar mientras el proyecto está en captura o le toca atender observaciones.
            const puedeEditar = !readOnly && (
              empresa.estado === "borrador" ||
              empresa.estado === "observaciones_pendientes" ||
              empresa.estado === "devuelto"
            );
            return (
              <Link
                key={empresa.id}
                href={`${basePath}/${empresa.id}`}
                className="flex flex-col rounded-xl p-5 transition-[border-color]"
                style={{
                  backgroundColor: "var(--surface-profile)",
                  boxShadow: "var(--shadow-card)",
                  border: "1px solid var(--border-subtle)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")
                }
              >
                {/* Header: logo + nombre/giro + estado */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden"
                    style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand)" }}
                  >
                    {empresa.logoUrl ? (
                      <Image src={empresa.logoUrl} alt={empresa.nombre} width={48} height={48} className="object-contain w-full h-full p-1.5" unoptimized />
                    ) : (
                      empresa.nombre.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug truncate" style={{ color: "var(--text-strong)" }}>
                      {empresa.nombre}
                    </p>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ backgroundColor: "var(--border-subtle)", color: "var(--text-dim)" }}
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
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {empresa.productosList?.length ?? 0} {(empresa.productosList?.length ?? 0) === 1 ? "producto" : "productos"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {(empresa.hipotesisList ?? []).length} hipótesis
                    </span>
                  </div>
                </div>

                {/* Fecha */}
                <span className="text-[11px] mt-2" style={{ color: "var(--text-faint)" }}>
                  Creada el {empresa.creadaEn}
                </span>

                {/* Progreso borrador */}
                {empresa.estado === "borrador" && empresa.progreso && (
                  <ProgressoBorrador progreso={empresa.progreso} />
                )}

                {/* Pie: enviar a mentoría (izq) + eliminar (der) */}
                {!readOnly && (
                  <div
                    className="flex items-center justify-between mt-3 pt-3"
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
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
                        style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "var(--brand-fg)" }}
                      >
                        <Send className="w-3 h-3" />
                        Enviar a mentoría
                      </button>
                    ) : (
                      <span />
                    )}

                    {puedeEditar ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget({ id: empresa.id, nombre: empresa.nombre });
                        }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ color: "var(--text-dim)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#EF4444";
                          e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-dim)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="Eliminar empresa"
                        aria-label="Eliminar empresa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                )}

                {/* Asignación de mentor/evaluador (solo administrador) */}
                {permitirAsignaciones && (empresa.estado === "pendiente_mentoria" || empresa.estado === "pendiente_evaluacion") && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirAsignar(empresa, empresa.estado === "pendiente_mentoria" ? "mentor" : "evaluador");
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-85 w-full justify-center"
                      style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
                    >
                      <UserCog className="w-3 h-3" />
                      {empresa.estado === "pendiente_mentoria" ? "Asignar mentor" : "Asignar evaluador"}
                    </button>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Confirmación de eliminado */}
      {!readOnly && (
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
      )}

      {/* Dialog: asignar mentor/evaluador */}
      {permitirAsignaciones && (
        <Dialog open={asignarTarget !== null} onOpenChange={(open) => { if (!open) setAsignarTarget(null); }}>
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
            <DialogHeader className="min-w-0">
              <DialogTitle className="break-words">{asignarTarget?.tipo === "mentor" ? "Asignar mentor" : "Asignar evaluador"}</DialogTitle>
              <DialogDescription className="break-words" style={{ overflowWrap: "anywhere" }}>
                {asignarTarget ? (
                  <>Elige un {asignarTarget.tipo} activo para <span className="font-medium text-foreground">{asignarTarget.empresa.nombre}</span>.</>
                ) : ""}
              </DialogDescription>
            </DialogHeader>
            <Select
              value={usuarioSeleccionado}
              onValueChange={(v) => setUsuarioSeleccionado(v ?? "")}
              items={usuarios.map((u) => ({ value: u.id, label: u.nombre }))}
            >
              <SelectTrigger className="w-full" style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}>
                <SelectValue placeholder={`Selecciona un ${asignarTarget?.tipo ?? ""}`} />
              </SelectTrigger>
              <SelectContent>
                {opcionesAsignables.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-center" style={{ color: "var(--text-dim)" }}>
                    No hay {asignarTarget?.tipo === "mentor" ? "mentores" : "evaluadores"} activos.
                  </div>
                ) : (
                  opcionesAsignables.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAsignarTarget(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!usuarioSeleccionado}
                onClick={confirmarAsignar}
                className="border-0"
                style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
              >
                Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

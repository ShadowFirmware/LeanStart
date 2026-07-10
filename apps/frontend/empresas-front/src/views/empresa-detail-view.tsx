"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Pencil, X, Check, Camera,
  Package, LayoutTemplate, Lightbulb,
  Plus, AlertCircle, ChevronRight, Trash2, Send, UserCog,
  CheckCircle2, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@leanstart/commons";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@leanstart/commons";
import { Input } from "@leanstart/commons";
import { Textarea } from "@leanstart/commons";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@leanstart/commons";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter,
  useUsuariosStore,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import type { GiroEmpresa, EstadoEmpresa } from "@leanstart/commons";
import { fileToDataUrl } from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import { useObservacionesStore, puedeVerObservaciones } from "../store/observaciones";
import { ObservacionesButton } from "../components/observaciones-button";

const GIROS: { value: GiroEmpresa; label: string }[] = [
  { value: "tecnologia", label: "Tecnología" },
  { value: "educacion", label: "Educación" },
  { value: "salud", label: "Salud" },
  { value: "sustentabilidad", label: "Sustentabilidad" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "comercio", label: "Comercio" },
  { value: "servicios", label: "Servicios" },
];

const ESTADO_CONFIG = {
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
} as const;

const ESTADO_HIPOTESIS_CONFIG = {
  pendiente_validacion: { label: "Pendiente", color: "#7E7C86", bg: "rgba(255,255,255,0.06)" },
  validada: { label: "Validada", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  invalidada: { label: "Invalidada", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
} as const;

const GIRO_LABELS: Record<GiroEmpresa, string> = {
  tecnologia: "Tecnología", educacion: "Educación", salud: "Salud",
  sustentabilidad: "Sustentabilidad", alimentacion: "Alimentación",
  comercio: "Comercio", servicios: "Servicios",
};

const CANVAS_TOTAL = 9;

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  giro: z.enum(
    ["tecnologia", "educacion", "salud", "sustentabilidad", "alimentacion", "comercio", "servicios"],
    { error: "Selecciona un giro" }
  ),
  descripcion: z.string().min(20, "Mínimo 20 caracteres"),
  mercadoObjetivo: z.string().min(20, "Mínimo 20 caracteres"),
});

type FormValues = z.infer<typeof schema>;

/* ─── Tarjeta de sección ─── */
function SectionCard({ title, icon: Icon, action, children, tienePendiente }: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  tienePendiente?: boolean;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 md:px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="relative w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)" }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: "#9A62FA" }} />
            {tienePendiente && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#EF4444", border: "2px solid #131219" }}
              />
            )}
          </div>
          <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>{title}</span>
        </div>
        {action}
      </div>
      <div className="px-4 md:px-6 py-5">{children}</div>
    </div>
  );
}

const FASE_CONFIG = {
  1: { label: "Creación",    color: "#7E7C86", bg: "rgba(255,255,255,0.06)" },
  2: { label: "Experimento", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  3: { label: "Completa",    color: "#10B981", bg: "rgba(16,185,129,0.12)" },
} as const;

/* ─── Sección Hipótesis ─── */
function HipotesisSection({ empresaId, hipotesisList, basePath, readOnly, permitirComentarios, ocultarCorreccionesPendientes, autorNombre, estadoEmpresa, puedeEditar }: {
  empresaId: string;
  hipotesisList: import("../store/empresas").Hipotesis[];
  basePath: string;
  readOnly: boolean;
  permitirComentarios?: boolean;
  ocultarCorreccionesPendientes?: boolean;
  autorNombre?: string;
  estadoEmpresa: EstadoEmpresa;
  puedeEditar: boolean;
}) {
  const eliminarHipotesis = useEmpresasStore((s) => s.eliminarHipotesis);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; titulo: string } | null>(null);
  const limite = hipotesisList.length >= 3;
  const puedeVerObs = puedeVerObservaciones(estadoEmpresa, readOnly, Boolean(permitirComentarios));

  function confirmDelete() {
    if (!deleteTarget) return;
    eliminarHipotesis(empresaId, deleteTarget.id);
    toast.success("Hipótesis eliminada.");
    setDeleteTarget(null);
  }

  return (
    <SectionCard
      title="Hipótesis"
      icon={Lightbulb}
      action={
        !puedeEditar ? undefined : !limite ? (
          <Link
            href={`${basePath}/${empresaId}/hipotesis/nueva`}
            className="inline-flex items-center gap-1.5 text-xs px-3 h-7 rounded-lg transition-colors"
            style={{ color: "#9A62FA", backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.2)" }}
          >
            <Plus className="w-3 h-3" /> Agregar hipótesis
          </Link>
        ) : (
          <span className="text-xs" style={{ color: "#4A4850" }}>Máximo 3 hipótesis</span>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {hipotesisList.length === 0 && (
          <p className="text-sm" style={{ color: "#7E7C86" }}>
            {puedeEditar ? "No tienes hipótesis registradas. Las hipótesis te ayudan a validar las suposiciones de tu modelo de negocio." : "Esta empresa no tiene hipótesis registradas."}
          </p>
        )}

        {hipotesisList.map((h, i) => {
          const estadoCfg = ESTADO_HIPOTESIS_CONFIG[h.estado] ?? ESTADO_HIPOTESIS_CONFIG.pendiente_validacion;
          const fase = (h.fase ?? 1) as 1 | 2 | 3;
          const faseCfg = FASE_CONFIG[fase];
          const editHref = `${basePath}/${empresaId}/hipotesis/${h.id}/editar`;
          const bloqueadaPorMentor = h.estado === "validada" || h.estado === "invalidada";
          return (
            <Link
              key={h.id}
              href={editHref}
              className="flex items-start gap-3 rounded-xl px-4 py-3 transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
            >
              <span className="text-xs font-bold shrink-0 mt-0.5 w-5 text-center" style={{ color: "#4A4850" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words" style={{ color: "#F2F0F7", overflowWrap: "anywhere" }}>{h.titulo}</p>
                <p className="text-xs mt-0.5 leading-relaxed line-clamp-2 break-words" style={{ color: "#7E7C86", overflowWrap: "anywhere" }}>{h.descripcion}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {estadoEmpresa === "borrador" && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: faseCfg.color, backgroundColor: faseCfg.bg }}>
                      Fase {fase}: {faseCfg.label}
                    </span>
                  )}
                  {fase === 3 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: estadoCfg.color, backgroundColor: estadoCfg.bg }}>
                      {estadoCfg.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ObservacionesButton
                  empresaId={empresaId}
                  tipoElemento="hipotesis"
                  elementoId={h.id}
                  puedeComentar={permitirComentarios}
                  puedeMarcarEnRevision={!readOnly}
                  puedeVer={puedeVerObs}
                  ocultarCorreccionesPendientes={Boolean(ocultarCorreccionesPendientes)}
                  autorNombre={autorNombre}
                />
                {puedeEditar && !bloqueadaPorMentor && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget({ id: h.id, titulo: h.titulo });
                    }}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: "#EF4444" }}
                    title="Eliminar hipótesis"
                    aria-label="Eliminar hipótesis"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Confirmación eliminar hipótesis */}
      {puedeEditar && (
        <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar hipótesis</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget
                  ? `¿Seguro que quieres eliminar "${deleteTarget.titulo}"? Esta acción no se puede deshacer.`
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
    </SectionCard>
  );
}

interface EmpresaDetailViewProps {
  /** Ruta base de la lista y de las sub-páginas (canvas, productos, hipótesis). */
  basePath?: string;
  /** Cuando es true, oculta toda acción de edición/creación/eliminación — solo consulta. */
  readOnly?: boolean;
  /** Texto del enlace "volver". */
  backLabel?: string;
  /** Cuando es true, permite asignar mentor/evaluador a proyectos pendientes (uso exclusivo del administrador). */
  permitirAsignaciones?: boolean;
  /** Cuando es true, permite dejar observaciones en hipótesis (uso exclusivo del mentor). */
  permitirComentarios?: boolean;
  autorNombre?: string;
}

type TipoAsignacion = "mentor" | "evaluador";

/* ─── Página principal ─── */
export function EmpresaDetailView({
  basePath = "/emprendedor/empresas",
  readOnly = false,
  backLabel = "Mis Empresas",
  permitirAsignaciones = false,
  permitirComentarios = false,
  autorNombre,
}: EmpresaDetailViewProps = {}) {
  const { id } = useParams<{ id: string }>();
  const { empresas, actualizarEmpresa } = useEmpresasStore();
  const asignarMentor = useEmpresasStore((s) => s.asignarMentor);
  const asignarEvaluador = useEmpresasStore((s) => s.asignarEvaluador);
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const observaciones = useObservacionesStore((s) => s.observaciones);
  const cerrarObservacionesDeEmpresa = useObservacionesStore((s) => s.cerrarObservacionesDeEmpresa);
  const empresa = empresas.find((e) => e.id === id);

  const [editando, setEditando] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoLightboxOpen, setLogoLightboxOpen] = useState(false);
  const [asignarTipo, setAsignarTipo] = useState<TipoAsignacion | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: empresa
      ? { nombre: empresa.nombre, giro: empresa.giro, descripcion: empresa.descripcion, mercadoObjetivo: empresa.mercadoObjetivo }
      : undefined,
  });

  if (!empresa) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "#7E7C86" }}>
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
        <div className="flex flex-col items-center text-center py-20">
          <AlertCircle className="w-10 h-10 mb-4" style={{ color: "#4A4850" }} />
          <p className="text-base font-medium mb-1" style={{ color: "#F2F0F7" }}>Empresa no encontrada</p>
          <p className="text-sm" style={{ color: "#7E7C86" }}>Esta empresa no existe o fue eliminada.</p>
        </div>
      </div>
    );
  }

  const estadoConfig = ESTADO_CONFIG[empresa.estado];
  const logoActual = logoPreview ?? empresa.logoUrl;
  const nombreActual = form.watch("nombre") || empresa.nombre;
  const canvasPct = Math.round(((empresa.canvasBloques ?? 0) / CANVAS_TOTAL) * 100);

  // Progreso de la revisión del mentor: ¿ya se pronunció sobre todas las hipótesis y no dejó nada pendiente?
  const hipotesisList = empresa.hipotesisList ?? [];
  const todasHipotesisRevisadas = hipotesisList.length > 0 && hipotesisList.every((h) => h.estado === "validada" || h.estado === "invalidada");
  const observacionesEmpresa = observaciones.filter((o) => o.empresaId === id);
  const hayObservacionesPendientes = observacionesEmpresa.some((o) => o.estado === "pendiente" || o.estado === "en_revision");
  const listoParaEvaluacion = todasHipotesisRevisadas && !hayObservacionesPendientes;

  // El emprendedor solo puede editar/agregar/eliminar mientras el proyecto está en captura
  // o mientras le toca atender observaciones (el mentor o el evaluador se lo devolvieron).
  const puedeEditarProyecto = !readOnly && (
    empresa.estado === "borrador" ||
    empresa.estado === "observaciones_pendientes" ||
    empresa.estado === "devuelto"
  );
  // El mentor solo puede dejar/confirmar comentarios mientras le toca revisar el proyecto.
  const mentorPuedeComentar = permitirComentarios && (empresa.estado === "en_mentoria" || empresa.estado === "observaciones_atendidas");
  // El mentor no debe ver las correcciones del emprendedor (en_revision) hasta que este envíe el proyecto de nuevo.
  const ocultarCorreccionesPendientes = permitirComentarios && !mentorPuedeComentar;

  function esPendienteParaMiRol(o: { estado: (typeof observacionesEmpresa)[number]["estado"] }) {
    // Mentor: solo le corresponde revisar lo que el emprendedor ya marcó como resuelto, y solo cuando es su turno.
    if (permitirComentarios) return mentorPuedeComentar && o.estado === "en_revision";
    // Emprendedor: solo le corresponde atender lo que el mentor dejó pendiente.
    if (!readOnly) return o.estado === "pendiente";
    // Otros roles de solo consulta (admin/evaluador): cualquier cosa aún sin cerrar.
    return o.estado === "pendiente" || o.estado === "en_revision";
  }
  const puedeVerObs = puedeVerObservaciones(empresa.estado, readOnly, permitirComentarios);
  const productosTienenPendiente = puedeVerObs && observacionesEmpresa.some((o) => o.tipoElemento === "producto" && esPendienteParaMiRol(o));
  const canvasTienePendiente = puedeVerObs && observacionesEmpresa.some((o) => o.tipoElemento === "canvas" && esPendienteParaMiRol(o));
  const todosComentariosResueltos = !observacionesEmpresa.some((o) => o.estado === "pendiente");

  function enviarAEvaluacion() {
    actualizarEmpresa(id, { estado: "pendiente_evaluacion" });
    cerrarObservacionesDeEmpresa(id);
    toast.success(`"${empresa?.nombre}" fue enviada a evaluación.`);
  }

  function enviarComentariosEmprendedor() {
    actualizarEmpresa(id, { estado: "observaciones_pendientes" });
    toast.success(`Se enviaron los comentarios a "${empresa?.nombre}".`);
  }

  function enviarNuevamenteAlMentor() {
    actualizarEmpresa(id, { estado: "observaciones_atendidas" });
    toast.success(`"${empresa?.nombre}" fue enviada nuevamente al mentor.`);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 2MB)
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast.error("La imagen es muy grande. Máximo 2MB.");
      e.target.value = "";
      return;
    }

    // Validar tipo
    const validos = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validos.includes(file.type)) {
      toast.error("Formato no soportado. Usa PNG, JPG, SVG o WebP.");
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoPreview(dataUrl);
      toast.success(`Imagen "${file.name}" lista. No olvides guardar los cambios.`);
    } catch {
      toast.error("No se pudo leer la imagen.");
    }
  }

  function cancelarEdicion() {
    form.reset();
    setLogoPreview(null);
    setEditando(false);
  }

  function onSubmit(values: FormValues) {
    actualizarEmpresa(id, { ...values, logoUrl: logoPreview ?? empresa?.logoUrl });
    toast.success("Empresa actualizada correctamente.");
    setLogoPreview(null);
    setEditando(false);
  }

  function abrirAsignar(tipo: TipoAsignacion) {
    setAsignarTipo(tipo);
    setUsuarioSeleccionado((tipo === "mentor" ? empresa?.mentorId : empresa?.evaluadorId) ?? "");
  }

  function confirmarAsignar() {
    if (!asignarTipo || !usuarioSeleccionado) return;
    const usuario = usuarios.find((u) => u.id === usuarioSeleccionado);
    if (asignarTipo === "mentor") {
      asignarMentor(id, usuarioSeleccionado);
    } else {
      asignarEvaluador(id, usuarioSeleccionado);
    }
    toast.success(`${asignarTipo === "mentor" ? "Mentor" : "Evaluador"} "${usuario?.nombre}" asignado.`);
    setAsignarTipo(null);
  }

  const opcionesAsignables = asignarTipo
    ? usuarios.filter((u) => u.rol === asignarTipo && u.estado === "activo")
    : [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link
        href={basePath}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>

      {/* ── Información general ── */}
      <div
        className="rounded-2xl p-4 md:p-6"
        style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {editando && puedeEditarProyecto ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden group"
                    style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "2px dashed rgba(154,98,250,0.35)" }}
                  >
                    {logoActual ? (
                      <>
                        <Image src={logoActual} alt="Logo" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-bold" style={{ color: "#9A62FA" }}>{nombreActual.charAt(0).toUpperCase()}</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(13,12,16,0.6)" }}>
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                      <FormItem className="gap-1.5">
                        <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Nombre</FormLabel>
                        <FormControl>
                          <Input className="h-9 text-sm focus-visible:ring-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }} {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormItem className="gap-1.5">
                    <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Giro</FormLabel>
                    <Controller
                      control={form.control}
                      name="giro"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-9 text-sm focus-visible:ring-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}>
                            <SelectValue placeholder="Selecciona un giro" />
                          </SelectTrigger>
                          <SelectContent>
                            {GIROS.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.giro && <p className="text-xs text-destructive">{form.formState.errors.giro.message}</p>}
                  </FormItem>
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }: { field: ControllerRenderProps<FormValues, "descripcion"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Descripción</FormLabel>
                      <span className="text-xs" style={{ color: (field.value?.length ?? 0) < 20 ? "#4A4850" : "#7E7C86" }}>{field.value?.length ?? 0} / 500 (mín. 20)</span>
                    </div>
                    <FormControl>
                      <Textarea maxLength={500} className="min-h-20 resize-none text-sm focus-visible:ring-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mercadoObjetivo"
                render={({ field }: { field: ControllerRenderProps<FormValues, "mercadoObjetivo"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Mercado objetivo</FormLabel>
                      <span className="text-xs" style={{ color: (field.value?.length ?? 0) < 20 ? "#4A4850" : "#7E7C86" }}>{field.value?.length ?? 0} / 500 (mín. 20)</span>
                    </div>
                    <FormControl>
                      <Textarea maxLength={500} className="min-h-20 resize-none text-sm focus-visible:ring-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="inline-flex items-center gap-1.5 text-sm px-4 h-9 rounded-lg"
                  style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <Button
                  type="submit"
                  className="h-9 px-5 text-sm font-semibold border-0"
                  style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
                >
                  <Check className="w-3.5 h-3.5" /> Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            <div className="flex items-start gap-5">
              {logoActual ? (
                <button
                  type="button"
                  onClick={() => setLogoLightboxOpen(true)}
                  className="w-16 h-16 rounded-xl shrink-0 overflow-hidden cursor-zoom-in transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A62FA]"
                  title="Ver imagen completa"
                  aria-label="Ver imagen completa"
                >
                  <Image src={logoActual} alt={empresa.nombre} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                </button>
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: "rgba(154,98,250,0.12)", color: "#9A62FA" }}
                >
                  {empresa.nombre.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold break-words" style={{ color: "#F2F0F7", overflowWrap: "anywhere" }}>{empresa.nombre}</h1>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#7E7C86" }}>
                        {GIRO_LABELS[empresa.giro]}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ color: estadoConfig.color, backgroundColor: estadoConfig.bg }}>
                        {estadoConfig.label}
                      </span>
                    </div>
                  </div>
                  {puedeEditarProyecto && (
                    <button
                      onClick={() => setEditando(true)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 h-7 rounded-lg shrink-0 transition-colors"
                      style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px mt-5 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#4A4850" }}>Descripción</p>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: "#C4C2CC", overflowWrap: "anywhere" }}>{empresa.descripcion}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#4A4850" }}>Mercado objetivo</p>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: "#C4C2CC", overflowWrap: "anywhere" }}>{empresa.mercadoObjetivo}</p>
              </div>
            </div>

            <p className="text-xs mt-4" style={{ color: "#4A4850" }}>Creada el {empresa.creadaEn}</p>

            {!readOnly && empresa.estado === "borrador" && empresa.progreso?.tieneProducto && empresa.progreso?.tieneCanvas && empresa.progreso?.tieneHipotesis && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "#F2F0F7" }}>Proyecto listo para enviar</p>
                    <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
                      Completaste todos los requisitos: producto, canvas e hipótesis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      actualizarEmpresa(id, { estado: "pendiente_mentoria" });
                      toast.success(`"${empresa.nombre}" fue enviada a mentoría.`);
                    }}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 h-9 rounded-xl shrink-0 transition-opacity hover:opacity-90 w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "#FBFBFC" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar a mentoría
                  </button>
                </div>
              </>
            )}

            {!readOnly && empresa.estado === "observaciones_pendientes" && todosComentariosResueltos && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "#F2F0F7" }}>Cambios listos</p>
                    <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
                      Atendiste todos los comentarios del mentor. Envía tu proyecto para que los revise de nuevo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={enviarNuevamenteAlMentor}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 h-9 rounded-xl shrink-0 transition-opacity hover:opacity-90 w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "#FBFBFC" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar cambios
                  </button>
                </div>
              </>
            )}

            {permitirAsignaciones && (empresa.estado === "pendiente_mentoria" || empresa.estado === "pendiente_evaluacion") && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "#F2F0F7" }}>
                      {empresa.estado === "pendiente_mentoria" ? "Pendiente de asignar mentor" : "Pendiente de asignar evaluador"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
                      {empresa.estado === "pendiente_mentoria"
                        ? "Elige un mentor activo para comenzar la revisión."
                        : "Elige un evaluador activo para comenzar la evaluación."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirAsignar(empresa.estado === "pendiente_mentoria" ? "mentor" : "evaluador")}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 h-9 rounded-xl shrink-0 transition-opacity hover:opacity-90 w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    {empresa.estado === "pendiente_mentoria" ? "Asignar mentor" : "Asignar evaluador"}
                  </button>
                </div>
              </>
            )}

            {permitirComentarios && (empresa.estado === "en_mentoria" || empresa.estado === "observaciones_atendidas") && (listoParaEvaluacion || !todosComentariosResueltos) && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "#F2F0F7" }}>
                      {listoParaEvaluacion ? "Revisión completa" : "Envía la retroalimentación al emprendedor"}
                    </p>
                    {listoParaEvaluacion && (
                      <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
                        Validaste todas las hipótesis y no quedan observaciones pendientes.
                      </p>
                    )}
                  </div>
                  {listoParaEvaluacion ? (
                    <button
                      type="button"
                      onClick={enviarAEvaluacion}
                      className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 h-9 rounded-xl shrink-0 transition-opacity hover:opacity-90 w-full sm:w-auto"
                      style={{ background: "linear-gradient(135deg, #10B981 0%, #14B8A6 100%)", color: "#FBFBFC" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enviar a evaluación
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={enviarComentariosEmprendedor}
                      className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 h-9 rounded-xl shrink-0 transition-opacity hover:opacity-90 w-full sm:w-auto"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "#FBFBFC" }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Enviar comentarios
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Productos ── */}
      <SectionCard
        title="Productos"
        icon={Package}
        tienePendiente={productosTienenPendiente}
        action={
          puedeEditarProyecto && (empresa.productosList?.length ?? 0) === 0 ? (
            <Link
              href={`${basePath}/${id}/productos/nuevo`}
              className="inline-flex items-center gap-1.5 text-xs px-3 h-7 rounded-lg transition-colors"
              style={{ color: "#9A62FA", backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.2)" }}
            >
              <Plus className="w-3 h-3" /> Agregar producto
            </Link>
          ) : undefined
        }
      >
        {(() => {
          const count = empresa.productosList?.length ?? 0;
          return count === 0 ? (
            <p className="text-sm" style={{ color: "#7E7C86" }}>
              {puedeEditarProyecto ? "No tienes productos registrados aún." : "Esta empresa no tiene productos registrados."}
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold" style={{ color: "#F2F0F7" }}>{count}</span>
                <span className="text-sm" style={{ color: "#7E7C86" }}>
                  {count === 1 ? "producto registrado" : "productos registrados"}
                </span>
              </div>
              <Link
                href={`${basePath}/${id}/productos`}
                className="inline-flex items-center gap-1 text-xs transition-colors"
                style={{ color: "#9A62FA" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C687F5")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9A62FA")}
              >
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })()}
      </SectionCard>

      {/* ── Lean Canvas ── */}
      <SectionCard
        title="Lean Canvas"
        icon={LayoutTemplate}
        tienePendiente={canvasTienePendiente}
        action={
          <Link
            href={`${basePath}/${id}/canvas`}
            className="inline-flex items-center gap-1 text-xs transition-colors"
            style={{ color: "#9A62FA" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C687F5")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9A62FA")}
          >
            {!puedeEditarProyecto ? "Ver canvas" : (empresa.canvasBloques ?? 0) === 0 ? "Comenzar" : "Continuar"} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {empresa.estado === "borrador" && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: "#7E7C86" }}>
                {empresa.canvasBloques ?? 0} de {CANVAS_TOTAL} bloques completados
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: canvasPct === 100 ? "#10B981" : canvasPct > 0 ? "#9A62FA" : "#4A4850" }}
              >
                {canvasPct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${canvasPct}%`, backgroundColor: canvasPct === 100 ? "#10B981" : "#9A62FA" }}
              />
            </div>
            {puedeEditarProyecto && (empresa.canvasBloques ?? 0) === 0 && (
              <p className="text-xs mt-3" style={{ color: "#4A4850" }}>
                El Lean Canvas es un requisito para enviar tu empresa a evaluación.
              </p>
            )}
          </>
        )}
      </SectionCard>

      {/* ── Hipótesis ── */}
      <HipotesisSection
        empresaId={id}
        hipotesisList={empresa.hipotesisList ?? []}
        basePath={basePath}
        readOnly={readOnly}
        permitirComentarios={mentorPuedeComentar}
        ocultarCorreccionesPendientes={ocultarCorreccionesPendientes}
        autorNombre={autorNombre}
        estadoEmpresa={empresa.estado}
        puedeEditar={puedeEditarProyecto}
      />

      {/* Lightbox del logo */}
      <Dialog open={logoLightboxOpen} onOpenChange={setLogoLightboxOpen}>
        <DialogContent
          className="bg-transparent border-0 shadow-none p-0 max-w-[95vw] sm:max-w-[600px] ring-0"
        >
          <DialogTitle className="sr-only">Logo de {empresa.nombre}</DialogTitle>
          <DialogDescription className="sr-only">Vista ampliada del logo de la empresa.</DialogDescription>
          {logoActual && (
            <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
              <Image
                src={logoActual}
                alt={empresa.nombre}
                fill
                className="object-contain rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: asignar mentor/evaluador */}
      {permitirAsignaciones && (
        <Dialog open={asignarTipo !== null} onOpenChange={(open) => { if (!open) setAsignarTipo(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{asignarTipo === "mentor" ? "Asignar mentor" : "Asignar evaluador"}</DialogTitle>
              <DialogDescription>
                {asignarTipo ? `Elige un ${asignarTipo} activo para "${empresa.nombre}".` : ""}
              </DialogDescription>
            </DialogHeader>
            <Select value={usuarioSeleccionado} onValueChange={(v) => setUsuarioSeleccionado(v ?? "")}>
              <SelectTrigger className="w-full" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}>
                <SelectValue placeholder={`Selecciona un ${asignarTipo ?? ""}`} />
              </SelectTrigger>
              <SelectContent>
                {opcionesAsignables.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-center" style={{ color: "#7E7C86" }}>
                    No hay {asignarTipo === "mentor" ? "mentores" : "evaluadores"} activos.
                  </div>
                ) : (
                  opcionesAsignables.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAsignarTipo(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!usuarioSeleccionado}
                onClick={confirmarAsignar}
                className="border-0"
                style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
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

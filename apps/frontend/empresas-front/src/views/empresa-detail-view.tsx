"use client";

import { useEffect, useState, useRef } from "react";
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
  CheckCircle2, MessageSquare, Flag, MoreVertical, User,
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
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  useUsuariosStore,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import type { GiroEmpresa, EstadoEmpresa } from "@leanstart/commons";
import { compressImageToDataUrl, modoDemo, useAccion, useHasHydrated, ViewSkeleton, GIRO_LABELS, ESTADO_EMPRESA_CONFIG } from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import { useObservacionesStore, puedeVerObservaciones, mentorPuedeComentarEnEstado, emprendedorPuedeEditar } from "../store/observaciones";
import { ObservacionesButton } from "../components/observaciones-button";
import { useReportesEmpresaStore } from "../store/reportes-empresa";

const GIROS: { value: GiroEmpresa; label: string }[] = [
  { value: "tecnologia", label: "Tecnología" },
  { value: "educacion", label: "Educación" },
  { value: "salud", label: "Salud" },
  { value: "sustentabilidad", label: "Sustentabilidad" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "comercio", label: "Comercio" },
  { value: "servicios", label: "Servicios" },
];

const ESTADO_HIPOTESIS_CONFIG = {
  pendiente_validacion: { label: "Pendiente", color: "var(--text-dim)", bg: "var(--border-subtle)" },
  validada: { label: "Validada", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  invalidada: { label: "Invalidada", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
} as const;

const CANVAS_TOTAL = 9;

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  giro: z.enum(
    ["tecnologia", "educacion", "salud", "sustentabilidad", "alimentacion", "comercio", "servicios"],
    { error: "Selecciona un giro" }
  ),
  descripcion: z.string().min(20, "Mínimo 20 caracteres").max(500, "Máximo 500 caracteres"),
  mercadoObjetivo: z.string().min(20, "Mínimo 20 caracteres").max(500, "Máximo 500 caracteres"),
});

type FormValues = z.infer<typeof schema>;

/* ─── Tarjeta de sección ─── */
function SectionCard({ title, icon: Icon, action, children, tienePendiente, ocultarCuerpoSiVacio }: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  tienePendiente?: boolean;
  /** Cuando `children` no renderiza nada (p. ej. una condición que da `false`), no
   *  pinta el cuerpo con padding — evita un bloque vacío debajo del encabezado.
   *  Por defecto false para no cambiar el comportamiento de las demás secciones. */
  ocultarCuerpoSiVacio?: boolean;
}) {
  const hayCuerpo = !ocultarCuerpoSiVacio || Boolean(children);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="flex items-center justify-between gap-3 flex-wrap gap-y-2 px-4 md:px-6 py-4"
        style={{ borderBottom: hayCuerpo ? "1px solid var(--border-subtle)" : "none" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="relative w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)" }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
            {tienePendiente && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#EF4444", border: "2px solid var(--surface-profile)" }}
              />
            )}
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{title}</span>
        </div>
        {action}
      </div>
      {hayCuerpo && <div className="px-4 md:px-6 py-5">{children}</div>}
    </div>
  );
}

const FASE_CONFIG = {
  1: { label: "Creación",    color: "var(--text-dim)", bg: "var(--border-subtle)" },
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
  const borrado = useAccion();
  const limite = hipotesisList.length >= 3;
  const puedeVerObs = puedeVerObservaciones(estadoEmpresa, readOnly, Boolean(permitirComentarios));

  async function confirmDelete() {
    if (!deleteTarget) return;
    await borrado.ejecutar(
      async () => {
        await eliminarHipotesis(empresaId, deleteTarget.id);
        toast.success("Hipótesis eliminada.");
      },
      {
        etiqueta: "Eliminando hipótesis",
        onError: () => toast.error("No se pudo eliminar la hipótesis."),
      }
    );
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
            style={{ color: "var(--brand)", backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid var(--brand-tint-strong)" }}
          >
            <Plus className="w-3 h-3" /> Agregar hipótesis
          </Link>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>Máximo 3 hipótesis</span>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {hipotesisList.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
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
              style={{ backgroundColor: "var(--hover-surface-2)", border: "1px solid var(--border-subtle)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            >
              <span className="text-xs font-bold shrink-0 mt-0.5 w-5 text-center" style={{ color: "var(--text-faint)" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words" style={{ color: "var(--text-strong)", overflowWrap: "anywhere" }}>{h.titulo}</p>
                <p className="text-xs mt-0.5 leading-relaxed line-clamp-2 break-words" style={{ color: "var(--text-dim)", overflowWrap: "anywhere" }}>{h.descripcion}</p>
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
              <AlertDialogCancel disabled={borrado.cargando}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                loading={borrado.cargando}
                loadingText="Eliminando…"
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
  /** Contenido adicional al final de la página (p. ej. el formulario de evaluación del evaluador). */
  contenidoAdicional?: React.ReactNode;
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
  contenidoAdicional,
}: EmpresaDetailViewProps = {}) {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHasHydrated();
  const { empresas, actualizarEmpresa } = useEmpresasStore();
  const asignarMentor = useEmpresasStore((s) => s.asignarMentor);
  const asignarEvaluador = useEmpresasStore((s) => s.asignarEvaluador);
  const sincronizarLocal = useEmpresasStore((s) => s.sincronizarLocal);
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const observaciones = useObservacionesStore((s) => s.observaciones);
  const cerrarObservacionesDeEmpresa = useObservacionesStore((s) => s.cerrarObservacionesDeEmpresa);
  const cargarObservaciones = useObservacionesStore((s) => s.cargarObservaciones);
  const enviarRetroalimentacion = useObservacionesStore((s) => s.enviarRetroalimentacion);
  const marcarTodasAtendidas = useObservacionesStore((s) => s.marcarTodasAtendidas);
  const reportarEmpresa = useReportesEmpresaStore((s) => s.reportarEmpresa);
  const empresa = empresas.find((e) => e.id === id);

  useEffect(() => {
    if (!modoDemo()) cargarObservaciones(id).catch(() => toast.error("No se pudieron cargar las observaciones."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [editando, setEditando] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoLightboxOpen, setLogoLightboxOpen] = useState(false);
  const [asignarTipo, setAsignarTipo] = useState<TipoAsignacion | null>(null);
  const [reportarOpen, setReportarOpen] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const reporte = useAccion();
  const flujo = useAccion();       // enviar a mentoría / evaluación / comentarios
  const asignacion = useAccion();
  const guardado = useAccion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: empresa
      ? { nombre: empresa.nombre, giro: empresa.giro, descripcion: empresa.descripcion, mercadoObjetivo: empresa.mercadoObjetivo }
      : undefined,
  });

  // Mientras el store persistido rehidrata, `empresas` está vacío: sin esta
  // guarda toda entrada al detalle mostraba "Empresa no encontrada" por un
  // instante antes de pintar los datos reales.
  if (!hydrated) return <ViewSkeleton variante="detalle" ancho="max-w-5xl" />;

  if (!empresa) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "var(--text-dim)" }}>
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
        <div className="flex flex-col items-center text-center py-20">
          <AlertCircle className="w-10 h-10 mb-4" style={{ color: "var(--text-faint)" }} />
          <p className="text-base font-medium mb-1" style={{ color: "var(--text-strong)" }}>Empresa no encontrada</p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>Esta empresa no existe o fue eliminada.</p>
        </div>
      </div>
    );
  }

  const estadoConfig = ESTADO_EMPRESA_CONFIG[empresa.estado];
  // En vistas de consulta (Admin/Mentor/Evaluador) se muestra el emprendedor dueño de la empresa.
  const emprendedor = readOnly ? usuarios.find((u) => u.id === empresa.ownerId) : undefined;
  const logoActual = logoPreview ?? empresa.logoUrl;
  const nombreActual = form.watch("nombre") || empresa.nombre;
  const canvasPct = Math.round(((empresa.canvasBloques ?? 0) / CANVAS_TOTAL) * 100);

  // Progreso de la revisión del mentor: ¿ya se pronunció sobre todas las hipótesis y no dejó nada pendiente?
  const hipotesisList = empresa.hipotesisList ?? [];
  const todasHipotesisRevisadas = hipotesisList.length > 0 && hipotesisList.every((h) => h.estado === "validada" || h.estado === "invalidada");
  const observacionesEmpresa = observaciones.filter((o) => o.empresaId === id);
  // Un borrador sin enviar cuenta como "pendiente" para efectos de bloquear el avance:
  // no tendría sentido dejar pasar a evaluación con retroalimentación que el emprendedor
  // nunca llegó a ver.
  const hayObservacionesPendientes = observacionesEmpresa.some((o) => o.estado === "pendiente" || o.estado === "en_revision" || o.estado === "borrador");
  const listoParaEvaluacion = todasHipotesisRevisadas && !hayObservacionesPendientes;

  // El emprendedor solo puede editar/agregar/eliminar mientras el proyecto está en captura
  // o mientras le toca atender observaciones (el mentor o el evaluador se lo devolvieron).
  const puedeEditarProyecto = !readOnly && emprendedorPuedeEditar(empresa.estado);
  // El mentor puede comentar durante toda la mentoría (colaboración en vivo).
  const mentorPuedeComentar = permitirComentarios && mentorPuedeComentarEnEstado(empresa.estado);
  // Colaboración en vivo: el mentor ve las correcciones del emprendedor al instante.
  const ocultarCorreccionesPendientes = false;

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
  const todosComentariosResueltos = !observacionesEmpresa.some((o) => o.estado === "pendiente" || o.estado === "borrador");

  async function enviarAMentoria() {
    await flujo.ejecutar(
      async () => {
        await actualizarEmpresa(id, { estado: "pendiente_mentoria" });
        toast.success(`"${empresa?.nombre}" fue enviada a mentoría.`);
      },
      {
        etiqueta: "Enviando a mentoría",
        onError: () => toast.error("No se pudo enviar la empresa a mentoría."),
      }
    );
  }

  async function enviarAEvaluacion() {
    await flujo.ejecutar(
      async () => {
        await actualizarEmpresa(id, { estado: "pendiente_evaluacion" });
        await cerrarObservacionesDeEmpresa(id);
        toast.success(`"${empresa?.nombre}" fue enviada a evaluación.`);
      },
      {
        etiqueta: "Enviando a evaluación",
        onError: () => toast.error("No se pudo enviar la empresa a evaluación."),
      }
    );
  }

  async function enviarComentariosEmprendedor() {
    await flujo.ejecutar(
      async () => {
        // Libera los borradores del mentor (recién ahí el emprendedor los ve) y de paso
        // mueve el estado del proyecto — antes esto solo hacía lo segundo, porque los
        // comentarios ya eran visibles al instante desde que se creaban.
        const estado = await enviarRetroalimentacion(id);
        // Sin esto, el store de empresas se queda con el estado viejo en memoria (el cambio
        // real lo hizo el backend dentro de "enviar", no una llamada a actualizarEmpresa) y
        // el botón "Enviar comentarios" sigue visible/clickeable hasta recargar — pudiendo
        // mandarlo dos veces.
        if (estado) sincronizarLocal(id, { estado });
        toast.success(`Se enviaron los comentarios a "${empresa?.nombre}".`);
      },
      {
        etiqueta: "Enviando comentarios",
        onError: () => toast.error("No se pudieron enviar los comentarios."),
      }
    );
  }

  async function enviarNuevamenteAlMentor() {
    await flujo.ejecutar(
      async () => {
        // OJO: antes esto llamaba a actualizarEmpresa(id, {estado}) — pero UpdateEmpresaDto
        // no tiene campo "estado", así que el ValidationPipe lo descartaba en silencio y el
        // proyecto nunca avanzaba de estado por esta vía. marcarTodasAtendidas() sí lo hace
        // (y de paso marca las observaciones y notifica al mentor una sola vez).
        const estado = await marcarTodasAtendidas(id);
        if (estado) sincronizarLocal(id, { estado });
        toast.success(`"${empresa?.nombre}" fue enviada nuevamente al mentor.`);
      },
      {
        etiqueta: "Enviando al mentor",
        onError: () => toast.error("No se pudo enviar al mentor."),
      }
    );
  }

  async function enviarReporte() {
    if (motivoReporte.trim().length < 10) {
      toast.error("Describe el motivo con al menos 10 caracteres.");
      return;
    }
    await reporte.ejecutar(
      async () => {
        await reportarEmpresa(id, autorNombre ?? "Usuario", motivoReporte.trim());
        toast.success("Reporte enviado. El administrador lo revisará.");
        setReportarOpen(false);
        setMotivoReporte("");
      },
      {
        etiqueta: "Enviando reporte",
        onError: () => toast.error("No se pudo enviar el reporte."),
      }
    );
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
      const dataUrl = await compressImageToDataUrl(file, { maxDimension: 512, mimeType: "image/png" });
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

  async function onSubmit(values: FormValues) {
    await guardado.ejecutar(
      async () => {
        await actualizarEmpresa(id, { ...values, logoUrl: logoPreview ?? empresa?.logoUrl });
        toast.success("Empresa actualizada correctamente.");
        setLogoPreview(null);
        setEditando(false);
      },
      {
        etiqueta: "Guardando empresa",
        onError: () => toast.error("No se pudo actualizar la empresa."),
      }
    );
  }

  function abrirAsignar(tipo: TipoAsignacion) {
    setAsignarTipo(tipo);
    setUsuarioSeleccionado((tipo === "mentor" ? empresa?.mentorId : empresa?.evaluadorId) ?? "");
  }

  async function confirmarAsignar() {
    if (!asignarTipo || !usuarioSeleccionado) return;
    const usuario = usuarios.find((u) => u.id === usuarioSeleccionado);
    await asignacion.ejecutar(
      async () => {
        if (asignarTipo === "mentor") {
          await asignarMentor(id, usuarioSeleccionado);
        } else {
          await asignarEvaluador(id, usuarioSeleccionado);
        }
        toast.success(`${asignarTipo === "mentor" ? "Mentor" : "Evaluador"} "${usuario?.nombre}" asignado.`);
      },
      {
        etiqueta: "Asignando",
        onError: () => toast.error("No se pudo completar la asignación."),
      }
    );
    setAsignarTipo(null);
  }

  const opcionesAsignables = asignarTipo
    ? usuarios.filter((u) => u.rol === asignarTipo && u.estado === "activo")
    : [];

  // Cualquiera con acceso pero que no sea el dueño ni el administrador puede reportar
  // (mentor/evaluador revisando un proyecto ajeno) — el admin ya tiene control directo.
  const puedeReportar = readOnly && !permitirAsignaciones;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
        {puedeReportar && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  style={{ color: "var(--text-dim)" }}
                  aria-label="Más acciones"
                />
              }
            >
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setReportarOpen(true)}>
                <Flag className="w-3.5 h-3.5" /> Reportar empresa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Información general ── */}
      <div
        className="rounded-2xl p-4 md:p-6"
        style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
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
                        <Image src={logoActual} alt="Logo" fill className="object-contain p-1.5" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-bold" style={{ color: "var(--brand)" }}>{nombreActual.charAt(0).toUpperCase()}</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "var(--shell-header)" }}>
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
                        <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Nombre</FormLabel>
                        <FormControl>
                          <Input className="h-9 text-sm focus-visible:ring-0" style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }} {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormItem className="gap-1.5">
                    <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Giro</FormLabel>
                    <Controller
                      control={form.control}
                      name="giro"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} items={GIROS}>
                          <SelectTrigger className="w-full h-9 text-sm focus-visible:ring-0" style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}>
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

              <div className="h-px" style={{ backgroundColor: "var(--border-subtle)" }} />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }: { field: ControllerRenderProps<FormValues, "descripcion"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Descripción</FormLabel>
                      <span className="text-xs" style={{ color: (field.value?.length ?? 0) < 20 ? "var(--text-faint)" : "var(--text-dim)" }}>{field.value?.length ?? 0} / 500 (mín. 20)</span>
                    </div>
                    <FormControl>
                      <Textarea maxLength={500} className="min-h-20 resize-none text-sm focus-visible:ring-0" style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }} {...field} />
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
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Mercado objetivo</FormLabel>
                      <span className="text-xs" style={{ color: (field.value?.length ?? 0) < 20 ? "var(--text-faint)" : "var(--text-dim)" }}>{field.value?.length ?? 0} / 500 (mín. 20)</span>
                    </div>
                    <FormControl>
                      <Textarea maxLength={500} className="min-h-20 resize-none text-sm focus-visible:ring-0" style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-1">
                <Button
                  type="button"
                  onClick={cancelarEdicion}
                  disabled={guardado.cargando}
                  className="h-9 px-4 text-sm"
                  style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={guardado.cargando}
                  loadingText="Guardando…"
                  className="h-9 px-5 text-sm font-semibold border-0"
                  style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
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
                  style={{ backgroundColor: "var(--brand-tint)" }}
                  title="Ver imagen completa"
                  aria-label="Ver imagen completa"
                >
                  <Image src={logoActual} alt={empresa.nombre} width={64} height={64} className="object-contain w-full h-full p-2" unoptimized />
                </button>
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand)" }}
                >
                  {empresa.nombre.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold break-words" style={{ color: "var(--text-strong)", overflowWrap: "anywhere" }}>{empresa.nombre}</h1>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--border-subtle)", color: "var(--text-dim)" }}>
                        {GIRO_LABELS[empresa.giro]}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ color: estadoConfig.color, backgroundColor: estadoConfig.bg }}>
                        {estadoConfig.label}
                      </span>
                    </div>
                    {emprendedor && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <User className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
                        <span className="text-xs" style={{ color: "var(--text-dim)" }}>{emprendedor.nombre}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {typeof empresa.scoreFinal === "number" && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold leading-none whitespace-nowrap" style={{ color: "var(--brand)" }}>
                          {empresa.scoreFinal}%
                        </span>
                        {empresa.nivelNombre && (
                          <span
                            className="text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ color: empresa.nivelColor ?? "#9A62FA", backgroundColor: `${empresa.nivelColor ?? "#9A62FA"}1F` }}
                          >
                            {empresa.nivelNombre}
                          </span>
                        )}
                      </div>
                    )}
                    <ObservacionesButton
                      empresaId={id}
                      tipoElemento="general"
                      elementoId={id}
                      puedeComentar={mentorPuedeComentar}
                      puedeMarcarEnRevision={!readOnly}
                      puedeVer={puedeVerObs}
                      ocultarCorreccionesPendientes={ocultarCorreccionesPendientes}
                      autorNombre={autorNombre}
                    />
                    {puedeEditarProyecto && (
                      <button
                        onClick={() => setEditando(true)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 h-7 rounded-lg transition-colors"
                        style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px mt-5 mb-5" style={{ backgroundColor: "var(--border-subtle)" }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Descripción</p>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: "var(--muted-foreground)", overflowWrap: "anywhere" }}>{empresa.descripcion}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Mercado objetivo</p>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: "var(--muted-foreground)", overflowWrap: "anywhere" }}>{empresa.mercadoObjetivo}</p>
              </div>
            </div>

            <p className="text-xs mt-4" style={{ color: "var(--text-faint)" }}>Creada el {empresa.creadaEn}</p>

            {!readOnly && (empresa.estado === "borrador" || empresa.estado === "devuelto") && empresa.progreso?.tieneProducto && empresa.progreso?.tieneCanvas && empresa.progreso?.tieneHipotesis && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "var(--border-subtle)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>
                      {empresa.estado === "devuelto" ? "Proyecto listo para reenviar" : "Proyecto listo para enviar"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                      {empresa.estado === "devuelto"
                        ? "Corrige lo que indicó el evaluador y vuelve a enviarlo a mentoría."
                        : "Completaste todos los requisitos: producto, canvas e hipótesis."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={enviarAMentoria}
                    loading={flujo.cargando}
                    loadingText="Enviando…"
                    className="h-9 px-4 text-sm font-semibold rounded-xl border-0 shrink-0 justify-center w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "var(--brand-fg)" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar a mentoría
                  </Button>
                </div>
              </>
            )}

            {!readOnly && empresa.estado === "observaciones_pendientes" && todosComentariosResueltos && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "var(--border-subtle)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>Cambios listos</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                      Atendiste todos los comentarios del mentor. Envía tu proyecto para que los revise de nuevo.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={enviarNuevamenteAlMentor}
                    loading={flujo.cargando}
                    loadingText="Enviando…"
                    className="h-9 px-4 text-sm font-semibold rounded-xl border-0 shrink-0 justify-center w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "var(--brand-fg)" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar cambios
                  </Button>
                </div>
              </>
            )}

            {permitirAsignaciones && (empresa.estado === "pendiente_mentoria" || empresa.estado === "pendiente_evaluacion") && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "var(--border-subtle)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>
                      {empresa.estado === "pendiente_mentoria" ? "Pendiente de asignar mentor" : "Pendiente de asignar evaluador"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                      {empresa.estado === "pendiente_mentoria"
                        ? "Elige un mentor activo para comenzar la revisión."
                        : "Elige un evaluador activo para comenzar la evaluación."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirAsignar(empresa.estado === "pendiente_mentoria" ? "mentor" : "evaluador")}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 h-9 rounded-xl shrink-0 transition-opacity hover:opacity-90 w-full sm:w-auto"
                    style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    {empresa.estado === "pendiente_mentoria" ? "Asignar mentor" : "Asignar evaluador"}
                  </button>
                </div>
              </>
            )}

            {permitirComentarios && (empresa.estado === "en_mentoria" || empresa.estado === "observaciones_atendidas") && (listoParaEvaluacion || !todosComentariosResueltos) && (
              <>
                <div className="h-px mt-5 mb-4" style={{ backgroundColor: "var(--border-subtle)" }} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>
                      {listoParaEvaluacion ? "Revisión completa" : "Envía la retroalimentación al emprendedor"}
                    </p>
                    {listoParaEvaluacion && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                        Validaste todas las hipótesis y no quedan observaciones pendientes.
                      </p>
                    )}
                  </div>
                  {listoParaEvaluacion ? (
                    <Button
                      type="button"
                      onClick={enviarAEvaluacion}
                      loading={flujo.cargando}
                      loadingText="Enviando…"
                      className="h-9 px-4 text-sm font-semibold rounded-xl border-0 shrink-0 justify-center w-full sm:w-auto"
                      style={{ background: "linear-gradient(135deg, #10B981 0%, #14B8A6 100%)", color: "var(--brand-fg)" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enviar a evaluación
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={enviarComentariosEmprendedor}
                      loading={flujo.cargando}
                      loadingText="Enviando…"
                      className="h-9 px-4 text-sm font-semibold rounded-xl border-0 shrink-0 justify-center w-full sm:w-auto"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "var(--brand-fg)" }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Enviar comentarios
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Productos y servicios ── */}
      <SectionCard
        title="Productos y servicios"
        icon={Package}
        tienePendiente={productosTienenPendiente}
      >
        {(() => {
          const count = empresa.productosList?.length ?? 0;
          return count === 0 ? (
            puedeEditarProyecto ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>No tienes productos ni servicios registrados aún.</p>
                <Link
                  href={`${basePath}/${id}/productos`}
                  className="inline-flex items-center gap-1 text-xs transition-colors shrink-0"
                  style={{ color: "var(--brand)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand-accent)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand)")}
                >
                  Agregar <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>Esta empresa no tiene productos ni servicios registrados.</p>
            )
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold" style={{ color: "var(--text-strong)" }}>{count}</span>
                <span className="text-sm" style={{ color: "var(--text-dim)" }}>
                  {count === 1 ? "producto o servicio" : "productos y servicios"}
                </span>
              </div>
              <Link
                href={`${basePath}/${id}/productos`}
                className="inline-flex items-center gap-1 text-xs transition-colors shrink-0"
                style={{ color: "var(--brand)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand-accent)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand)")}
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
        ocultarCuerpoSiVacio
        action={
          <Link
            href={`${basePath}/${id}/canvas`}
            className="inline-flex items-center gap-1 text-xs transition-colors"
            style={{ color: "var(--brand)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand-accent)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand)")}
          >
            {!puedeEditarProyecto ? "Ver canvas" : (empresa.canvasBloques ?? 0) === 0 ? "Comenzar" : "Continuar"} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {empresa.estado === "borrador" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: "var(--text-dim)" }}>
                {empresa.canvasBloques ?? 0} de {CANVAS_TOTAL} bloques completados
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: canvasPct === 100 ? "#10B981" : canvasPct > 0 ? "var(--brand)" : "var(--text-faint)",
                  backgroundColor: canvasPct === 100 ? "rgba(16,185,129,0.12)" : canvasPct > 0 ? "var(--brand-tint)" : "var(--border-subtle)",
                }}
              >
                {canvasPct}%
              </span>
            </div>
            {/* Un segmento por bloque del canvas en vez de una sola barra continua —
                da una idea más concreta de cuántos de los 9 faltan de un vistazo. */}
            <div className="flex gap-1.5">
              {Array.from({ length: CANVAS_TOTAL }, (_, i) => {
                const completado = i < (empresa.canvasBloques ?? 0);
                return (
                  <div
                    key={i}
                    className="flex-1 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: completado ? (canvasPct === 100 ? "#10B981" : "var(--brand-gradient)") : "var(--border-subtle)",
                    }}
                  />
                );
              })}
            </div>
            {puedeEditarProyecto && (empresa.canvasBloques ?? 0) === 0 && (
              <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
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

      {contenidoAdicional}

      {/* Lightbox del logo */}
      <Dialog open={logoLightboxOpen} onOpenChange={setLogoLightboxOpen}>
        <DialogContent
          className="bg-transparent border-0 shadow-none p-0 max-w-[95vw] sm:max-w-[600px] ring-0"
        >
          <DialogTitle className="sr-only">Logo de {empresa.nombre}</DialogTitle>
          <DialogDescription className="sr-only">Vista ampliada del logo de la empresa.</DialogDescription>
          {logoActual && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoActual}
              alt={empresa.nombre}
              className="block mx-auto w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-2xl"
              style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
            />
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
            <Select
              value={usuarioSeleccionado}
              onValueChange={(v) => setUsuarioSeleccionado(v ?? "")}
              items={usuarios.map((u) => ({ value: u.id, label: u.nombre }))}
            >
              <SelectTrigger className="w-full" style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}>
                <SelectValue placeholder={`Selecciona un ${asignarTipo ?? ""}`} />
              </SelectTrigger>
              <SelectContent>
                {opcionesAsignables.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-center" style={{ color: "var(--text-dim)" }}>
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
                loading={asignacion.cargando}
                loadingText="Asignando…"
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

      <Dialog open={reportarOpen} onOpenChange={(open) => { setReportarOpen(open); if (!open) setMotivoReporte(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar empresa</DialogTitle>
            <DialogDescription>
              Cuéntale al administrador por qué &quot;{empresa.nombre}&quot; necesita revisión.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivoReporte}
            onChange={(e) => setMotivoReporte(e.target.value)}
            placeholder="Describe el motivo del reporte (mínimo 10 caracteres)..."
            rows={4}
            maxLength={500}
            className="resize-none text-sm"
            style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReportarOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={motivoReporte.trim().length < 10}
              loading={reporte.cargando}
              loadingText="Enviando…"
              onClick={enviarReporte}
              className="border-0"
              style={{ background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)", color: "#fff" }}
            >
              <Flag className="w-3.5 h-3.5" />
              Enviar reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

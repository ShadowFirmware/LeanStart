"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, ExternalLink, X as XIcon, Lightbulb, FlaskConical, BarChart3,
  CheckCircle2, XCircle, Type, AlignLeft, Target, Paperclip, Flag, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { fileToDataUrl, compressImageToDataUrl } from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import { puedeVerObservaciones, mentorPuedeComentarEnEstado, emprendedorPuedeEditar } from "../store/observaciones";
import { ObservacionesButton } from "../components/observaciones-button";
import { EvidenciaViewerButton, EvidenciaThumb } from "../components/evidencia-viewer";
import { HipotesisWizard } from "../components/hipotesis-wizard";
import { detectarDocumentoSubtipo, DOCUMENTO_SUBTIPO_LABEL } from "../lib/documento-tipo";
import type { TipoExperimento, EstadoHipotesis } from "@leanstart/commons";
import type { TipoEvidencia } from "../store/empresas";

const TIPOS_EXPERIMENTO: { value: TipoExperimento; label: string; descripcion: string }[] = [
  { value: "encuesta",          label: "Encuesta",          descripcion: "Preguntas a un grupo de personas" },
  { value: "entrevista",        label: "Entrevista",        descripcion: "Conversación con usuarios" },
  { value: "landing_page",      label: "Landing page",      descripcion: "Página para medir interés" },
  { value: "prototipo",         label: "Prototipo",         descripcion: "Versión simplificada del producto" },
  { value: "prueba_de_mercado", label: "Prueba de mercado", descripcion: "Venta o prueba real" },
  { value: "otro",              label: "Otro",              descripcion: "Otro tipo de experimento" },
];

const TIPO_EXPERIMENTO_LABELS: Record<TipoExperimento, string> = Object.fromEntries(
  TIPOS_EXPERIMENTO.map((t) => [t.value, t.label])
) as Record<TipoExperimento, string>;

const ESTADO_HIPOTESIS_CONFIG = {
  pendiente_validacion: { label: "Pendiente", color: "var(--text-dim)", bg: "var(--border-subtle)" },
  validada: { label: "Validada", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  invalidada: { label: "Invalidada", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
} as const;

const FASE_CONFIG = {
  1: { label: "Creación",    color: "var(--text-dim)", bg: "var(--border-subtle)" },
  2: { label: "Experimento", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  3: { label: "Completa",    color: "#10B981", bg: "rgba(16,185,129,0.12)" },
} as const;

const MAX_TITULO = 120;
const MAX_TEXTAREA = 400;

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--hover-surface)",
  border: "1px solid var(--border-hair)",
  color: "var(--text-strong)",
};

function Label({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5" style={{ color: "var(--text-dim)" }}>
      {Icon && <Icon className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />}
      {children}
    </p>
  );
}

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="flex items-center gap-2.5 px-4 md:px-6 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)" }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{title}</span>
      </div>
      <div className="px-4 md:px-6 py-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function ReadField({ icon, label, value }: { icon?: React.ElementType; label: string; value?: string }) {
  const tieneValor = Boolean(value && value.trim());
  return (
    <div>
      <Label icon={icon}>{label}</Label>
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap break-words"
        style={{ color: tieneValor ? "var(--muted-foreground)" : "var(--text-faint)", overflowWrap: "anywhere" }}
      >
        {tieneValor ? value : "Sin información"}
      </p>
    </div>
  );
}

interface HipotesisEditViewProps {
  basePath?: string;
  readOnly?: boolean;
  /** Cuando es true, permite dejar observaciones en esta hipótesis (uso exclusivo del mentor). */
  permitirComentarios?: boolean;
  autorNombre?: string;
}

export function HipotesisEditView({
  basePath = "/emprendedor/empresas",
  readOnly = false,
  permitirComentarios = false,
  autorNombre,
}: HipotesisEditViewProps = {}) {
  const { id, hid } = useParams<{ id: string; hid: string }>();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const hipotesis = useMemo(
    () => empresa?.hipotesisList?.find((h) => h.id === hid),
    [empresa, hid]
  );
  const actualizarHipotesis = useEmpresasStore((s) => s.actualizarHipotesis);

  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fase 1
  const [titulo, setTitulo] = useState(hipotesis?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(hipotesis?.descripcion ?? "");
  const [tipoExp, setTipoExp] = useState<TipoExperimento | "">(hipotesis?.experimento?.tipo ?? "");

  // Fase 2
  const [descExp, setDescExp]   = useState(hipotesis?.experimento?.descripcion ?? "");
  const [objetivo, setObjetivo] = useState(hipotesis?.experimento?.objetivo ?? "");
  const [criterio, setCriterio] = useState(hipotesis?.experimento?.criterioExito ?? "");
  const [fechaObj, setFechaObj] = useState(hipotesis?.experimento?.fechaObjetivo ?? "");

  // Fase 3
  const [resultado, setResultado]       = useState(hipotesis?.resultados?.resultado ?? "");
  const [tipoEvidencia, setTipoEvidencia] = useState<TipoEvidencia | "">(hipotesis?.resultados?.tipoEvidencia ?? "");
  const [evidenciaDataUrl, setEvidenciaDataUrl] = useState(
    hipotesis?.resultados?.tipoEvidencia && hipotesis.resultados.tipoEvidencia !== "url"
      ? (hipotesis.resultados.evidencia ?? "")
      : ""
  );
  const [evidenciaNombre, setEvidenciaNombre] = useState(hipotesis?.resultados?.evidenciaNombre ?? "");
  const [evidenciaUrl, setEvidenciaUrl] = useState(
    hipotesis?.resultados?.tipoEvidencia === "url"
      ? (hipotesis.resultados.evidencia ?? "")
      : ""
  );
  const [conclusion, setConclusion]     = useState(hipotesis?.resultados?.conclusion ?? "");

  function resetForm() {
    if (!hipotesis) return;
    setTitulo(hipotesis.titulo);
    setDescripcion(hipotesis.descripcion);
    setTipoExp(hipotesis.experimento?.tipo ?? "");
    setDescExp(hipotesis.experimento?.descripcion ?? "");
    setObjetivo(hipotesis.experimento?.objetivo ?? "");
    setCriterio(hipotesis.experimento?.criterioExito ?? "");
    setFechaObj(hipotesis.experimento?.fechaObjetivo ?? "");
    setResultado(hipotesis.resultados?.resultado ?? "");
    setTipoEvidencia(hipotesis.resultados?.tipoEvidencia ?? "");
    setEvidenciaDataUrl(
      hipotesis.resultados?.tipoEvidencia && hipotesis.resultados.tipoEvidencia !== "url"
        ? (hipotesis.resultados.evidencia ?? "")
        : ""
    );
    setEvidenciaNombre(hipotesis.resultados?.evidenciaNombre ?? "");
    setEvidenciaUrl(hipotesis.resultados?.tipoEvidencia === "url" ? (hipotesis.resultados.evidencia ?? "") : "");
    setConclusion(hipotesis.resultados?.conclusion ?? "");
  }

  function entrarEdicion() {
    resetForm();
    setEditando(true);
  }

  function cancelarEdicion() {
    resetForm();
    setEditando(false);
  }

  async function handleEvidenciaFile(file: File) {
    // Validar tamaño (máx 3MB para PDFs/imágenes)
    if (file.size > 3 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 3MB.");
      return;
    }
    try {
      const dataUrl = file.type.startsWith("image/")
        ? await compressImageToDataUrl(file)
        : await fileToDataUrl(file);
      setEvidenciaDataUrl(dataUrl);
      setEvidenciaNombre(file.name);
      toast.success(`Archivo "${file.name}" cargado.`);
    } catch {
      toast.error("No se pudo leer el archivo.");
    }
  }

  function limpiarEvidencia() {
    setEvidenciaDataUrl("");
    setEvidenciaNombre("");
    setEvidenciaUrl("");
  }

  if (!empresa || !hipotesis) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <Link href={`${basePath}/${id}`} className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "var(--text-dim)" }}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>Esta hipótesis no existe o fue eliminada.</p>
      </div>
    );
  }

  async function cambiarEstadoHipotesis(estado: EstadoHipotesis) {
    const LABELS: Record<EstadoHipotesis, string> = {
      pendiente_validacion: "marcada como pendiente",
      validada: "validada",
      invalidada: "invalidada",
    };
    try {
      await actualizarHipotesis(id, hid, { estado });
      toast.success(`Hipótesis ${LABELS[estado]}.`);
    } catch {
      toast.error("No se pudo actualizar el estado de la hipótesis.");
    }
  }

  async function guardar() {
    if (!titulo.trim() || titulo.trim().length < 5) {
      toast.error("El título es requerido (mín. 5 caracteres).");
      return;
    }
    if (!descripcion.trim() || descripcion.trim().length < 15) {
      toast.error("La descripción es requerida (mín. 15 caracteres).");
      return;
    }
    if (!tipoExp) {
      toast.error("Selecciona un tipo de experimento.");
      return;
    }

    const evidenciaFinal = tipoEvidencia === "url" ? evidenciaUrl.trim() : evidenciaDataUrl;

    // Calcular nueva fase basada en qué tan completo está
    const tieneFase2 = descExp.trim() && objetivo.trim() && criterio.trim();
    const tieneFase3 = resultado.trim() && conclusion.trim();
    const nuevaFase: 1 | 2 | 3 = tieneFase3 ? 3 : tieneFase2 ? 2 : 1;

    setLoading(true);
    try {
      await actualizarHipotesis(id, hid, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        experimento: {
          tipo: tipoExp as TipoExperimento,
          descripcion: descExp.trim(),
          objetivo: objetivo.trim(),
          criterioExito: criterio.trim(),
          fechaObjetivo: fechaObj || undefined,
        },
        resultados: tieneFase3 ? {
          resultado: resultado.trim(),
          evidencia: evidenciaFinal || undefined,
          evidenciaNombre: tipoEvidencia !== "url" ? evidenciaNombre || undefined : undefined,
          tipoEvidencia: (tipoEvidencia as TipoEvidencia) || undefined,
          conclusion: conclusion.trim(),
        } : undefined,
        fase: nuevaFase,
      });
      toast.success("Hipótesis actualizada correctamente.");
      setEditando(false);
    } catch {
      toast.error("No se pudo actualizar la hipótesis.");
    } finally {
      setLoading(false);
    }
  }

  const estadoCfg = ESTADO_HIPOTESIS_CONFIG[hipotesis.estado] ?? ESTADO_HIPOTESIS_CONFIG.pendiente_validacion;
  const fase = (hipotesis.fase ?? 1) as 1 | 2 | 3;
  const faseCfg = FASE_CONFIG[fase];
  // Una vez que el mentor se pronuncia, el emprendedor ya no puede editar esta hipótesis.
  const bloqueadaPorMentor = hipotesis.estado === "validada" || hipotesis.estado === "invalidada";
  // El emprendedor solo puede editar mientras el proyecto está en captura o le toca atender observaciones.
  const puedeEditarProyecto = !readOnly && emprendedorPuedeEditar(empresa.estado);
  // El mentor puede comentar/validar durante toda la mentoría (colaboración en vivo).
  const mentorPuedeComentar = Boolean(permitirComentarios) && mentorPuedeComentarEnEstado(empresa.estado);
  // Colaboración en vivo: el mentor ve las correcciones del emprendedor al instante.
  const ocultarCorreccionesPendientes = false;
  const puedeVerObs = puedeVerObservaciones(empresa.estado, readOnly, Boolean(permitirComentarios));

  // Hipótesis aún no finalizada (nunca se presionó "Finalizar" en el paso 3): el
  // emprendedor retoma el mismo wizard de fases usado al crearla, en vez del
  // formulario plano de una sola página (que solo aplica a hipótesis completas).
  const estaFinalizada = fase === 3;
  if (!estaFinalizada && puedeEditarProyecto && !bloqueadaPorMentor) {
    return <HipotesisWizard empresaId={id} empresaNombre={empresa.nombre} hipotesisExistente={hipotesis} />;
  }

  if (!editando || !puedeEditarProyecto || bloqueadaPorMentor) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <Link
          href={`${basePath}/${id}`}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="truncate max-w-[180px] md:max-w-none">{empresa.nombre}</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-words" style={{ color: "var(--text-strong)" }}>{hipotesis.titulo}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {empresa.estado === "borrador" && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: faseCfg.color, backgroundColor: faseCfg.bg }}>
                  Fase {fase}: {faseCfg.label}
                </span>
              )}
              {fase === 3 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: estadoCfg.color, backgroundColor: estadoCfg.bg }}>
                  {estadoCfg.label}
                </span>
              )}
            </div>
          </div>
          <ObservacionesButton
            empresaId={id}
            tipoElemento="hipotesis"
            elementoId={hid}
            puedeComentar={mentorPuedeComentar}
            puedeMarcarEnRevision={!readOnly}
            puedeVer={puedeVerObs}
            ocultarCorreccionesPendientes={ocultarCorreccionesPendientes}
            autorNombre={autorNombre}
          />
          {puedeEditarProyecto && !bloqueadaPorMentor && (
            <button
              type="button"
              onClick={entrarEdicion}
              className="inline-flex items-center justify-center gap-2 text-sm px-4 h-9 rounded-lg shrink-0 transition-colors"
              style={{ color: "var(--brand)", border: "1px solid rgba(154,98,250,0.3)", backgroundColor: "rgba(154,98,250,0.08)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.08)")}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard title="Creación" icon={Lightbulb}>
            <ReadField icon={Type} label="Título" value={hipotesis.titulo} />
            <ReadField icon={AlignLeft} label="Descripción" value={hipotesis.descripcion} />
            <ReadField
              icon={FlaskConical}
              label="Tipo de experimento"
              value={hipotesis.experimento?.tipo ? TIPO_EXPERIMENTO_LABELS[hipotesis.experimento.tipo] : undefined}
            />
          </SectionCard>

          <SectionCard title="Diseño del experimento" icon={FlaskConical}>
            {hipotesis.experimento ? (
              <>
                <ReadField icon={AlignLeft} label="Descripción del experimento" value={hipotesis.experimento.descripcion} />
                <ReadField icon={Target} label="Objetivo" value={hipotesis.experimento.objetivo} />
                <ReadField icon={CheckCircle2} label="Criterio de éxito" value={hipotesis.experimento.criterioExito} />
                {hipotesis.experimento.fechaObjetivo && (
                  <ReadField icon={Calendar} label="Fecha objetivo" value={hipotesis.experimento.fechaObjetivo} />
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>Aún no se ha diseñado el experimento.</p>
            )}
          </SectionCard>

          <SectionCard title="Resultados" icon={BarChart3}>
            {hipotesis.resultados ? (
              <>
                <ReadField icon={BarChart3} label="Resultado" value={hipotesis.resultados.resultado} />
                {hipotesis.resultados.evidencia && (
                  <div>
                    <Label icon={Paperclip}>Evidencia</Label>
                    {hipotesis.resultados.tipoEvidencia === "url" ? (
                      <a
                        href={hipotesis.resultados.evidencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 text-sm min-w-0"
                        style={{ color: "var(--brand-accent)" }}
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="break-words" style={{ overflowWrap: "anywhere" }}>{hipotesis.resultados.evidencia}</span>
                      </a>
                    ) : (
                      <EvidenciaViewerButton
                        evidencia={hipotesis.resultados.evidencia}
                        tipoEvidencia={hipotesis.resultados.tipoEvidencia!}
                        evidenciaNombre={hipotesis.resultados.evidenciaNombre}
                        className="rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-colors"
                        style={{ backgroundColor: "rgba(154,98,250,0.06)", border: "1px solid var(--brand-tint-strong)" }}
                      >
                        <EvidenciaThumb
                          tipoEvidencia={hipotesis.resultados.tipoEvidencia!}
                          evidencia={hipotesis.resultados.evidencia}
                          evidenciaNombre={hipotesis.resultados.evidenciaNombre}
                        />
                        <p className="flex-1 min-w-0 text-sm font-medium truncate" style={{ color: "var(--text-strong)" }}>
                          {hipotesis.resultados.evidenciaNombre || "Archivo cargado"}
                        </p>
                      </EvidenciaViewerButton>
                    )}
                  </div>
                )}
                <ReadField icon={Flag} label="Conclusión" value={hipotesis.resultados.conclusion} />
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>Aún no hay resultados registrados.</p>
            )}
          </SectionCard>

          {/* Validación del mentor */}
          {readOnly && mentorPuedeComentar && fase === 3 && (
            <div
              className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>Validación de la hipótesis</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                  Evalúa la evidencia presentada y define el estado de esta hipótesis.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={hipotesis.estado === "invalidada"}
                  onClick={() => cambiarEstadoHipotesis("invalidada")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
                  style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  <XCircle className="w-3.5 h-3.5" /> Invalidar
                </button>
                <button
                  type="button"
                  disabled={hipotesis.estado === "validada"}
                  onClick={() => cambiarEstadoHipotesis("validada")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 border-0"
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #14B8A6 100%)", color: "#FBFBFC" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={cancelarEdicion}
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="truncate max-w-[180px] md:max-w-none">{empresa.nombre}</span>
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold break-words" style={{ color: "var(--text-strong)" }}>Editar hipótesis</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Actualiza cualquier campo. Los cambios se guardan al dar &quot;Guardar cambios&quot;.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Sección Creación */}
        <SectionCard title="Creación" icon={Lightbulb}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={Type}>Título</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{titulo.length} / {MAX_TITULO}</span>
            </div>
            <input
              type="text"
              value={titulo}
              maxLength={MAX_TITULO}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={AlignLeft}>Descripción</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{descripcion.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={descripcion}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>

          <div>
            <Label icon={FlaskConical}>Tipo de experimento</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TIPOS_EXPERIMENTO.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipoExp(t.value)}
                  className="rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    backgroundColor: tipoExp === t.value ? "rgba(154,98,250,0.15)" : "var(--hover-surface-2)",
                    border: tipoExp === t.value ? "1px solid rgba(154,98,250,0.4)" : "1px solid var(--border-hair)",
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: tipoExp === t.value ? "var(--brand-accent)" : "var(--text-strong)" }}>
                    {t.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-dim)" }}>{t.descripcion}</p>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Sección Experimento */}
        <SectionCard title="Diseño del experimento" icon={FlaskConical}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={AlignLeft}>Descripción del experimento</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{descExp.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={descExp}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setDescExp(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={Target}>Objetivo</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{objetivo.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={objetivo}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setObjetivo(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={CheckCircle2}>Criterio de éxito</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{criterio.length} / 200</span>
            </div>
            <input
              type="text"
              value={criterio}
              maxLength={200}
              onChange={(e) => setCriterio(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>
        </SectionCard>

        {/* Sección Resultados */}
        <SectionCard title="Resultados" icon={BarChart3}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={BarChart3}>Resultado</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{resultado.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={resultado}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setResultado(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={Paperclip}>Evidencia</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>Opcional</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {(["pdf", "imagen", "documento", "url"] as TipoEvidencia[]).map((t) => {
                const labels: Record<TipoEvidencia, string> = {
                  pdf: "Archivo PDF", imagen: "Imagen", documento: "Word / Excel", url: "URL",
                };
                const active = tipoEvidencia === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTipoEvidencia(active ? "" : t); limpiarEvidencia(); }}
                    className="text-[11px] px-2.5 h-7 rounded-full font-medium transition-all"
                    style={{
                      color: active ? "var(--brand-accent)" : "var(--text-dim)",
                      backgroundColor: active ? "rgba(154,98,250,0.15)" : "var(--hover-surface)",
                      border: active ? "1px solid rgba(154,98,250,0.35)" : "1px solid var(--border-hair)",
                    }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {tipoEvidencia === "url" && (
              <input
                type="url"
                placeholder="https://..."
                value={evidenciaUrl}
                maxLength={300}
                onChange={(e) => setEvidenciaUrl(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
              />
            )}

            {tipoEvidencia && tipoEvidencia !== "url" && !evidenciaDataUrl && (
              <label
                className="flex items-center gap-3 rounded-lg px-4 h-10 cursor-pointer transition-colors"
                style={{
                  backgroundColor: "var(--hover-surface-2)",
                  border: "1px dashed var(--border-hair)",
                }}
              >
                <span className="text-sm truncate" style={{ color: "var(--text-dim)" }}>
                  Seleccionar archivo…
                </span>
                <input
                  type="file"
                  accept={
                    tipoEvidencia === "pdf" ? ".pdf"
                    : tipoEvidencia === "imagen" ? "image/*"
                    : ".doc,.docx,.xls,.xlsx,.csv"
                  }
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEvidenciaFile(file);
                  }}
                />
              </label>
            )}

            {/* Preview del archivo cargado */}
            {tipoEvidencia && tipoEvidencia !== "url" && evidenciaDataUrl && (
              <div
                className="rounded-xl p-3 flex items-start gap-3"
                style={{ backgroundColor: "rgba(154,98,250,0.06)", border: "1px solid var(--brand-tint-strong)" }}
              >
                <EvidenciaThumb
                  tipoEvidencia={tipoEvidencia as TipoEvidencia}
                  evidencia={evidenciaDataUrl}
                  evidenciaNombre={evidenciaNombre}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words" style={{ color: "var(--text-strong)", overflowWrap: "anywhere" }}>
                    {evidenciaNombre || "Archivo cargado"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                    {tipoEvidencia === "imagen" ? "Imagen" : tipoEvidencia === "pdf" ? "PDF" : DOCUMENTO_SUBTIPO_LABEL[detectarDocumentoSubtipo(evidenciaNombre)]}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <EvidenciaViewerButton
                      evidencia={evidenciaDataUrl}
                      tipoEvidencia={tipoEvidencia as TipoEvidencia}
                      evidenciaNombre={evidenciaNombre}
                    />
                    <label
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 h-7 rounded-md cursor-pointer transition-colors"
                      style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
                    >
                      Reemplazar
                      <input
                        type="file"
                        accept={
                          tipoEvidencia === "pdf" ? ".pdf"
                          : tipoEvidencia === "imagen" ? "image/*"
                          : ".doc,.docx,.xls,.xlsx,.csv"
                        }
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleEvidenciaFile(file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={limpiarEvidencia}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 h-7 rounded-md transition-colors"
                      style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <XIcon className="w-3 h-3" /> Quitar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label icon={Flag}>Conclusión</Label>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{conclusion.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={conclusion}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setConclusion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={cancelarEdicion}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 text-sm px-5 h-9 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "var(--text-strong)", backgroundColor: "var(--border-subtle)", border: "1px solid var(--border-hair)" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={loading}
            className="h-9 px-6 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

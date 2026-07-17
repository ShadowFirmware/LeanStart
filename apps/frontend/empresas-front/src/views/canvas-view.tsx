"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertCircle, Lightbulb, Sparkles, Lock, Users,
  BarChart2, Share2, TrendingDown, TrendingUp, Plus, X,
} from "lucide-react";
import { toast } from "sonner";
import { modoDemo } from "@leanstart/commons";
import { useEmpresasStore, type CanvasData, DEFAULT_CANVAS } from "../store/empresas";
import { useObservacionesStore, puedeVerObservaciones, mentorPuedeComentarEnEstado, emprendedorPuedeEditar } from "../store/observaciones";
import { ObservacionesButton } from "../components/observaciones-button";

/* ─── Colores por bloque ─── */
const C = {
  problema:          "#8A1A5E",
  solucion:          "#1A6A3A",
  metricasClave:     "#0A4A5C",
  pvp:               "#5C18A0",
  ventajaInjusta:    "#9A5A10",
  canales:           "#8A2810",
  segmentosClientes: "#103E8A",
  estructuraCostos:  "#28108A",
  fuentesIngresos:   "#105C8A",
};

type BlockKey = keyof CanvasData;

/* ─── Límites de texto por tipo de bloque ─── */
const MAX_SINGLE = 400;     // textareas de bloques "single" (Solución, PVP, Ventaja injusta)
const MAX_LIST_ITEM = 100;  // cada item de bloques "multi" (Problema, Segmentos, etc.)

/* ─── Metadata de cada bloque ─── */
const BLOCK_META: Record<BlockKey, {
  icon: React.ElementType;
  title: string;
  hint: string;
  color: string;
  type: "single" | "multi";
  max?: number;
  placeholder: string;
}> = {
  problema:          { icon: AlertCircle,  title: "Problema",                color: C.problema,          type: "multi",  max: 3, hint: "Lista los 3 principales problemas de tus clientes",          placeholder: "Ej. Alto costo de los servicios actuales" },
  solucion:          { icon: Lightbulb,    title: "Solución",                color: C.solucion,          type: "single",         hint: "Las características más importantes de tu solución",         placeholder: "Describe las características principales de tu solución..." },
  pvp:               { icon: Sparkles,     title: "Propuesta de valor única",color: C.pvp,               type: "single",         hint: "Mensaje claro que distingue tu oferta de todas las demás",  placeholder: "Ej. La única plataforma que permite a emprendedores..." },
  ventajaInjusta:    { icon: Lock,         title: "Ventaja injusta",         color: C.ventajaInjusta,    type: "single",         hint: "Algo que no puede ser copiado o comprado fácilmente",       placeholder: "Ej. Acceso exclusivo a datos de..." },
  segmentosClientes: { icon: Users,        title: "Segmentos de clientes",   color: C.segmentosClientes, type: "multi",  max: 5, hint: "Clientes y usuarios objetivo",                              placeholder: "Ej. Estudiantes universitarios 18-24 años" },
  metricasClave:     { icon: BarChart2,    title: "Métricas clave",          color: C.metricasClave,     type: "multi",  max: 5, hint: "Indicadores que reflejan el estado de tu negocio",         placeholder: "Ej. Usuarios activos diarios" },
  canales:           { icon: Share2,       title: "Canales",                 color: C.canales,           type: "multi",  max: 5, hint: "Rutas para llegar a tus clientes",                         placeholder: "Ej. Redes sociales" },
  estructuraCostos:  { icon: TrendingDown, title: "Estructura de costos",    color: C.estructuraCostos,  type: "multi",  max: 8, hint: "Costos fijos y variables principales",                     placeholder: "Ej. Servidores cloud ($500/mes)" },
  fuentesIngresos:   { icon: TrendingUp,   title: "Fuentes de ingresos",     color: C.fuentesIngresos,   type: "multi",  max: 5, hint: "Cómo y cuánto cobra tu empresa",                           placeholder: "Ej. Suscripción mensual $99" },
};

/* ─── Bloque del canvas ─── */
function Block({
  icon: Icon, title, hint, color, style, children, onClick, tieneComentarioPendiente,
}: {
  icon: React.ElementType; title: string; hint: string; color: string;
  style?: React.CSSProperties; children?: React.ReactNode; onClick?: () => void;
  tieneComentarioPendiente?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        backgroundColor: color,
        borderRadius: 14,
        padding: "20px 20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        ...style,
        border: `2px solid ${onClick && hovered ? "rgba(255,255,255,0.3)" : "transparent"}`,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s",
      }}
    >
      {tieneComentarioPendiente && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#EF4444",
            border: "2px solid rgba(0,0,0,0.2)",
          }}
        />
      )}
      <Icon size={18} color="rgba(255,255,255,0.85)" strokeWidth={2} />
      <div>
        <p style={{ color: "white", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.3 }}>
          {title}
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
          {hint}
        </p>
      </div>
      {children}
    </div>
  );
}

/* ─── Contenido guardado dentro del bloque ─── */
function BlockContent({ blockKey, canvas }: { blockKey: BlockKey; canvas: CanvasData }) {
  const meta = BLOCK_META[blockKey];
  if (meta.type === "single") {
    const value = canvas[blockKey] as string;
    if (!value.trim()) return null;
    return (
      <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 1.6, marginTop: 2, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 8, overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {value.length > 150 ? value.slice(0, 150) + "…" : value}
      </p>
    );
  }
  const items = (canvas[blockKey] as string[]).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <ul style={{ margin: "2px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 1.4, display: "flex", gap: 5, alignItems: "flex-start", minWidth: 0 }}>
          <span style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>·</span>
          <span style={{ overflowWrap: "anywhere", wordBreak: "break-word", minWidth: 0, flex: 1 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const GAP = 6;

interface CanvasViewProps {
  basePath?: string;
  readOnly?: boolean;
  /** Cuando es true, permite dejar observaciones por bloque (uso exclusivo del mentor). */
  permitirComentarios?: boolean;
  autorNombre?: string;
}

/* ─── Página ─── */
export function CanvasView({
  basePath = "/emprendedor/empresas",
  readOnly = false,
  permitirComentarios = false,
  autorNombre,
}: CanvasViewProps = {}) {
  const { id } = useParams<{ id: string }>();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const actualizarCanvas = useEmpresasStore((s) => s.actualizarCanvas);
  const observaciones = useObservacionesStore((s) => s.observaciones);
  const cargarObservaciones = useObservacionesStore((s) => s.cargarObservaciones);

  const [openBlock, setOpenBlock] = useState<BlockKey | null>(null);
  const [draft, setDraft] = useState<string | string[]>("");

  useEffect(() => {
    if (!modoDemo()) cargarObservaciones(id).catch(() => toast.error("No se pudieron cargar las observaciones."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!empresa) return null;

  const canvas = empresa.canvas ?? DEFAULT_CANVAS;
  const canvasBloques = empresa.canvasBloques ?? 0;
  const pct = Math.round((canvasBloques / 9) * 100);

  // El emprendedor solo puede editar mientras el proyecto está en captura o le toca atender observaciones.
  const puedeEditar = !readOnly && emprendedorPuedeEditar(empresa.estado);
  // El mentor puede comentar durante toda la mentoría (colaboración en vivo).
  const mentorPuedeComentar = permitirComentarios && mentorPuedeComentarEnEstado(empresa.estado);
  // Colaboración en vivo: el mentor ve las correcciones del emprendedor al instante.
  const ocultarCorreccionesPendientes = false;
  const puedeVerObs = puedeVerObservaciones(empresa.estado, readOnly, permitirComentarios);

  function tieneComentarioPendiente(key: BlockKey) {
    if (!puedeVerObs) return false;
    return observaciones.some((o) => {
      if (o.empresaId !== id || o.tipoElemento !== "canvas" || o.elementoId !== key) return false;
      // Mentor: solo le corresponde revisar lo que el emprendedor ya marcó como resuelto, y solo cuando es su turno.
      if (permitirComentarios) return mentorPuedeComentar && o.estado === "en_revision";
      // Emprendedor: solo le corresponde atender lo que el mentor dejó pendiente.
      if (!readOnly) return o.estado === "pendiente";
      // Otros roles de solo consulta (admin/evaluador): cualquier cosa aún sin cerrar.
      return o.estado === "pendiente" || o.estado === "en_revision";
    });
  }

  function handleOpen(key: BlockKey) {
    const meta = BLOCK_META[key];
    if (meta.type === "multi") {
      const val = canvas[key] as string[];
      setDraft(val.length > 0 ? [...val] : [""]);
    } else {
      setDraft(canvas[key] as string);
    }
    setOpenBlock(key);
  }

  async function handleSave() {
    if (!openBlock) return;
    const meta = BLOCK_META[openBlock];
    const value = meta.type === "multi"
      ? (draft as string[]).filter((s) => s.trim())
      : draft as string;
    try {
      await actualizarCanvas(id, { [openBlock]: value });
    } catch {
      toast.error("No se pudo guardar el bloque del canvas.");
    }
    setOpenBlock(null);
  }

  const openMeta = openBlock ? BLOCK_META[openBlock] : null;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-5">
        <Link
          href={`${basePath}/${id}`}
          className="inline-flex items-center gap-2 text-sm mb-5 transition-colors"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
        >
          <ArrowLeft className="w-4 h-4" /> {empresa.nombre}
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-strong)" }}>Lean Canvas</h1>
            {empresa.estado === "borrador" && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
                {canvasBloques} de 9 bloques completados
              </p>
            )}
          </div>
          {empresa.estado === "borrador" && (
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--brand)" }} />
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>{pct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="max-w-5xl mx-auto overflow-x-auto">
        <div style={{ minWidth: 820 }}>

          {/* Filas 1–2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gridTemplateRows: "minmax(210px, 1fr) minmax(155px, 1fr)", gap: GAP }}>

            {/* Col 1: Problema (span 2 filas) */}
            <div style={{ gridRow: "1 / 3", display: "flex", flexDirection: "column", gap: GAP }}>
              <Block icon={AlertCircle} title="Problema" hint={BLOCK_META.problema.hint} color={C.problema} style={{ flex: 1 }} onClick={() => handleOpen("problema")} tieneComentarioPendiente={tieneComentarioPendiente("problema")}>
                <BlockContent blockKey="problema" canvas={canvas} />
              </Block>
            </div>

            {/* Col 2 fila 1: Solución */}
            <Block icon={Lightbulb} title="Solución" hint={BLOCK_META.solucion.hint} color={C.solucion} style={{ gridRow: 1 }} onClick={() => handleOpen("solucion")} tieneComentarioPendiente={tieneComentarioPendiente("solucion")}>
              <BlockContent blockKey="solucion" canvas={canvas} />
            </Block>

            {/* Col 3: PVP (span 2 filas) */}
            <div style={{ gridRow: "1 / 3", display: "flex", flexDirection: "column", gap: GAP }}>
              <Block icon={Sparkles} title="Propuesta de valor única" hint={BLOCK_META.pvp.hint} color={C.pvp} style={{ flex: 1 }} onClick={() => handleOpen("pvp")} tieneComentarioPendiente={tieneComentarioPendiente("pvp")}>
                <BlockContent blockKey="pvp" canvas={canvas} />
              </Block>
            </div>

            {/* Col 4 fila 1: Ventaja injusta */}
            <Block icon={Lock} title="Ventaja injusta" hint={BLOCK_META.ventajaInjusta.hint} color={C.ventajaInjusta} style={{ gridRow: 1 }} onClick={() => handleOpen("ventajaInjusta")} tieneComentarioPendiente={tieneComentarioPendiente("ventajaInjusta")}>
              <BlockContent blockKey="ventajaInjusta" canvas={canvas} />
            </Block>

            {/* Col 5: Segmentos (span 2 filas) */}
            <div style={{ gridRow: "1 / 3", display: "flex", flexDirection: "column", gap: GAP }}>
              <Block icon={Users} title="Segmentos de clientes" hint={BLOCK_META.segmentosClientes.hint} color={C.segmentosClientes} style={{ flex: 1 }} onClick={() => handleOpen("segmentosClientes")} tieneComentarioPendiente={tieneComentarioPendiente("segmentosClientes")}>
                <BlockContent blockKey="segmentosClientes" canvas={canvas} />
              </Block>
            </div>

            {/* Col 2 fila 2: Métricas clave */}
            <Block icon={BarChart2} title="Métricas clave" hint={BLOCK_META.metricasClave.hint} color={C.metricasClave} style={{ gridRow: 2 }} onClick={() => handleOpen("metricasClave")} tieneComentarioPendiente={tieneComentarioPendiente("metricasClave")}>
              <BlockContent blockKey="metricasClave" canvas={canvas} />
            </Block>

            {/* Col 4 fila 2: Canales */}
            <Block icon={Share2} title="Canales" hint={BLOCK_META.canales.hint} color={C.canales} style={{ gridRow: 2 }} onClick={() => handleOpen("canales")} tieneComentarioPendiente={tieneComentarioPendiente("canales")}>
              <BlockContent blockKey="canales" canvas={canvas} />
            </Block>
          </div>

          {/* Fila 3: Costos + Ingresos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginTop: GAP }}>
            <Block icon={TrendingDown} title="Estructura de costos" hint={BLOCK_META.estructuraCostos.hint} color={C.estructuraCostos} style={{ minHeight: 170 }} onClick={() => handleOpen("estructuraCostos")} tieneComentarioPendiente={tieneComentarioPendiente("estructuraCostos")}>
              <BlockContent blockKey="estructuraCostos" canvas={canvas} />
            </Block>
            <Block icon={TrendingUp} title="Fuentes de ingresos" hint={BLOCK_META.fuentesIngresos.hint} color={C.fuentesIngresos} style={{ minHeight: 170 }} onClick={() => handleOpen("fuentesIngresos")} tieneComentarioPendiente={tieneComentarioPendiente("fuentesIngresos")}>
              <BlockContent blockKey="fuentesIngresos" canvas={canvas} />
            </Block>
          </div>

        </div>
      </div>

      {/* Modal */}
      {openBlock && openMeta && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenBlock(null); }}
        >
          <div style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-hair)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: openMeta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <openMeta.icon size={17} color="rgba(255,255,255,0.9)" />
                </div>
                <div>
                  <p style={{ color: "var(--text-strong)", fontWeight: 700, fontSize: 14 }}>{openMeta.title}</p>
                  <p style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 2 }}>{openMeta.hint}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ObservacionesButton
                  empresaId={id}
                  tipoElemento="canvas"
                  elementoId={openBlock}
                  puedeComentar={mentorPuedeComentar}
                  puedeMarcarEnRevision={!readOnly}
                  puedeVer={puedeVerObs}
                  ocultarCorreccionesPendientes={ocultarCorreccionesPendientes}
                  autorNombre={autorNombre}
                />
                <button
                  onClick={() => setOpenBlock(null)}
                  style={{ color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-strong)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            {!puedeEditar ? (
              openMeta.type === "single" ? (
                (draft as string).trim() ? (
                  <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {draft as string}
                  </p>
                ) : (
                  <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Sin información registrada.</p>
                )
              ) : (draft as string[]).filter((v) => v.trim()).length > 0 ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {(draft as string[]).filter((v) => v.trim()).map((item, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: "var(--text-faint)", flexShrink: 0 }}>·</span>
                      <span style={{ overflowWrap: "anywhere" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Sin información registrada.</p>
              )
            ) : openMeta.type === "single" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <textarea
                  value={draft as string}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={openMeta.placeholder}
                  rows={6}
                  maxLength={MAX_SINGLE}
                  style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", borderRadius: 12, padding: "12px 14px", color: "var(--text-strong)", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.45)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
                />
                <p style={{ color: "var(--text-faint)", fontSize: 11, textAlign: "right" }}>
                  {(draft as string).length} / {MAX_SINGLE}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(draft as string[]).map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      value={item}
                      maxLength={MAX_LIST_ITEM}
                      onChange={(e) => setDraft((prev) => (prev as string[]).map((v, idx) => idx === i ? e.target.value : v))}
                      placeholder={openMeta.placeholder}
                      style={{ flex: 1, minWidth: 0, backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", borderRadius: 10, padding: "9px 12px", color: "var(--text-strong)", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.45)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
                    />
                    {(draft as string[]).length > 1 && (
                      <button
                        onClick={() => setDraft((prev) => (prev as string[]).filter((_, idx) => idx !== i))}
                        style={{ color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {openMeta.max && (draft as string[]).length < openMeta.max ? (
                  <button
                    onClick={() => setDraft((prev) => [...(prev as string[]), ""])}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", backgroundColor: "rgba(154,98,250,0.07)", border: "1px dashed rgba(154,98,250,0.25)", borderRadius: 10, color: "var(--brand)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <Plus size={13} /> Agregar
                    <span style={{ color: "var(--text-faint)", marginLeft: "auto" }}>{(draft as string[]).length}/{openMeta.max}</span>
                  </button>
                ) : (
                  <p style={{ color: "var(--text-faint)", fontSize: 11, textAlign: "center" }}>
                    Límite de {openMeta.max} elementos alcanzado
                  </p>
                )}
              </div>
            )}

            {/* Modal footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {!puedeEditar ? (
                <button
                  onClick={() => setOpenBlock(null)}
                  style={{ padding: "8px 18px", backgroundColor: "var(--border-subtle)", border: "1px solid var(--border-hair)", borderRadius: 10, color: "var(--text-strong)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Cerrar
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setOpenBlock(null)}
                    style={{ padding: "8px 18px", backgroundColor: "var(--border-subtle)", border: "1px solid var(--border-hair)", borderRadius: 10, color: "var(--text-strong)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    style={{ padding: "8px 20px", background: "var(--brand-gradient)", border: "none", borderRadius: 10, color: "var(--brand-fg)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Guardar
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

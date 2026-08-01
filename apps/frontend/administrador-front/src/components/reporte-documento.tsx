"use client";

import { useRef, useState } from "react";
import { Printer, Download, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { Empresa, CanvasData } from "@leanstart/empresas-front";
import { GIRO_LABELS, type ReporteCalculo } from "../lib/reporte";

const CANVAS_BLOCKS: { key: keyof CanvasData; label: string }[] = [
  { key: "problema", label: "Problema" },
  { key: "solucion", label: "Solución" },
  { key: "pvp", label: "Propuesta de valor única" },
  { key: "ventajaInjusta", label: "Ventaja injusta" },
  { key: "segmentosClientes", label: "Segmentos de clientes" },
  { key: "metricasClave", label: "Métricas clave" },
  { key: "canales", label: "Canales" },
  { key: "estructuraCostos", label: "Estructura de costos" },
  { key: "fuentesIngresos", label: "Fuentes de ingresos" },
];

// Paleta clara para el documento (se ve bien en pantalla y al imprimir).
const INK = "#1A1626";
const MUTED = "#6B6580";
const LINE = "#E4E0EC";
const ACCENT = "#7C3AED";

const SUBLABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MUTED,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  marginBottom: 6,
};

function canvasValor(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
  const t = (v ?? "").trim();
  return t ? [t] : [];
}

interface ReporteDocumentoProps {
  tipo: "boleta" | "canvas";
  empresa: Empresa;
  /** Nombre del emprendedor dueño de la empresa (resuelto desde su ownerId). */
  autorEmpresa: string;
  calculo: ReporteCalculo;
  comentarioEvaluador: string;
  /** true si este reporte ya quedó registrado en el historial (se reabrió desde ahí) —
   *  en ese caso no tiene sentido ofrecer "Guardar reporte"/"Cancelar" de nuevo. */
  guardado: boolean;
  /** Solo aplica cuando !guardado: registra el reporte en el historial. */
  onGuardar: () => Promise<void>;
  onClose: () => void;
}

/** Nombre de archivo seguro a partir del nombre de la empresa. */
function nombreArchivo(empresa: Empresa, esBoleta: boolean): string {
  const base = empresa.nombre.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "empresa";
  return `${base}-${esBoleta ? "boleta-evaluacion" : "reporte-canvas"}.pdf`;
}

export function ReporteDocumento({ tipo, empresa, autorEmpresa, calculo, comentarioEvaluador, guardado, onGuardar, onClose }: ReporteDocumentoProps) {
  const esBoleta = tipo === "boleta";
  const printRef = useRef<HTMLDivElement>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function descargarPDF() {
    if (!printRef.current || generandoPdf) return;
    setGenerandoPdf(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#FFFFFF" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(nombreArchivo(empresa, esBoleta));
    } catch {
      toast.error("No se pudo generar el PDF.");
    } finally {
      setGenerandoPdf(false);
    }
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      await onGuardar();
      toast.success("Reporte guardado en el historial.");
      onClose();
    } catch {
      toast.error("No se pudo guardar el reporte.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="print-overlay fixed inset-0 z-[100] overflow-y-auto"
      style={{ backgroundColor: "var(--shell-header)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Toolbar (no se imprime) */}
      <div
        className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3"
        style={{ backgroundColor: "var(--surface-profile)", borderBottom: "1px solid var(--border-hair)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
          {esBoleta ? "Boleta de evaluación" : "Reporte Lean Canvas"} · {empresa.nombre}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 h-9 rounded-lg"
            style={{ backgroundColor: "transparent", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            type="button"
            onClick={descargarPDF}
            disabled={generandoPdf}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 h-9 rounded-lg border-0 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            <Download className="w-4 h-4" /> {generandoPdf ? "Generando..." : "Descargar PDF"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ color: "var(--text-strong)", backgroundColor: "var(--border-subtle)" }}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Documento (papel) */}
      <div className="flex flex-col items-center px-3 py-6">
        <div
          ref={printRef}
          className="print-area w-full max-w-[820px] rounded-lg"
          style={{ backgroundColor: "#FFFFFF", color: INK, padding: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4" style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 16 }}>
            <div className="flex items-center gap-4 min-w-0">
              {empresa.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={empresa.logoUrl}
                  alt={empresa.nombre}
                  style={{
                    width: 56, height: 56, borderRadius: 12, padding: 6, boxSizing: "border-box",
                    objectFit: "contain", background: "#F1ECFB", border: `1px solid ${LINE}`,
                  }}
                />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "#F1ECFB", color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24 }}>
                  {empresa.nombre.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: ACCENT, fontWeight: 600 }}>
                  LeanStart · {esBoleta ? "Boleta de evaluación" : "Reporte Lean Canvas"}
                </p>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "2px 0 0", wordBreak: "break-word" }}>{empresa.nombre}</h1>
                <p style={{ fontSize: 13, color: MUTED }}>{GIRO_LABELS[empresa.giro]}</p>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>
              <p>Emprendedor: {autorEmpresa}</p>
              <p style={{ marginTop: 2 }}>Creada el {empresa.creadaEn}</p>
            </div>
          </div>

          {esBoleta ? (
            <BoletaBody empresa={empresa} calculo={calculo} />
          ) : (
            <CanvasBody empresa={empresa} comentarioEvaluador={comentarioEvaluador} calculo={calculo} />
          )}

          {/* Pie */}
          <div style={{ marginTop: 28, paddingTop: 12, borderTop: `1px solid ${LINE}`, fontSize: 10, color: MUTED, textAlign: "center" }}>
            Documento generado por LeanStart · Plataforma de validación de ideas de negocio
          </div>
        </div>

        {/* Guardar / Cancelar: solo mientras el reporte todavía no quedó en el historial.
            Fuera del papel (no forma parte del documento ni se imprime/descarga). */}
        {!guardado && (
          <div
            className="no-print w-full max-w-[820px] flex items-center justify-end gap-3 mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 h-10 rounded-xl"
              style={{ backgroundColor: "transparent", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 h-10 rounded-xl border-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar reporte"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── BOLETA ─────────────────────────── */
function BoletaBody({ empresa, calculo }: { empresa: Empresa; calculo: ReporteCalculo }) {
  const datos = [
    { label: "Título", value: empresa.nombre },
    { label: "Categoría", value: GIRO_LABELS[empresa.giro] },
    { label: "Descripción", value: empresa.descripcion },
    { label: "Mercado objetivo", value: empresa.mercadoObjetivo },
  ];

  const scores = [
    { label: "Evaluación", value: calculo.scoreEvaluacion, sub: "Criterios ponderados" },
    { label: "Hipótesis", value: calculo.scoreHipotesis, sub: `${calculo.hipotesis.validadas}/${calculo.hipotesis.total} validadas` },
    { label: "Calificación final", value: calculo.scoreFinal, sub: `${calculo.pesoEvaluacion}% eval · ${100 - calculo.pesoEvaluacion}% hip.`, destacado: true },
  ];

  return (
    <>
      {/* Datos principales */}
      <SectionTitle>Datos principales</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        {datos.map((d) => (
          <div key={d.label} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, fontSize: 13 }}>
            <span style={{ color: MUTED, fontWeight: 600 }}>{d.label}</span>
            <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{d.value || "—"}</span>
          </div>
        ))}
      </div>

      {/* Criterios de evaluación */}
      <SectionTitle>Criterios de evaluación</SectionTitle>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: MUTED, borderBottom: `1px solid ${LINE}` }}>
            <th style={{ padding: "6px 8px", fontWeight: 600 }}>Criterio</th>
            <th style={{ padding: "6px 8px", fontWeight: 600, width: 70, textAlign: "center" }}>Peso</th>
            <th style={{ padding: "6px 8px", fontWeight: 600, width: 140 }}>Calificación</th>
          </tr>
        </thead>
        <tbody>
          {calculo.criterios.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: "10px 8px", color: MUTED }}>No hay criterios configurados.</td></tr>
          ) : calculo.criterios.map((c) => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${LINE}` }}>
              <td style={{ padding: "8px", wordBreak: "break-word" }}>{c.nombre}</td>
              <td style={{ padding: "8px", textAlign: "center", color: MUTED }}>{c.peso}%</td>
              <td style={{ padding: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: "#EFEAF9", overflow: "hidden" }}>
                    <div style={{ width: `${c.puntaje}%`, height: "100%", background: ACCENT }} />
                  </div>
                  <span style={{ fontWeight: 700, width: 36, textAlign: "right" }}>{c.puntaje}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calificaciones */}
      <SectionTitle>Calificación y viabilidad</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {scores.map((s) => (
          <div key={s.label} style={{ border: `1px solid ${s.destacado ? ACCENT : LINE}`, background: s.destacado ? "#F5F0FE" : "#FFFFFF", borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: MUTED, fontWeight: 600 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.destacado ? ACCENT : INK, lineHeight: 1.1, margin: "4px 0" }}>{s.value}%</p>
            <p style={{ fontSize: 11, color: MUTED }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Viabilidad */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>Nivel de viabilidad</span>
        {calculo.nivel ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: calculo.nivel.color }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: calculo.nivel.color }} />
            {calculo.nivel.nombre}
          </span>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 700 }}>—</span>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────── LEAN CANVAS ─────────────────────────── */
function CanvasBody({ empresa, comentarioEvaluador, calculo }: {
  empresa: Empresa;
  comentarioEvaluador: string;
  calculo: ReporteCalculo;
}) {
  const canvas = empresa.canvas;
  const comentariosPorCriterio = calculo.criterios.filter((c) => c.comentario.trim());

  return (
    <>
      {/* Datos base */}
      <div style={{ marginTop: 18, marginBottom: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
        <div>
          <p style={{ color: MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Descripción</p>
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{empresa.descripcion || "—"}</p>
        </div>
        <div>
          <p style={{ color: MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Mercado objetivo</p>
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{empresa.mercadoObjetivo || "—"}</p>
        </div>
      </div>

      <SectionTitle>Lean Canvas</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CANVAS_BLOCKS.map((b) => {
          const valores = canvas ? canvasValor(canvas[b.key]) : [];
          return (
            <div key={b.key} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, breakInside: "avoid" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{b.label}</p>
              {valores.length === 0 ? (
                <p style={{ fontSize: 12, color: MUTED }}>—</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5 }}>
                  {valores.map((v, i) => (
                    <li key={i} style={{ marginBottom: 3, wordBreak: "break-word" }}>{v}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Comentarios: todos los comentarios dejados sobre la empresa */}
      <SectionTitle>Comentarios</SectionTitle>

      {/* Comentario general del evaluador */}
      <p style={SUBLABEL}>Comentario general del evaluador</p>
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, background: "#FAF8FF", breakInside: "avoid" }}>
        {comentarioEvaluador.trim() ? (
          <p style={{ fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>{comentarioEvaluador}</p>
        ) : (
          <p style={{ fontSize: 13, color: MUTED }}>El evaluador no dejó un comentario general.</p>
        )}
      </div>

      {/* Comentarios por criterio del evaluador */}
      {comentariosPorCriterio.length > 0 && (
        <>
          <p style={{ ...SUBLABEL, marginTop: 16 }}>Comentarios por criterio del evaluador</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {comentariosPorCriterio.map((c) => (
              <div key={c.id} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, breakInside: "avoid" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: INK, wordBreak: "break-word" }}>{c.nombre}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, whiteSpace: "nowrap" }}>{c.puntos} / {c.peso}</span>
                </div>
                <p style={{ fontSize: 12.5, color: "#43405A", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>{c.comentario}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "#1A1626", margin: "26px 0 12px", paddingBottom: 4, borderBottom: "1px solid #E4E0EC" }}>
      {children}
    </h2>
  );
}

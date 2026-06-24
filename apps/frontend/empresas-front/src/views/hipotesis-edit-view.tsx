"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, FileText, ExternalLink, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  fileToDataUrl,
} from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import type { TipoExperimento } from "@leanstart/commons";
import type { TipoEvidencia } from "../store/empresas";

const TIPOS_EXPERIMENTO: { value: TipoExperimento; label: string; descripcion: string }[] = [
  { value: "encuesta",          label: "Encuesta",          descripcion: "Preguntas a un grupo de personas" },
  { value: "entrevista",        label: "Entrevista",        descripcion: "Conversación con usuarios" },
  { value: "landing_page",      label: "Landing page",      descripcion: "Página para medir interés" },
  { value: "prototipo",         label: "Prototipo",         descripcion: "Versión simplificada del producto" },
  { value: "prueba_de_mercado", label: "Prueba de mercado", descripcion: "Venta o prueba real" },
  { value: "otro",              label: "Otro",              descripcion: "Otro tipo de experimento" },
];

const MAX_TITULO = 120;
const MAX_TEXTAREA = 600;

const inputStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#F2F0F7",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "#7E7C86" }}>
      {children}
    </p>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 md:p-6 flex flex-col gap-5"
      style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-base font-semibold" style={{ color: "#F2F0F7" }}>{title}</p>
      <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
      {children}
    </div>
  );
}

export function HipotesisEditView() {
  const { id, hid } = useParams<{ id: string; hid: string }>();
  const router = useRouter();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const hipotesis = useMemo(
    () => empresa?.hipotesisList?.find((h) => h.id === hid),
    [empresa, hid]
  );
  const actualizarHipotesis = useEmpresasStore((s) => s.actualizarHipotesis);
  const eliminarHipotesis = useEmpresasStore((s) => s.eliminarHipotesis);

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

  async function handleEvidenciaFile(file: File) {
    // Validar tamaño (máx 3MB para PDFs/imágenes)
    if (file.size > 3 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 3MB.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
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

  const [showDelete, setShowDelete] = useState(false);

  if (!empresa || !hipotesis) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <Link href={`/emprendedor/empresas/${id}`} className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "#7E7C86" }}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <p className="text-sm" style={{ color: "#7E7C86" }}>Esta hipótesis no existe o fue eliminada.</p>
      </div>
    );
  }

  function guardar() {
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

    actualizarHipotesis(id, hid, {
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
    router.push(`/emprendedor/empresas/${id}`);
  }

  function confirmarEliminar() {
    eliminarHipotesis(id, hid);
    toast.success("Hipótesis eliminada.");
    setShowDelete(false);
    router.push(`/emprendedor/empresas/${id}`);
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Link
        href={`/emprendedor/empresas/${id}`}
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="truncate max-w-[180px] md:max-w-none">{empresa.nombre}</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words" style={{ color: "#F2F0F7" }}>Editar hipótesis</h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
            Actualiza cualquier campo. Los cambios se guardan al dar &quot;Guardar cambios&quot;.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="inline-flex items-center justify-center gap-2 text-sm px-4 h-9 rounded-lg shrink-0 transition-colors"
          style={{ color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)", backgroundColor: "rgba(239,68,68,0.06)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)")}
        >
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Sección Creación */}
        <SectionCard title="Creación">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Título</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>{titulo.length} / {MAX_TITULO}</span>
            </div>
            <input
              type="text"
              value={titulo}
              maxLength={MAX_TITULO}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Descripción</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>{descripcion.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={descripcion}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          <div>
            <Label>Tipo de experimento</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TIPOS_EXPERIMENTO.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipoExp(t.value)}
                  className="rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    backgroundColor: tipoExp === t.value ? "rgba(154,98,250,0.15)" : "rgba(255,255,255,0.03)",
                    border: tipoExp === t.value ? "1px solid rgba(154,98,250,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: tipoExp === t.value ? "#C687F5" : "#F2F0F7" }}>
                    {t.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#7E7C86" }}>{t.descripcion}</p>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Sección Experimento */}
        <SectionCard title="Diseño del experimento">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Descripción del experimento</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>{descExp.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={descExp}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setDescExp(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Objetivo</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>{objetivo.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={objetivo}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setObjetivo(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Criterio de éxito</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>{criterio.length} / 200</span>
            </div>
            <input
              type="text"
              value={criterio}
              maxLength={200}
              onChange={(e) => setCriterio(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
        </SectionCard>

        {/* Sección Resultados */}
        <SectionCard title="Resultados">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Resultado</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>{resultado.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={resultado}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setResultado(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Evidencia</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>Opcional</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {(["pdf", "imagen", "documento", "url"] as TipoEvidencia[]).map((t) => {
                const labels: Record<TipoEvidencia, string> = {
                  pdf: "Archivo PDF", imagen: "Imagen", documento: "Documento", url: "URL",
                };
                const active = tipoEvidencia === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTipoEvidencia(active ? "" : t); limpiarEvidencia(); }}
                    className="text-[11px] px-2.5 h-7 rounded-full font-medium transition-all"
                    style={{
                      color: active ? "#C687F5" : "#7E7C86",
                      backgroundColor: active ? "rgba(154,98,250,0.15)" : "rgba(255,255,255,0.04)",
                      border: active ? "1px solid rgba(154,98,250,0.35)" : "1px solid rgba(255,255,255,0.07)",
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
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            )}

            {tipoEvidencia && tipoEvidencia !== "url" && !evidenciaDataUrl && (
              <label
                className="flex items-center gap-3 rounded-lg px-4 h-10 cursor-pointer transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.1)",
                }}
              >
                <span className="text-sm truncate" style={{ color: "#7E7C86" }}>
                  Seleccionar archivo…
                </span>
                <input
                  type="file"
                  accept={
                    tipoEvidencia === "pdf" ? ".pdf"
                    : tipoEvidencia === "imagen" ? "image/*"
                    : "*"
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
                style={{ backgroundColor: "rgba(154,98,250,0.06)", border: "1px solid rgba(154,98,250,0.2)" }}
              >
                {tipoEvidencia === "imagen" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={evidenciaDataUrl}
                    alt={evidenciaNombre || "Evidencia"}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <FileText className="w-8 h-8" style={{ color: "#C687F5" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words" style={{ color: "#F2F0F7", overflowWrap: "anywhere" }}>
                    {evidenciaNombre || "Archivo cargado"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
                    {tipoEvidencia === "imagen" ? "Imagen" : tipoEvidencia === "pdf" ? "PDF" : "Documento"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a
                      href={evidenciaDataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 h-7 rounded-md transition-colors"
                      style={{ color: "#C687F5", backgroundColor: "rgba(154,98,250,0.1)", border: "1px solid rgba(154,98,250,0.2)" }}
                    >
                      <ExternalLink className="w-3 h-3" /> Abrir
                    </a>
                    <label
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 h-7 rounded-md cursor-pointer transition-colors"
                      style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      Reemplazar
                      <input
                        type="file"
                        accept={
                          tipoEvidencia === "pdf" ? ".pdf"
                          : tipoEvidencia === "imagen" ? "image/*"
                          : "*"
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
              <Label>Conclusión</Label>
              <span className="text-xs" style={{ color: "#4A4850" }}>{conclusion.length} / {MAX_TEXTAREA}</span>
            </div>
            <textarea
              value={conclusion}
              maxLength={MAX_TEXTAREA}
              onChange={(e) => setConclusion(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Link
            href={`/emprendedor/empresas/${id}`}
            className="inline-flex items-center justify-center gap-2 text-sm px-5 h-9 rounded-lg"
            style={{ color: "#F2F0F7", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={guardar}
            className="h-9 px-6 text-sm font-semibold rounded-lg"
            style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
          >
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Confirmación eliminar */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar hipótesis</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar &quot;{hipotesis.titulo}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
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

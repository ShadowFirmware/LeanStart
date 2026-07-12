"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, AlertTriangle, FileText, ExternalLink, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  fileToDataUrl,
  compressImageToDataUrl,
} from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import type { TipoExperimento } from "@leanstart/commons";
import type { TipoEvidencia } from "../store/empresas";

/* ─── Tipos de experimento ─── */
const TIPOS_EXPERIMENTO: { value: TipoExperimento; label: string; descripcion: string }[] = [
  { value: "encuesta",           label: "Encuesta",           descripcion: "Preguntas a un grupo de personas" },
  { value: "entrevista",         label: "Entrevista",         descripcion: "Conversación en profundidad con usuarios" },
  { value: "landing_page",       label: "Landing page",       descripcion: "Página para medir interés antes de construir" },
  { value: "prototipo",          label: "Prototipo",          descripcion: "Versión simplificada del producto" },
  { value: "prueba_de_mercado",  label: "Prueba de mercado",  descripcion: "Venta o prueba real con clientes" },
  { value: "otro",               label: "Otro",               descripcion: "Cualquier otro tipo de experimento" },
];

const MAX_TITULO = 120;
const MAX_TEXTAREA = 400;

/* ─── Indicador de pasos ─── */
const PASOS = [
  { num: 1, label: "Creación" },
  { num: 2, label: "Experimento" },
  { num: 3, label: "Resultados" },
];

function StepIndicator({ actual }: { actual: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 md:mb-10">
      {PASOS.map((paso, i) => {
        const done = actual > paso.num;
        const active = actual === paso.num;
        return (
          <div key={paso.num} className="flex items-center" style={{ flex: i < PASOS.length - 1 ? "1" : "none" }}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: done ? "#9A62FA" : active ? "rgba(154,98,250,0.15)" : "rgba(255,255,255,0.05)",
                  border: done ? "none" : active ? "2px solid #9A62FA" : "2px solid rgba(255,255,255,0.1)",
                  color: done ? "#fff" : active ? "#9A62FA" : "#4A4850",
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : paso.num}
              </div>
              <span
                className="text-[10px] md:text-[11px] font-medium whitespace-nowrap"
                style={{ color: active ? "#F2F0F7" : done ? "#9A62FA" : "#4A4850" }}
              >
                {paso.label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div
                className="flex-1 h-px mx-3 mb-5"
                style={{ backgroundColor: done ? "#9A62FA" : "rgba(255,255,255,0.07)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Estilos reutilizables ─── */
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

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-0">{children}</div>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs mt-1.5" style={{ color: "#EF4444" }}>{msg}</p>;
}

/* ─── Página ─── */
export function HipotesisNewView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const agregarHipotesis = useEmpresasStore((s) => s.agregarHipotesis);

  const [paso, setPaso] = useState(1);

  // Fase 1
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoExp, setTipoExp] = useState<TipoExperimento | "">("");

  // Fase 2
  const [descExp, setDescExp] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [criterio, setCriterio] = useState("");
  const [fechaObj, setFechaObj] = useState("");

  // Fase 3
  const [resultado, setResultado] = useState("");
  const [tipoEvidencia, setTipoEvidencia] = useState<TipoEvidencia | "">("");
  const [evidenciaDataUrl, setEvidenciaDataUrl] = useState("");
  const [evidenciaNombre, setEvidenciaNombre] = useState("");
  const [evidenciaUrl, setEvidenciaUrl] = useState("");
  const [conclusion, setConclusion] = useState("");

  // Errores
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Confirmación cuando evidencia está seleccionada pero vacía
  const [confirmEvidenciaVacia, setConfirmEvidenciaVacia] = useState(false);

  async function handleEvidenciaFile(file: File) {
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

  if (!empresa) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <p className="text-sm" style={{ color: "#7E7C86" }}>Empresa no encontrada.</p>
      </div>
    );
  }

  const limite = (empresa.hipotesisList ?? []).length >= 3;

  /* ─── Validaciones ─── */
  function validarPaso1() {
    const e: Record<string, string> = {};
    if (!titulo.trim()) e.titulo = "El título es requerido";
    else if (titulo.trim().length < 5) e.titulo = "Mínimo 5 caracteres";
    if (!descripcion.trim()) e.descripcion = "La descripción es requerida";
    else if (descripcion.trim().length < 15) e.descripcion = "Mínimo 15 caracteres";
    if (!tipoExp) e.tipoExp = "Selecciona un tipo de experimento";
    return e;
  }

  function validarPaso2() {
    const e: Record<string, string> = {};
    if (!descExp.trim()) e.descExp = "La descripción es requerida";
    else if (descExp.trim().length < 10) e.descExp = "Mínimo 10 caracteres";
    if (!objetivo.trim()) e.objetivo = "El objetivo es requerido";
    else if (objetivo.trim().length < 10) e.objetivo = "Mínimo 10 caracteres";
    if (!criterio.trim()) e.criterio = "El criterio de éxito es requerido";
    else if (criterio.trim().length < 10) e.criterio = "Mínimo 10 caracteres";
    return e;
  }

  function validarPaso3() {
    const e: Record<string, string> = {};
    if (!resultado.trim()) e.resultado = "Describe los resultados obtenidos";
    if (!conclusion.trim()) e.conclusion = "Escribe una conclusión";
    return e;
  }

  /* ─── Navegación ─── */
  function avanzarPaso1() {
    const e = validarPaso1();
    if (Object.keys(e).length) {
      setErrores(e);
      toast.error("Completa los campos requeridos para continuar.");
      return;
    }
    setErrores({});
    setPaso(2);
  }

  function avanzarPaso2() {
    const e = validarPaso2();
    if (Object.keys(e).length) {
      setErrores(e);
      toast.error("Completa los campos requeridos para continuar.");
      return;
    }
    setErrores({});
    setPaso(3);
  }

  /* ─── Guardado final (escribe en store) ─── */
  function guardarTodo(fase: 1 | 2 | 3) {
    const evidenciaFinal =
      tipoEvidencia === "url" ? evidenciaUrl.trim() : evidenciaDataUrl || undefined;

    agregarHipotesis(id, {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      estado: "pendiente_validacion",
      fase,
      experimento: {
        tipo: tipoExp as TipoExperimento,
        descripcion: descExp.trim(),
        objetivo: objetivo.trim(),
        criterioExito: criterio.trim(),
        fechaObjetivo: fechaObj || undefined,
      },
      resultados: fase === 3 ? {
        resultado: resultado.trim(),
        evidencia: evidenciaFinal || undefined,
        evidenciaNombre: tipoEvidencia !== "url" ? evidenciaNombre || undefined : undefined,
        tipoEvidencia: (tipoEvidencia as TipoEvidencia) || undefined,
        conclusion: conclusion.trim(),
      } : undefined,
    });
  }

  function evidenciaIncompleta() {
    if (!tipoEvidencia) return false;
    if (tipoEvidencia === "url") return !evidenciaUrl.trim();
    return !evidenciaDataUrl;
  }

  function ejecutarFinalizar() {
    guardarTodo(3);
    toast.success("Hipótesis completada correctamente.");
    router.push(`/emprendedor/empresas/${id}`);
  }

  function finalizarPaso3() {
    const e = validarPaso3();
    if (Object.keys(e).length) {
      setErrores(e);
      toast.error("Completa los campos requeridos.");
      return;
    }
    if (evidenciaIncompleta()) {
      setConfirmEvidenciaVacia(true);
      return;
    }
    ejecutarFinalizar();
  }

  const tipoEvidenciaLabel: Record<TipoEvidencia, string> = {
    pdf: "un archivo PDF",
    imagen: "una imagen",
    documento: "un documento",
    url: "una URL",
  };

  function guardarParcial() {
    // Solo guardar si paso 1 está completo (mínimo viable)
    const e = validarPaso1();
    if (Object.keys(e).length) {
      setErrores(e);
      toast.error("Completa el paso 1 antes de guardar.");
      return;
    }
    guardarTodo(paso === 1 ? 1 : paso === 2 ? 2 : 3);
    toast.success("Hipótesis guardada. Puedes completar las fases restantes más adelante.");
    router.push(`/emprendedor/empresas/${id}`);
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href={`/emprendedor/empresas/${id}`}
        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="truncate max-w-[180px] md:max-w-none">{empresa.nombre}</span>
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Nueva hipótesis</h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
            Define y valida una suposición de tu modelo de negocio en 3 pasos.
          </p>
        </div>

        {limite && (
          <div className="rounded-xl p-4 mb-6 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
            Ya tienes 3 hipótesis registradas. Elimina una para agregar otra.
          </div>
        )}

        {!limite && (
          <>
            <StepIndicator actual={paso} />

            {/* ── PASO 1: Creación ── */}
            {paso === 1 && (
              <div
                className="rounded-2xl p-4 md:p-6 flex flex-col gap-5"
                style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: "#F2F0F7" }}>Creación de hipótesis</p>
                  <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
                    Define la suposición que quieres validar sobre tu modelo de negocio.
                  </p>
                </div>

                <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

                <Field>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Título</Label>
                    <span className="text-xs" style={{ color: "#4A4850" }}>
                      {titulo.length} / {MAX_TITULO}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. Los usuarios pagarán $200 MXN por suscripción mensual"
                    value={titulo}
                    maxLength={MAX_TITULO}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <FieldError msg={errores.titulo} />
                </Field>

                <Field>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Descripción de la hipótesis</Label>
                    <span className="text-xs" style={{ color: descripcion.length < 15 ? "#4A4850" : "#7E7C86" }}>
                      {descripcion.length} / {MAX_TEXTAREA} (mín. 15)
                    </span>
                  </div>
                  <textarea
                    placeholder="¿Qué suposición quieres validar? ¿Por qué crees que es cierta?"
                    value={descripcion}
                    maxLength={MAX_TEXTAREA}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y leading-relaxed min-h-32"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <FieldError msg={errores.descripcion} />
                </Field>

                {/* Tipo de experimento */}
                <Field>
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
                  <FieldError msg={errores.tipoExp} />
                </Field>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={avanzarPaso1}
                    className="h-9 px-6 text-sm font-semibold rounded-lg w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 2: Experimento ── */}
            {paso === 2 && (
              <div
                className="rounded-2xl p-4 md:p-6 flex flex-col gap-5"
                style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: "#F2F0F7" }}>Diseño del experimento</p>
                  <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
                    Define cómo vas a probar si tu hipótesis es cierta o no.
                  </p>
                </div>

                <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

                <Field>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Descripción del experimento</Label>
                    <span className="text-xs" style={{ color: "#4A4850" }}>{descExp.length} / {MAX_TEXTAREA}</span>
                  </div>
                  <textarea
                    placeholder="¿Cómo vas a ejecutar el experimento?"
                    value={descExp}
                    maxLength={MAX_TEXTAREA}
                    onChange={(e) => setDescExp(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y leading-relaxed min-h-32"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <FieldError msg={errores.descExp} />
                </Field>

                <Field>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Objetivo</Label>
                    <span className="text-xs" style={{ color: "#4A4850" }}>{objetivo.length} / {MAX_TEXTAREA}</span>
                  </div>
                  <textarea
                    placeholder="¿Qué quieres aprender o comprobar?"
                    value={objetivo}
                    maxLength={MAX_TEXTAREA}
                    onChange={(e) => setObjetivo(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y leading-relaxed min-h-28"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <FieldError msg={errores.objetivo} />
                </Field>

                <Field>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Criterio de éxito</Label>
                    <span className="text-xs" style={{ color: "#4A4850" }}>{criterio.length} / 300</span>
                  </div>
                  <textarea
                    placeholder="Ej. Al menos 30% de los encuestados pagaría"
                    value={criterio}
                    maxLength={300}
                    onChange={(e) => setCriterio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y leading-relaxed min-h-24"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <FieldError msg={errores.criterio} />
                </Field>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setErrores({}); setPaso(1); }}
                    className="text-sm px-4 h-9 rounded-lg order-2 sm:order-1"
                    style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    ← Anterior
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={guardarParcial}
                      className="text-sm px-4 h-9 rounded-lg"
                      style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      Guardar y salir
                    </button>
                    <button
                      type="button"
                      onClick={avanzarPaso2}
                      className="h-9 px-6 text-sm font-semibold rounded-lg"
                      style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PASO 3: Resultados ── */}
            {paso === 3 && (
              <div
                className="rounded-2xl p-4 md:p-6 flex flex-col gap-5"
                style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: "#F2F0F7" }}>Registro de resultados</p>
                  <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
                    Documenta qué ocurrió al ejecutar el experimento y cuál es tu conclusión.
                  </p>
                </div>

                <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

                <Field>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Resultado</Label>
                    <span className="text-xs" style={{ color: "#4A4850" }}>{resultado.length} / {MAX_TEXTAREA}</span>
                  </div>
                  <textarea
                    placeholder="Ej. 78 estudiantes mostraron interés."
                    value={resultado}
                    maxLength={MAX_TEXTAREA}
                    onChange={(e) => setResultado(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y leading-relaxed min-h-32"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <FieldError msg={errores.resultado} />
                </Field>

                <Field>
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
                      <span className="text-sm truncate" style={{ color: "#7E7C86" }}>Seleccionar archivo…</span>
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

                  {/* Preview cargado */}
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
                          className="w-auto h-auto max-w-[160px] max-h-[160px] rounded-lg object-contain shrink-0"
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
                </Field>

                <Field>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Conclusión</Label>
                    <span className="text-xs" style={{ color: "#4A4850" }}>{conclusion.length} / {MAX_TEXTAREA}</span>
                  </div>
                  <textarea
                    placeholder="Ej. Existe interés real por parte del segmento identificado."
                    value={conclusion}
                    maxLength={MAX_TEXTAREA}
                    onChange={(e) => setConclusion(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y leading-relaxed min-h-32"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <FieldError msg={errores.conclusion} />
                </Field>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setErrores({}); setPaso(2); }}
                    className="text-sm px-4 h-9 rounded-lg order-2 sm:order-1"
                    style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    ← Anterior
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={guardarParcial}
                      className="text-sm px-4 h-9 rounded-lg"
                      style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      Guardar y salir
                    </button>
                    <button
                      type="button"
                      onClick={finalizarPaso3}
                      className="h-9 px-6 text-sm font-semibold rounded-lg"
                      style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
                    >
                      Finalizar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmación: evidencia seleccionada pero vacía */}
      <AlertDialog open={confirmEvidenciaVacia} onOpenChange={setConfirmEvidenciaVacia}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: "#F59E0B" }} />
              Evidencia sin cargar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Seleccionaste {tipoEvidencia ? tipoEvidenciaLabel[tipoEvidencia as TipoEvidencia] : "una evidencia"} pero no la cargaste. ¿Quieres continuar sin adjuntarla o prefieres regresar a agregarla?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Regresar a agregarla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmEvidenciaVacia(false);
                ejecutarFinalizar();
              }}
              style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC", border: 0 }}
            >
              Continuar sin evidencia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

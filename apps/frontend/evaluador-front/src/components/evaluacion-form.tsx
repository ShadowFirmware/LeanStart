"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, MessageSquare, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  Textarea,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@leanstart/commons";
import { useEmpresasStore } from "@leanstart/empresas-front";
import {
  useCriteriosStore, useViabilidadStore, useEvaluacionesStore,
  calcularReporte, rangoNivel,
  type ReporteCalculo, type NivelViabilidad, type CriterioCalculado,
} from "@leanstart/administrador-front";

const MAX_COMENTARIO_CRITERIO = 300;
const MAX_COMENTARIO_GENERAL = 600;

const cardStyle = { backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" };
const inputStyle = { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" };

interface EvaluacionFormProps {
  empresaId: string;
}

/** Formulario de evaluación del proyecto (uso exclusivo del evaluador). */
export function EvaluacionForm({ empresaId }: EvaluacionFormProps) {
  const router = useRouter();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === empresaId));
  const actualizarEmpresa = useEmpresasStore((s) => s.actualizarEmpresa);

  const criterios = useCriteriosStore((s) => s.criterios);
  const niveles = useViabilidadStore((s) => s.niveles);
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);
  const umbralPublicacion = useViabilidadStore((s) => s.umbralPublicacion);

  const evaluacion = useEvaluacionesStore((s) => s.evaluaciones[empresaId]);
  const setPuntaje = useEvaluacionesStore((s) => s.setPuntaje);
  const setComentarioCriterio = useEvaluacionesStore((s) => s.setComentarioCriterio);
  const setComentario = useEvaluacionesStore((s) => s.setComentario);

  const [confirmarOpen, setConfirmarOpen] = useState(false);

  if (!empresa) return null;

  const puedeEvaluar = empresa.estado === "en_evaluacion";
  const calculo = calcularReporte(empresa, evaluacion, criterios, niveles, pesoEvaluacion);
  const comentarioGeneral = evaluacion?.comentarioEvaluador ?? "";
  // Por debajo de la calificación mínima configurada, el proyecto se devuelve al emprendedor.
  const accionResultante = calculo.scoreFinal >= umbralPublicacion ? "publicado" : "devuelto";

  function setPuntos(criterioId: string, peso: number, puntos: number) {
    const clamped = Math.max(0, Math.min(peso, Math.round(puntos)));
    const porcentaje = peso > 0 ? (clamped / peso) * 100 : 0;
    setPuntaje(empresaId, criterioId, porcentaje);
  }

  function finalizarEvaluacion() {
    if (!empresa) return;
    actualizarEmpresa(empresaId, { estado: accionResultante });
    toast.success(
      accionResultante === "publicado"
        ? `"${empresa.nombre}" fue evaluada y publicada.`
        : `"${empresa.nombre}" fue devuelta al emprendedor.`
    );
    setConfirmarOpen(false);
    router.push("/evaluador/empresas");
  }

  if (!puedeEvaluar) {
    return <ResultadoEvaluacion calculo={calculo} niveles={niveles} comentarioGeneral={comentarioGeneral} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado de criterios (fuera del grid para alinear la primera tarjeta con "Resultado") */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" style={{ color: "#9A62FA" }} />
          <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Criterios de evaluación</span>
        </div>
        <span className="text-xs" style={{ color: "#7E7C86" }}>Calificación por puntos</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Columna principal */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Criterios */}
          {criterios.length === 0 ? (
            <div className="rounded-2xl p-4 md:p-6" style={cardStyle}>
              <p className="text-sm" style={{ color: "#7E7C86" }}>El administrador aún no configuró criterios de evaluación.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {calculo.criterios.map((c, i) => (
                <CriterioRow
                  key={c.id}
                  numero={i + 1}
                  criterio={c}
                  comentario={evaluacion?.comentariosCriterios?.[c.id] ?? ""}
                  onChangePuntos={(puntos) => setPuntos(c.id, c.peso, puntos)}
                  onChangeComentario={(v) => setComentarioCriterio(empresaId, c.id, v)}
                />
              ))}
            </div>
          )}

          {/* Comentario general */}
          <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-2.5" style={cardStyle}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: "#9A62FA" }} />
              <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Comentario general</span>
            </div>
            <p className="text-[11px]" style={{ color: "#7E7C86" }}>Conclusión general sobre la viabilidad del proyecto.</p>
            <Textarea
              value={comentarioGeneral}
              maxLength={MAX_COMENTARIO_GENERAL}
              onChange={(e) => setComentario(empresaId, e.target.value)}
              placeholder="El proyecto presenta una propuesta sólida, con evidencia de validación y un mercado objetivo definido."
              className="min-h-28 resize-none text-sm focus-visible:ring-0"
              style={inputStyle}
            />
            <span className="text-xs text-right" style={{ color: "#4A4850" }}>{comentarioGeneral.length} / {MAX_COMENTARIO_GENERAL}</span>
          </div>
        </div>

        {/* Resultado + finalizar (sticky) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={cardStyle}>
            <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Resultado</span>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#C4C2CC" }}>Evaluación</span>
                <span className="text-sm font-bold" style={{ color: "#F2F0F7" }}>{calculo.scoreEvaluacion}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${calculo.scoreEvaluacion}%`, background: "linear-gradient(90deg,#9A62FA,#AE6CFD)" }} />
              </div>
            </div>

            <ScoreRow label="Hipótesis" value={calculo.scoreHipotesis} sub={`${calculo.hipotesis.validadas}/${calculo.hipotesis.total} validadas`} />

            <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.22)" }}>
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "#9A62FA" }}>Calificación final</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "#F2F0F7" }}>{calculo.scoreFinal}%</p>
              {calculo.nivel && (
                <p className="text-[11px] mt-1" style={{ color: "#7E7C86" }}>
                  Viabilidad {calculo.nivel.nombre} · Rango {rangoNivel(niveles, calculo.nivel)}
                </p>
              )}
            </div>

            <div
              className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
              style={{
                color: accionResultante === "publicado" ? "#10B981" : "#EF4444",
                backgroundColor: accionResultante === "publicado" ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
              }}
            >
              {accionResultante === "publicado" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Undo2 className="w-3.5 h-3.5 shrink-0" />}
              {accionResultante === "publicado"
                ? `Calificación ≥ ${umbralPublicacion}%: el proyecto se publicará.`
                : `Calificación < ${umbralPublicacion}%: el proyecto se devolverá al emprendedor.`}
            </div>

            <button
              type="button"
              onClick={() => setConfirmarOpen(true)}
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold border-0 transition-opacity hover:opacity-90"
              style={
                accionResultante === "publicado"
                  ? { background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }
                  : { background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)", color: "#FBFBFC" }
              }
            >
              {accionResultante === "publicado" ? <CheckCircle2 className="w-4 h-4" /> : <Undo2 className="w-4 h-4" />}
              Finalizar evaluación
            </button>
          </div>
        </div>

        {/* Confirmación de finalizar */}
        <AlertDialog open={confirmarOpen} onOpenChange={setConfirmarOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {accionResultante === "publicado" ? "Publicar proyecto" : "Devolver proyecto"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Se registrará la calificación final de {calculo.scoreFinal}% para &quot;{empresa.nombre}&quot;.{" "}
                {accionResultante === "publicado"
                  ? "El proyecto pasará a estado \"Publicado\"."
                  : "El proyecto pasará a estado \"Devuelto\" y el emprendedor podrá volver a editarlo."}{" "}
                Después de finalizar, la evaluación queda como consulta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={finalizarEvaluacion}
                className="border-0"
                style={
                  accionResultante === "publicado"
                    ? { background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }
                    : { background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)", color: "#FBFBFC" }
                }
              >
                {accionResultante === "publicado" ? <CheckCircle2 className="w-4 h-4" /> : <Undo2 className="w-4 h-4" />}
                {accionResultante === "publicado" ? "Publicar" : "Devolver"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ─── Resultado ya emitido (solo lectura) ─── */
function ResultadoEvaluacion({ calculo, niveles, comentarioGeneral }: {
  calculo: ReporteCalculo;
  niveles: NivelViabilidad[];
  comentarioGeneral: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {calculo.criterios.length > 0 && (
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" style={{ color: "#9A62FA" }} />
          <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Criterios de evaluación</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {calculo.criterios.length > 0 && (
            <div className="flex flex-col gap-3">
              {calculo.criterios.map((c, i) => (
                <div key={c.id} className="rounded-2xl p-4 md:p-5 flex flex-col gap-2" style={cardStyle}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)", color: "#9A62FA" }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: "#F2F0F7" }}>{c.nombre}</p>
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color: "#C9A8FE" }}>{c.puntos} / {c.peso}</span>
                  </div>
                  {c.comentario && (
                    <p className="text-xs leading-relaxed pl-10" style={{ color: "#7E7C86" }}>{c.comentario}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-2" style={cardStyle}>
            <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Comentario general</span>
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap break-words"
              style={{ color: comentarioGeneral.trim() ? "#C4C2CC" : "#4A4850", overflowWrap: "anywhere" }}
            >
              {comentarioGeneral.trim() || "No se registró un comentario general."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={cardStyle}>
            <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Resultado</span>
            <ScoreRow label="Evaluación" value={calculo.scoreEvaluacion} />
            <ScoreRow label="Hipótesis" value={calculo.scoreHipotesis} sub={`${calculo.hipotesis.validadas}/${calculo.hipotesis.total} validadas`} />
            <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.22)" }}>
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "#9A62FA" }}>Calificación final</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "#F2F0F7" }}>{calculo.scoreFinal}%</p>
              {calculo.nivel && (
                <p className="text-[11px] mt-1" style={{ color: "#7E7C86" }}>
                  Viabilidad {calculo.nivel.nombre} · Rango {rangoNivel(niveles, calculo.nivel)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Fila compacta de criterio: calificación en línea + comentario debajo ─── */
function CriterioRow({ numero, criterio, comentario, onChangePuntos, onChangeComentario }: {
  numero: number;
  criterio: CriterioCalculado;
  comentario: string;
  onChangePuntos: (puntos: number) => void;
  onChangeComentario: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-3" style={cardStyle}>
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)", color: "#9A62FA" }}
        >
          {numero}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: "#F2F0F7" }}>{criterio.nombre}</p>
          {criterio.descripcion && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "#7E7C86" }}>{criterio.descripcion}</p>
          )}
        </div>
        <CalificacionInput
          peso={criterio.peso}
          valorGuardado={criterio.puntos}
          onChange={onChangePuntos}
          ariaLabel={`Calificación de ${criterio.nombre}`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
            Comentario
          </label>
          <span className="text-xs" style={{ color: "#4A4850" }}>
            {comentario.length} / {MAX_COMENTARIO_CRITERIO}
          </span>
        </div>
        <Textarea
          value={comentario}
          maxLength={MAX_COMENTARIO_CRITERIO}
          onChange={(e) => onChangeComentario(e.target.value)}
          placeholder="Justifica brevemente la calificación asignada..."
          className="min-h-16 resize-none text-sm focus-visible:ring-0"
          style={inputStyle}
        />
      </div>
    </div>
  );
}

/* ─── Campo de calificación: editar los puntos directo en la tarjeta ─── */
function CalificacionInput({ peso, valorGuardado, onChange, ariaLabel }: {
  peso: number;
  valorGuardado: number;
  onChange: (puntos: number) => void;
  ariaLabel: string;
}) {
  const [valor, setValor] = useState(String(valorGuardado));

  useEffect(() => setValor(String(valorGuardado)), [valorGuardado]);

  function commit(v: string) {
    const n = Math.max(0, Math.min(peso, Math.round(Number(v))));
    if (isNaN(n)) {
      setValor(String(valorGuardado));
      return;
    }
    setValor(String(n));
    if (n !== valorGuardado) onChange(n);
  }

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 h-8 shrink-0"
      style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
    >
      <input
        type="number"
        min={0}
        max={peso}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-8 text-center bg-transparent outline-none text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ color: "#F2F0F7" }}
        aria-label={ariaLabel}
      />
      <span className="text-xs" style={{ color: "#7E7C86" }}>/ {peso}</span>
    </div>
  );
}

function ScoreRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "#C4C2CC" }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: "#F2F0F7" }}>{value}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: "linear-gradient(90deg,#9A62FA,#AE6CFD)" }} />
      </div>
      {sub && <span className="text-[11px]" style={{ color: "#7E7C86" }}>{sub}</span>}
    </div>
  );
}

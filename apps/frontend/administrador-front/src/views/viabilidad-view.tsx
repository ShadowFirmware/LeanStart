"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TrendingUp, Plus, Minus, Pencil, Trash2, Check, GripVertical, ArrowRightLeft } from "lucide-react";
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input,
} from "@leanstart/commons";
import { useViabilidadStore, type NivelViabilidad } from "../store/viabilidad";

const MAX_NOMBRE = 30;

const PALETA_COLORES = ["#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#10B981", "#14B8A6", "#3B82F6", "#6366F1", "#9A62FA", "#EC4899"];

/* ─── Stepper numérico genérico: +/- de un clic o edición directa ─── */
function Stepper({ value, min, max, step = 1, disabled, onChange, label }: {
  value: number; min: number; max: number; step?: number; disabled?: boolean;
  onChange: (v: number) => void; label: string;
}) {
  const [texto, setTexto] = useState(String(value));
  useEffect(() => setTexto(String(value)), [value]);

  function commit(v: string) {
    const n = Math.round(parseFloat(v));
    if (isNaN(n)) {
      setTexto(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, n));
    setTexto(String(clamped));
    if (clamped !== value) onChange(clamped);
  }

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden shrink-0"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: disabled ? "transparent" : "rgba(255,255,255,0.03)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-6 h-7 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
        style={{ color: "#7E7C86" }}
        aria-label={`Disminuir ${label}`}
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={texto}
        disabled={disabled}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-10 text-center bg-transparent outline-none text-sm font-bold disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ color: "#F2F0F7" }}
        aria-label={label}
      />
      <span className="text-xs pr-2" style={{ color: "#7E7C86" }}>%</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-6 h-7 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
        style={{ color: "#7E7C86" }}
        aria-label={`Aumentar ${label}`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export function ViabilidadView() {
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);
  const actualizarPesoEvaluacion = useViabilidadStore((s) => s.actualizarPesoEvaluacion);
  const niveles = useViabilidadStore((s) => s.niveles);
  const umbralPublicacion = useViabilidadStore((s) => s.umbralPublicacion);
  const actualizarUmbralPublicacion = useViabilidadStore((s) => s.actualizarUmbralPublicacion);
  const actualizarHastaNivel = useViabilidadStore((s) => s.actualizarHastaNivel);
  const editarNivel = useViabilidadStore((s) => s.editarNivel);
  const agregarNivel = useViabilidadStore((s) => s.agregarNivel);
  const eliminarNivel = useViabilidadStore((s) => s.eliminarNivel);
  const reordenarNivel = useViabilidadStore((s) => s.reordenarNivel);

  const pesoHipotesis = 100 - pesoEvaluacion;

  const [editTarget, setEditTarget] = useState<NivelViabilidad | null>(null);
  const [nombreDraft, setNombreDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLButtonElement>, i: number) {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
    const fila = e.currentTarget.closest("[data-nivel-row]") as HTMLElement | null;
    if (fila) e.dataTransfer.setDragImage(fila, 20, 20);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, i: number) {
    e.preventDefault();
    if (dragIndex !== null && i !== overIndex) setOverIndex(i);
  }

  function handleDrop(i: number) {
    if (dragIndex !== null && dragIndex !== i) {
      reordenarNivel(dragIndex, i);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function abrirEditar(nivel: NivelViabilidad) {
    setEditTarget(nivel);
    setNombreDraft(nivel.nombre);
    setColorDraft(nivel.color);
  }

  function guardarNivel() {
    if (!editTarget) return;
    const nombre = nombreDraft.trim();
    if (nombre.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    editarNivel(editTarget.id, { nombre, color: colorDraft });
    toast.success(`Nivel "${nombre}" actualizado.`);
    setEditTarget(null);
  }

  function handleAgregarNivel() {
    const exito = agregarNivel();
    if (!exito) {
      toast.error("No hay espacio suficiente para otro nivel.");
    }
  }

  function handleEliminarNivel(nivel: NivelViabilidad) {
    if (niveles.length <= 1) {
      toast.error("Debe existir al menos un nivel de viabilidad.");
      return;
    }
    eliminarNivel(nivel.id);
    toast.success(`Nivel "${nivel.nombre}" eliminado.`);
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Viabilidad</h1>
        <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
          Configura los pesos del Score de Viabilidad y los niveles de clasificación.
        </p>
      </div>

      {/* Pesos del score */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: "#9A62FA" }} />
          <p className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Pesos del Score de Viabilidad</p>
        </div>
        <p className="text-xs mb-4" style={{ color: "#7E7C86" }}>
          Deben sumar 100%.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
            <span className="text-sm" style={{ color: "#C4C2CC" }}>Evaluación</span>
            <Stepper
              value={pesoEvaluacion}
              min={0}
              max={100}
              step={5}
              onChange={actualizarPesoEvaluacion}
              label="peso de evaluación"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
            <span className="text-sm" style={{ color: "#C4C2CC" }}>Hipótesis validadas</span>
            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-lg text-sm font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
            >
              {pesoHipotesis}%
            </span>
          </div>
        </div>
      </div>

      {/* Niveles de viabilidad */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#9A62FA" }} />
            <p className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Niveles de Viabilidad</p>
          </div>
          <Button
            onClick={handleAgregarNivel}
            size="sm"
            className="h-8 px-3 text-xs font-medium border-0 shrink-0"
            style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar nivel
          </Button>
        </div>
        <p className="text-xs mb-4" style={{ color: "#7E7C86" }}>
          Rango de 0% a 100%.
        </p>

        <div className="flex flex-col gap-2">
          {niveles.map((nivel, i) => {
            const min = i === 0 ? 0 : niveles[i - 1].hasta + 1;
            const esUltimo = i === niveles.length - 1;
            return (
              <div
                key={nivel.id}
                data-nivel-row
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: `1px solid ${overIndex === i && dragIndex !== null && dragIndex !== i ? "rgba(154,98,250,0.4)" : "rgba(255,255,255,0.05)"}`,
                  opacity: dragIndex === i ? 0.4 : 1,
                }}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-center w-6 h-7 shrink-0 cursor-grab active:cursor-grabbing"
                  style={{ color: "#4A4850" }}
                  aria-label={`Reordenar ${nivel.nombre}`}
                  title="Arrastrar para reordenar"
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <button
                  onClick={() => abrirEditar(nivel)}
                  className="flex items-center gap-2.5 min-w-[140px] shrink-0 text-left"
                  aria-label={`Editar nivel ${nivel.nombre}`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: nivel.color }} />
                  <span className="text-sm font-medium" style={{ color: "#F2F0F7" }}>{nivel.nombre}</span>
                </button>

                <span className="text-xs shrink-0" style={{ color: "#7E7C86" }}>
                  {min}% – {nivel.hasta}%
                </span>

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {esUltimo ? (
                    <span className="text-xs px-2" style={{ color: "#4A4850" }}>Hasta 100% (fijo)</span>
                  ) : (
                    <Stepper
                      value={nivel.hasta}
                      min={min}
                      max={niveles[i + 1].hasta - 1}
                      onChange={(v) => actualizarHastaNivel(nivel.id, v)}
                      label={`límite superior de ${nivel.nombre}`}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => abrirEditar(nivel)}
                    style={{ color: "#7E7C86" }}
                    aria-label={`Editar ${nivel.nombre}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEliminarNivel(nivel)}
                    style={{ color: "#7E7C86" }}
                    aria-label={`Eliminar ${nivel.nombre}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resultado según viabilidad */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ArrowRightLeft className="w-4 h-4" style={{ color: "#9A62FA" }} />
          <p className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Resultado según viabilidad</p>
        </div>
        <p className="text-xs mb-6" style={{ color: "#7E7C86" }}>
          Calificación mínima para publicar.
        </p>

        <div className="px-1">
          <div className="relative" style={{ height: 26 }}>
            <div
              className="absolute -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ left: `${umbralPublicacion}%`, backgroundColor: "rgba(154,98,250,0.16)", color: "#C9A8FE" }}
            >
              {umbralPublicacion}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={umbralPublicacion}
            onChange={(e) => actualizarUmbralPublicacion(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(154,98,250,0.4)] [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:shadow-[0_0_0_3px_rgba(154,98,250,0.4)] [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${umbralPublicacion}%, #10B981 ${umbralPublicacion}%, #10B981 100%)`,
            }}
            aria-label="Calificación mínima para publicar"
          />
          <div className="flex items-center justify-between mt-2 text-xs font-medium">
            <span style={{ color: "#EF4444" }}>Devuelto</span>
            <span style={{ color: "#10B981" }}>Publicado</span>
          </div>
        </div>
      </div>

      {/* Dialog: editar nivel */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nivel</DialogTitle>
            <DialogDescription>Actualiza el nombre y el color de este nivel de viabilidad.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Nombre</label>
              <Input
                value={nombreDraft}
                maxLength={MAX_NOMBRE}
                placeholder="Ej. Media"
                onChange={(e) => setNombreDraft(e.target.value)}
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Color</label>
              <div className="flex flex-wrap gap-2">
                {PALETA_COLORES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorDraft(color)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    aria-label={`Elegir color ${color}`}
                  >
                    {colorDraft === color && <Check className="w-3.5 h-3.5" style={{ color: "#FBFBFC" }} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={guardarNivel}
              className="border-0"
              style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  TrendingUp, Plus, Minus, Pencil, Trash2, Check, GripVertical, ArrowRightLeft,
  Layers, Flag,
} from "lucide-react";
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Input, debounce, useHasHydrated, useAccion, ViewSkeleton,
} from "@leanstart/commons";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useViabilidadStore, type NivelViabilidad } from "../store/viabilidad";

const MAX_NOMBRE = 30;

const PALETA_COLORES = ["#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#10B981", "#14B8A6", "#3B82F6", "#6366F1", "#9A62FA", "#EC4899"];

const cardStyle = {
  backgroundColor: "var(--surface-profile)",
  boxShadow: "var(--shadow-card)",
  border: "1px solid var(--border-subtle)",
};

/* ─── Helpers de rango ───
   Los niveles son tramos contiguos de 0 a 100: el límite inferior de cada uno
   se deriva del `hasta` del anterior, y el último siempre cierra en 100. */

function minDe(niveles: NivelViabilidad[], i: number): number {
  return i === 0 ? 0 : niveles[i - 1].hasta + 1;
}

function anchoDe(niveles: NivelViabilidad[], i: number): number {
  return niveles[i].hasta - minDe(niveles, i) + 1;
}

/** Nivel al que cae una calificación, siguiendo el mismo criterio que el reporte. */
function nivelDe(niveles: NivelViabilidad[], score: number): NivelViabilidad | undefined {
  return niveles.find((n) => score <= n.hasta) ?? niveles[niveles.length - 1];
}

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
        border: "1px solid var(--border-hair)",
        backgroundColor: disabled ? "transparent" : "var(--hover-surface-2)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const nuevo = Math.max(min, value - step);
          setTexto(String(nuevo));
          onChange(nuevo);
        }}
        className="w-6 h-7 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
        style={{ color: "var(--text-dim)" }}
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
        style={{ color: "var(--text-strong)" }}
        aria-label={label}
      />
      <span className="text-xs pr-2" style={{ color: "var(--text-dim)" }}>%</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const nuevo = Math.min(max, value + step);
          setTexto(String(nuevo));
          onChange(nuevo);
        }}
        className="w-6 h-7 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
        style={{ color: "var(--text-dim)" }}
        aria-label={`Aumentar ${label}`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─── Espectro 0-100: la escala completa de un vistazo ───
   Antes los niveles solo se leían como una lista de números; la barra muestra
   cuánto ocupa cada tramo y dónde cae la calificación mínima para publicar. */
function EspectroNiveles({ niveles, umbral, destacado }: {
  niveles: NivelViabilidad[];
  umbral: number;
  /** Id del nivel a resaltar (p. ej. el que se está editando o previsualizando). */
  destacado?: string;
}) {
  const nivelUmbral = nivelDe(niveles, umbral);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex h-9 w-full overflow-hidden rounded-lg" style={{ border: "1px solid var(--border-hair)" }}>
          {niveles.map((nivel, i) => {
            const ancho = anchoDe(niveles, i);
            const atenuado = destacado !== undefined && destacado !== nivel.id;
            return (
              <div
                key={nivel.id}
                className="flex items-center justify-center overflow-hidden transition-all duration-200"
                style={{
                  width: `${ancho}%`,
                  backgroundColor: nivel.color,
                  opacity: atenuado ? 0.35 : 1,
                }}
                title={`${nivel.nombre}: ${minDe(niveles, i)}% – ${nivel.hasta}%`}
              >
                {ancho >= 14 && (
                  <span className="px-1 text-[11px] font-semibold truncate" style={{ color: "#FFFFFF" }}>
                    {nivel.nombre}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Marcador de la calificación mínima para publicar */}
        <div
          className="pointer-events-none absolute -top-1 -bottom-1 w-0.5 transition-all duration-200"
          style={{ left: `${umbral}%`, backgroundColor: "var(--text-strong)" }}
          aria-hidden
        />
      </div>

      <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--text-faint)" }}>
        <span>0%</span>
        <span className="flex items-center gap-1" style={{ color: "var(--text-dim)" }}>
          <Flag className="w-3 h-3" />
          Publica desde {umbral}%
          {nivelUmbral && ` · nivel ${nivelUmbral.nombre}`}
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}

/* ─── Fila arrastrable de un nivel (dnd-kit: transform/transition animados) ─── */
function NivelRow({ nivel, min, esUltimo, stepperMax, ancho, onGuardarHasta, onAbrirEditar, onEliminar }: {
  nivel: NivelViabilidad; min: number; esUltimo: boolean; stepperMax: number; ancho: number;
  onGuardarHasta: (v: number) => void; onAbrirEditar: () => void; onEliminar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: nivel.id });

  return (
    <div
      ref={setNodeRef}
      className="relative flex flex-wrap items-center gap-3 overflow-hidden rounded-xl px-4 py-3"
      style={{
        backgroundColor: "var(--hover-surface-2)",
        border: "1px solid var(--border-subtle)",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : "auto",
      }}
    >
      {/* Franja lateral con el color del nivel: identifica la fila sin depender del punto */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: nivel.color }} aria-hidden />

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-6 h-7 shrink-0 cursor-grab active:cursor-grabbing touch-none"
        style={{ color: "var(--text-faint)" }}
        aria-label={`Reordenar ${nivel.nombre}`}
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <button
        onClick={onAbrirEditar}
        className="flex flex-col items-start gap-1 min-w-[150px] shrink-0 text-left"
        aria-label={`Editar nivel ${nivel.nombre}`}
      >
        <span className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: nivel.color }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>{nivel.nombre}</span>
        </span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          {min}% – {nivel.hasta}% · {ancho} pts
        </span>
      </button>

      {/* Proporción del tramo dentro de la escala completa */}
      <div className="hidden sm:block flex-1 min-w-24 h-1.5 rounded-full" style={{ backgroundColor: "var(--border-hair)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${ancho}%`, backgroundColor: nivel.color }} />
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        {esUltimo ? (
          <span className="text-xs px-2" style={{ color: "var(--text-faint)" }}>Hasta 100% (fijo)</span>
        ) : (
          <Stepper
            value={nivel.hasta}
            min={min}
            max={stepperMax}
            onChange={onGuardarHasta}
            label={`límite superior de ${nivel.nombre}`}
          />
        )}
        <Button variant="ghost" size="icon-sm" onClick={onAbrirEditar} style={{ color: "var(--text-dim)" }} aria-label={`Editar ${nivel.nombre}`}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onEliminar} style={{ color: "var(--text-dim)" }} aria-label={`Eliminar ${nivel.nombre}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Selector de color reutilizable ─── */
function PaletaColores({ valor, onChange }: { valor: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETA_COLORES.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{
            backgroundColor: color,
            outline: valor === color ? "2px solid var(--text-strong)" : "none",
            outlineOffset: 2,
          }}
          aria-label={`Elegir color ${color}`}
          aria-pressed={valor === color}
        >
          {valor === color && <Check className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} />}
        </button>
      ))}
    </div>
  );
}

export function ViabilidadView() {
  const hydrated = useHasHydrated();

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

  // Valor local del slider: sigue el arrastre al instante aunque el guardado esté debounced.
  const [umbralLocal, setUmbralLocal] = useState(umbralPublicacion);
  useEffect(() => setUmbralLocal(umbralPublicacion), [umbralPublicacion]);

  const guardarPesoEvaluacion = useMemo(
    () => debounce((v: number) => actualizarPesoEvaluacion(v).catch(() => toast.error("No se pudo actualizar el peso.")), 400),
    [actualizarPesoEvaluacion]
  );
  const guardarUmbral = useMemo(
    () => debounce((v: number) => actualizarUmbralPublicacion(v).catch(() => toast.error("No se pudo actualizar el umbral.")), 400),
    [actualizarUmbralPublicacion]
  );
  const debouncedHastaPorNivel = useRef<Map<string, (v: number) => void>>(new Map());
  function guardarHastaNivel(id: string, v: number) {
    let fn = debouncedHastaPorNivel.current.get(id);
    if (!fn) {
      fn = debounce((valor: number) => {
        actualizarHastaNivel(id, valor).catch(() => toast.error("No se pudo actualizar el nivel."));
      }, 400);
      debouncedHastaPorNivel.current.set(id, fn);
    }
    fn(v);
  }

  const [editTarget, setEditTarget] = useState<NivelViabilidad | null>(null);
  const [nombreDraft, setNombreDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NivelViabilidad | null>(null);

  const { cargando: guardandoNivel, ejecutar: ejecutarGuardarNivel } = useAccion();
  const { cargando: creandoNivel, ejecutar: ejecutarCrearNivel } = useAccion();
  const { cargando: eliminandoNivel, ejecutar: ejecutarEliminarNivel } = useAccion();

  /* ─── Alta de nivel ───
     Antes el botón insertaba a ciegas un "Nuevo nivel" partiendo en dos el
     último tramo, y había que renombrarlo y recolocarlo después. Ahora se
     capturan nombre, color y límite superior antes de crearlo, con vista previa
     de dónde va a quedar. */
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoColor, setNuevoColor] = useState(PALETA_COLORES[0]);
  const [nuevoHasta, setNuevoHasta] = useState(50);

  // Límites ya ocupados: un nivel nuevo no puede terminar donde termina otro.
  const limitesOcupados = useMemo(() => new Set(niveles.map((n) => n.hasta)), [niveles]);
  const hayEspacio = limitesOcupados.size < 99;

  /** Punto medio del hueco más ancho: la sugerencia menos disruptiva. */
  function sugerirHasta(): number {
    let mejor = 1;
    let mejorAncho = -1;
    let previo = 0;
    for (const nivel of niveles) {
      const ancho = nivel.hasta - previo;
      if (ancho > mejorAncho) {
        mejorAncho = ancho;
        mejor = previo + Math.max(1, Math.floor(ancho / 2));
      }
      previo = nivel.hasta;
    }
    return Math.min(99, Math.max(1, mejor));
  }

  function abrirCrear() {
    if (!hayEspacio) {
      toast.error("No queda espacio para otro nivel: la escala solo admite 100 tramos.");
      return;
    }
    setNuevoNombre("");
    setNuevoColor(PALETA_COLORES[niveles.length % PALETA_COLORES.length]);
    setNuevoHasta(sugerirHasta());
    setCrearOpen(true);
  }

  // Vista previa del tramo que ocuparía el nivel nuevo y del que le cede espacio.
  const previaNuevo = useMemo(() => {
    const posicion = niveles.filter((n) => n.hasta < nuevoHasta).length;
    const desde = posicion === 0 ? 0 : niveles[posicion - 1].hasta + 1;
    const siguiente = niveles[posicion];
    const colision = limitesOcupados.has(nuevoHasta);
    return { posicion, desde, siguiente, colision, valido: !colision && !!siguiente && siguiente.hasta > nuevoHasta };
  }, [niveles, nuevoHasta, limitesOcupados]);

  // Los mismos niveles, con el nuevo tramo insertado, para pintar el espectro de la vista previa.
  const nivelesConPrevia = useMemo(() => {
    if (!previaNuevo.valido) return niveles;
    const copia = [...niveles];
    copia.splice(previaNuevo.posicion, 0, {
      id: "__previa__",
      nombre: nuevoNombre.trim() || "Nuevo nivel",
      hasta: nuevoHasta,
      color: nuevoColor,
    });
    return copia;
  }, [niveles, previaNuevo, nuevoNombre, nuevoHasta, nuevoColor]);

  // Distancia mínima antes de activar el arrastre: evita que un simple click
  // (editar, +/-) se confunda con el inicio de un drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const desde = niveles.findIndex((n) => n.id === active.id);
    const hasta = niveles.findIndex((n) => n.id === over.id);
    if (desde === -1 || hasta === -1) return;
    reordenarNivel(desde, hasta).catch(() => toast.error("No se pudo reordenar el nivel."));
  }

  function abrirEditar(nivel: NivelViabilidad) {
    setEditTarget(nivel);
    setNombreDraft(nivel.nombre);
    setColorDraft(nivel.color);
  }

  async function guardarNivel() {
    if (!editTarget) return;
    const nombre = nombreDraft.trim();
    if (nombre.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const objetivo = editTarget;
    await ejecutarGuardarNivel(
      async () => {
        await editarNivel(objetivo.id, { nombre, color: colorDraft });
        toast.success(`Nivel "${nombre}" actualizado.`);
        setEditTarget(null);
      },
      { etiqueta: "Guardando nivel", onError: () => toast.error("No se pudo actualizar el nivel.") }
    );
  }

  async function handleCrearNivel() {
    const nombre = nuevoNombre.trim();
    if (nombre.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!previaNuevo.valido) {
      toast.error(
        previaNuevo.colision
          ? `Ya existe un nivel que termina en ${nuevoHasta}%. Elige otro límite.`
          : "Ese límite no deja espacio para el nivel."
      );
      return;
    }

    await ejecutarCrearNivel(
      async () => {
        const exito = await agregarNivel({ nombre, color: nuevoColor, hasta: nuevoHasta });
        if (!exito) {
          toast.error("No hay espacio suficiente para otro nivel.");
          return;
        }
        toast.success(`Nivel "${nombre}" creado (${previaNuevo.desde}% – ${nuevoHasta}%).`);
        setCrearOpen(false);
      },
      { etiqueta: "Creando nivel", onError: () => toast.error("No se pudo agregar el nivel.") }
    );
  }

  async function confirmarEliminar() {
    if (!deleteTarget) return;
    const objetivo = deleteTarget;
    if (niveles.length <= 1) {
      toast.error("Debe existir al menos un nivel de viabilidad.");
      setDeleteTarget(null);
      return;
    }
    await ejecutarEliminarNivel(
      async () => {
        await eliminarNivel(objetivo.id);
        toast.success(`Nivel "${objetivo.nombre}" eliminado.`);
      },
      { etiqueta: "Eliminando nivel", onError: () => toast.error("No se pudo eliminar el nivel.") }
    );
    setDeleteTarget(null);
  }

  // La configuración vive en un store persistido: esqueleto hasta que rehidrate.
  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={3} />;

  const nivelUmbral = nivelDe(niveles, umbralLocal);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--brand-tint)", border: "1px solid var(--brand-tint-strong)" }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: "var(--brand)" }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Viabilidad</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
            Configura los pesos del Score de Viabilidad y los niveles de clasificación.
          </p>
        </div>
      </div>

      {/* Pesos del score */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-center gap-2 mb-1">
          <ArrowRightLeft className="w-4 h-4" style={{ color: "var(--brand)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Pesos del Score de Viabilidad</p>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
          Cuánto aporta cada fuente a la calificación final. Siempre suman 100%.
        </p>

        {/* Reparto visual: el complemento se entiende sin leer los números */}
        <div className="flex h-8 w-full overflow-hidden rounded-lg mb-4" style={{ border: "1px solid var(--border-hair)" }}>
          <div
            className="flex items-center justify-center transition-all duration-200"
            style={{ width: `${pesoEvaluacion}%`, background: "var(--brand-gradient)" }}
          >
            {pesoEvaluacion >= 18 && (
              <span className="text-[11px] font-semibold" style={{ color: "var(--brand-fg)" }}>
                Evaluación {pesoEvaluacion}%
              </span>
            )}
          </div>
          <div
            className="flex items-center justify-center transition-all duration-200"
            style={{ width: `${pesoHipotesis}%`, backgroundColor: "var(--hover-surface-2)" }}
          >
            {pesoHipotesis >= 18 && (
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-dim)" }}>
                Hipótesis {pesoHipotesis}%
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Evaluación</span>
            <Stepper
              value={pesoEvaluacion}
              min={0}
              max={100}
              step={5}
              onChange={guardarPesoEvaluacion}
              label="peso de evaluación"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Hipótesis validadas</span>
            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-lg text-sm font-bold"
              style={{ backgroundColor: "var(--hover-surface-2)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              {pesoHipotesis}%
            </span>
          </div>
        </div>
      </div>

      {/* Niveles de viabilidad */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: "var(--brand)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Niveles de Viabilidad</p>
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--hover-surface-2)", color: "var(--text-dim)" }}
            >
              {niveles.length}
            </span>
          </div>
          <Button
            onClick={abrirCrear}
            size="sm"
            disabled={!hayEspacio}
            title={hayEspacio ? undefined : "La escala 0-100 ya no admite más tramos."}
            className="h-8 px-3 text-xs font-medium border-0 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar nivel
          </Button>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
          Tramos contiguos de 0% a 100%. Arrastra para reordenarlos; el último siempre cierra en 100%.
        </p>

        <div className="mb-5">
          <EspectroNiveles niveles={niveles} umbral={umbralLocal} />
        </div>

        <DndContext id="niveles-viabilidad" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={niveles.map((n) => n.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {niveles.map((nivel, i) => {
                const esUltimo = i === niveles.length - 1;
                return (
                  <NivelRow
                    key={nivel.id}
                    nivel={nivel}
                    min={minDe(niveles, i)}
                    esUltimo={esUltimo}
                    stepperMax={esUltimo ? 100 : niveles[i + 1].hasta - 1}
                    ancho={anchoDe(niveles, i)}
                    onGuardarHasta={(v) => guardarHastaNivel(nivel.id, v)}
                    onAbrirEditar={() => abrirEditar(nivel)}
                    onEliminar={() => setDeleteTarget(nivel)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Resultado según viabilidad */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-center gap-2 mb-1">
          <Flag className="w-4 h-4" style={{ color: "var(--brand)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Resultado según viabilidad</p>
        </div>
        <p className="text-xs mb-6" style={{ color: "var(--text-dim)" }}>
          Calificación mínima para publicar. Por debajo, el proyecto se devuelve al emprendedor.
        </p>

        <div className="px-1">
          <div className="relative" style={{ height: 26 }}>
            <div
              className="absolute -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ left: `${umbralLocal}%`, backgroundColor: "rgba(154,98,250,0.16)", color: "var(--brand-accent)" }}
            >
              {umbralLocal}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={umbralLocal}
            onChange={(e) => {
              const v = Number(e.target.value);
              setUmbralLocal(v);
              guardarUmbral(v);
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(154,98,250,0.4)] [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:shadow-[0_0_0_3px_rgba(154,98,250,0.4)] [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${umbralLocal}%, #10B981 ${umbralLocal}%, #10B981 100%)`,
            }}
            aria-label="Calificación mínima para publicar"
          />
          <div className="flex items-center justify-between mt-2 text-xs font-medium">
            <span style={{ color: "#EF4444" }}>Devuelto</span>
            <span style={{ color: "#10B981" }}>Publicado</span>
          </div>

          {nivelUmbral && (
            <p className="text-xs mt-4" style={{ color: "var(--text-dim)" }}>
              Con {umbralLocal}% un proyecto queda en el nivel{" "}
              <span className="font-semibold" style={{ color: nivelUmbral.color }}>{nivelUmbral.nombre}</span> y se publica.
            </p>
          )}
        </div>
      </div>

      {/* Dialog: agregar nivel */}
      <Dialog open={crearOpen} onOpenChange={(open) => { if (!open) setCrearOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar nivel</DialogTitle>
            <DialogDescription>
              El nivel nuevo toma su espacio del tramo donde cae su límite superior.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Nombre</label>
              <Input
                value={nuevoNombre}
                maxLength={MAX_NOMBRE}
                placeholder="Ej. Media"
                onChange={(e) => setNuevoNombre(e.target.value)}
                style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Color</label>
              <PaletaColores valor={nuevoColor} onChange={setNuevoColor} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                  Límite superior
                </label>
                <Stepper
                  value={nuevoHasta}
                  min={1}
                  max={99}
                  onChange={setNuevoHasta}
                  label="límite superior del nivel nuevo"
                />
              </div>

              <input
                type="range"
                min={1}
                max={99}
                value={nuevoHasta}
                onChange={(e) => setNuevoHasta(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(154,98,250,0.4)] [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:shadow-[0_0_0_3px_rgba(154,98,250,0.4)] [&::-moz-range-thumb]:cursor-pointer"
                style={{ backgroundColor: "var(--border-hair)" }}
                aria-label="Límite superior del nivel nuevo"
              />
            </div>

            {/* Vista previa: dónde queda y a quién le quita espacio */}
            <div
              className="rounded-lg p-3 flex flex-col gap-3"
              style={{ backgroundColor: "var(--hover-surface-2)", border: "1px solid var(--border-hair)" }}
            >
              <EspectroNiveles niveles={nivelesConPrevia} umbral={umbralLocal} destacado="__previa__" />
              {previaNuevo.valido ? (
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  <span className="font-semibold" style={{ color: "var(--text-strong)" }}>
                    {nuevoNombre.trim() || "Nuevo nivel"}
                  </span>{" "}
                  abarcará {previaNuevo.desde}% – {nuevoHasta}%, tomando espacio de{" "}
                  <span className="font-semibold" style={{ color: previaNuevo.siguiente?.color }}>
                    {previaNuevo.siguiente?.nombre}
                  </span>
                  .
                </p>
              ) : (
                <p className="text-xs font-medium" style={{ color: "#EF4444" }}>
                  {previaNuevo.colision
                    ? `Ya existe un nivel que termina en ${nuevoHasta}%. Elige otro límite.`
                    : "Ese límite no deja espacio para el nivel."}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCrearOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCrearNivel}
              disabled={!previaNuevo.valido}
              loading={creandoNivel}
              loadingText="Creando…"
              className="border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              Crear nivel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: editar nivel */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nivel</DialogTitle>
            <DialogDescription>Actualiza el nombre y el color de este nivel de viabilidad.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Nombre</label>
              <Input
                value={nombreDraft}
                maxLength={MAX_NOMBRE}
                placeholder="Ej. Media"
                onChange={(e) => setNombreDraft(e.target.value)}
                style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Color</label>
              <PaletaColores valor={colorDraft} onChange={setColorDraft} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={guardarNivel}
              loading={guardandoNivel}
              loadingText="Guardando…"
              className="border-0"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminado: borrar un nivel redistribuye la escala, no es reversible */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar nivel</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `¿Seguro que quieres eliminar "${deleteTarget.nombre}"? Su tramo pasará al nivel siguiente y los proyectos ya clasificados cambiarán de nivel.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              loading={eliminandoNivel}
              loadingText="Eliminando…"
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

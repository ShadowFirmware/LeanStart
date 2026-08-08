"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ClipboardList, Plus, Minus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
  Input, Textarea, debounce, useHasHydrated, useAccion, ViewSkeleton,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import { useCriteriosStore, type Criterio } from "../store/criterios";

const MAX_NOMBRE = 80;
const MAX_DESCRIPCION = 300;

const schema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(MAX_NOMBRE, `Máximo ${MAX_NOMBRE} caracteres`),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(MAX_DESCRIPCION, `Máximo ${MAX_DESCRIPCION} caracteres`),
  peso: z.string().refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n > 0 && n <= 100;
  }, "El peso debe estar entre 1 y 100"),
});

type FormValues = z.infer<typeof schema>;

const inputStyle = {
  backgroundColor: "var(--hover-surface)",
  border: "1px solid var(--border-hair)",
  color: "var(--text-strong)",
};

const cardStyle = {
  backgroundColor: "var(--surface-profile)",
  boxShadow: "var(--shadow-card)",
  border: "1px solid var(--border-subtle)",
};

/* Paleta de la barra de reparto: cada criterio conserva su color entre la barra
   resumen y la franja de su tarjeta, para poder relacionarlos de un vistazo. */
const PALETA_CRITERIOS = ["#9A62FA", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#14B8A6", "#F97316", "#6366F1"];

function colorCriterio(indice: number): string {
  return PALETA_CRITERIOS[indice % PALETA_CRITERIOS.length];
}

/* ─── Stepper de peso: editar el % directo en la tarjeta, sin abrir el diálogo ─── */
function PesoStepper({ criterio, maxPeso }: { criterio: Criterio; maxPeso: number }) {
  const actualizarPeso = useCriteriosStore((s) => s.actualizarPeso);
  const [valor, setValor] = useState(String(criterio.peso));

  useEffect(() => setValor(String(criterio.peso)), [criterio.peso]);

  const guardarPeso = useMemo(
    () =>
      debounce((id: string, peso: number) => {
        actualizarPeso(id, peso).catch(() => toast.error("No se pudo actualizar el peso."));
      }, 400),
    [actualizarPeso]
  );

  function commit(v: string) {
    const n = Math.max(1, Math.min(maxPeso, Math.round(parseFloat(v))));
    if (isNaN(n)) {
      setValor(String(criterio.peso));
      return;
    }
    if (n < Math.round(parseFloat(v))) {
      toast.error(`El peso total no puede superar 100%. Máximo para este criterio: ${maxPeso}%.`);
    }
    setValor(String(n));
    if (n !== criterio.peso) guardarPeso(criterio.id, n);
  }

  function ajustar(delta: number) {
    const nuevo = Math.max(1, Math.min(maxPeso, criterio.peso + delta));
    if (nuevo === criterio.peso && delta > 0) {
      toast.error(`El peso total no puede superar 100%. Máximo para este criterio: ${maxPeso}%.`);
      return;
    }
    setValor(String(nuevo));
    guardarPeso(criterio.id, nuevo);
  }

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden shrink-0"
      style={{ border: "1px solid var(--border-hair)", backgroundColor: "var(--hover-surface-2)" }}
    >
      <button
        type="button"
        onClick={() => ajustar(-1)}
        className="w-6 h-7 flex items-center justify-center transition-colors"
        style={{ color: "var(--text-dim)" }}
        aria-label={`Disminuir peso de ${criterio.nombre}`}
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-10 text-center bg-transparent outline-none text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ color: "var(--text-strong)" }}
        aria-label={`Peso de ${criterio.nombre}`}
      />
      <span className="text-xs pr-2" style={{ color: "var(--text-dim)" }}>%</span>
      <button
        type="button"
        onClick={() => ajustar(1)}
        className="w-6 h-7 flex items-center justify-center transition-colors"
        style={{ color: "var(--text-dim)" }}
        aria-label={`Aumentar peso de ${criterio.nombre}`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export function CriteriosEvaluacionView() {
  const hydrated = useHasHydrated();
  const criterios = useCriteriosStore((s) => s.criterios);
  const agregarCriterio = useCriteriosStore((s) => s.agregarCriterio);
  const editarCriterio = useCriteriosStore((s) => s.editarCriterio);
  const eliminarCriterio = useCriteriosStore((s) => s.eliminarCriterio);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Criterio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Criterio | null>(null);

  const { cargando: guardando, ejecutar: ejecutarGuardado } = useAccion();
  const { cargando: eliminando, ejecutar: ejecutarEliminado } = useAccion();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", descripcion: "", peso: "" },
  });

  const pesoTotal = useMemo(
    () => criterios.reduce((acc, c) => acc + c.peso, 0),
    [criterios]
  );
  const estado = pesoTotal === 100 ? "completo" : pesoTotal > 100 ? "excedido" : "incompleto";
  const estadoColor = estado === "completo" ? "#10B981" : estado === "excedido" ? "#EF4444" : "#F59E0B";
  const estadoLabel =
    estado === "completo" ? "Rúbrica completa" :
    estado === "excedido" ? `Excede por ${(pesoTotal - 100).toFixed(0)}%` :
    `Faltan ${(100 - pesoTotal).toFixed(0)}% para completar`;

  function abrirCrear() {
    setEditTarget(null);
    form.reset({ nombre: "", descripcion: "", peso: "" });
    setDialogOpen(true);
  }

  function abrirEditar(criterio: Criterio) {
    setEditTarget(criterio);
    form.reset({ nombre: criterio.nombre, descripcion: criterio.descripcion, peso: String(criterio.peso) });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const data = { nombre: values.nombre, descripcion: values.descripcion, peso: parseFloat(values.peso) };
    const totalSinEste = pesoTotal - (editTarget?.peso ?? 0);
    if (totalSinEste + data.peso > 100) {
      form.setError("peso", {
        message: `El peso total no puede superar 100%. Máximo disponible: ${Math.max(0, 100 - totalSinEste)}%.`,
      });
      return;
    }
    await ejecutarGuardado(
      async () => {
        if (editTarget) {
          await editarCriterio(editTarget.id, data);
          toast.success(`"${data.nombre}" fue actualizado.`);
        } else {
          await agregarCriterio(data);
          toast.success(`"${data.nombre}" fue creado correctamente.`);
        }
        setDialogOpen(false);
      },
      {
        etiqueta: editTarget ? "Guardando criterio" : "Creando criterio",
        onError: () => toast.error("No se pudo guardar el criterio."),
      }
    );
  }

  async function confirmarEliminar() {
    if (!deleteTarget) return;
    const objetivo = deleteTarget;
    await ejecutarEliminado(
      async () => {
        await eliminarCriterio(objetivo.id);
        toast.success(`"${objetivo.nombre}" fue eliminado.`);
      },
      { etiqueta: "Eliminando criterio", onError: () => toast.error("No se pudo eliminar el criterio.") }
    );
    setDeleteTarget(null);
  }

  // Esqueleto neutro hasta rehidratar el store persistido: sin él, la rúbrica
  // aparecía vacía ("Aún no hay criterios") durante el primer render.
  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={4} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand-tint)", border: "1px solid var(--brand-tint-strong)" }}
          >
            <ClipboardList className="w-5 h-5" style={{ color: "var(--brand)" }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Criterios de Evaluación</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
              {criterios.length} {criterios.length === 1 ? "criterio registrado" : "criterios registrados"} · rúbrica al {pesoTotal}%
            </p>
          </div>
        </div>
        <Button
          onClick={abrirCrear}
          disabled={pesoTotal >= 100}
          title={pesoTotal >= 100 ? "Reduce el peso de otros criterios antes de agregar uno nuevo." : undefined}
          className="h-9 px-4 text-sm font-medium border-0 shrink-0 justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
        >
          <Plus className="w-4 h-4" />
          Agregar criterio
        </Button>
      </div>

      {/* Resumen de peso total: barra segmentada por criterio, no una sola masa */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>
            Peso total de la rúbrica
          </span>
          <span className="text-xs font-semibold text-right" style={{ color: estadoColor }}>
            {pesoTotal}% · {estadoLabel}
          </span>
        </div>

        <div className="flex w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-hair)" }}>
          {criterios.map((criterio, i) => (
            <div
              key={criterio.id}
              className="h-full transition-all"
              style={{
                width: `${Math.min(criterio.peso, 100)}%`,
                backgroundColor: colorCriterio(i),
                borderRight: "1px solid var(--surface-profile)",
              }}
              title={`${criterio.nombre}: ${criterio.peso}%`}
            />
          ))}
        </div>

        {estado !== "completo" && (
          <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
            Los pesos de todos los criterios deben sumar exactamente 100% para que la rúbrica sea válida.
          </p>
        )}
      </div>

      {/* Lista de criterios */}
      {criterios.length === 0 ? (
        <div className="rounded-xl p-14 text-center" style={cardStyle}>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--brand-tint)", border: "1px solid var(--brand-tint-strong)" }}
          >
            <ClipboardList className="w-5 h-5" style={{ color: "var(--brand)" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>Aún no hay criterios</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-dim)" }}>Crea el primer criterio de la rúbrica para comenzar.</p>
          <Button
            onClick={abrirCrear}
            className="h-9 px-4 text-sm font-medium border-0"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            <Plus className="w-4 h-4" />
            Agregar criterio
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {criterios.map((criterio, i) => (
            <div
              key={criterio.id}
              className="relative flex items-start gap-4 rounded-xl p-5 pl-6 overflow-hidden transition-shadow hover:shadow-lg"
              style={cardStyle}
            >
              {/* Franja del color con el que aparece en la barra de arriba */}
              <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colorCriterio(i) }} aria-hidden />

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)", color: "var(--brand)" }}
                aria-hidden
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold break-words" style={{ color: "var(--text-strong)" }}>{criterio.nombre}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <PesoStepper criterio={criterio} maxPeso={Math.max(1, 100 - (pesoTotal - criterio.peso))} />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            style={{ color: "var(--text-dim)" }}
                            aria-label="Acciones del criterio"
                          />
                        }
                      >
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => abrirEditar(criterio)}>
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(criterio)}>
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-dim)" }}>
                  {criterio.descripcion}
                </p>

                {/* Aporte del criterio a la calificación final */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--border-hair)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(criterio.peso, 100)}%`, backgroundColor: colorCriterio(i) }}
                    />
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: "var(--text-faint)" }}>
                    {criterio.peso}% del total
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar criterio" : "Agregar criterio"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Actualiza los datos del criterio." : "Registra un nuevo criterio para la rúbrica de evaluación."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Propuesta de valor" style={inputStyle} maxLength={MAX_NOMBRE} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }: { field: ControllerRenderProps<FormValues, "descripcion"> }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Descripción</FormLabel>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>{field.value?.length ?? 0} / {MAX_DESCRIPCION}</span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Qué evalúa este criterio dentro del proyecto."
                        className="min-h-24 resize-none"
                        style={inputStyle}
                        maxLength={MAX_DESCRIPCION}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="peso"
                render={({ field }: { field: ControllerRenderProps<FormValues, "peso"> }) => (
                  <FormItem>
                    <FormLabel>Peso (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="1"
                          max="100"
                          step="1"
                          placeholder="25"
                          className="pr-8"
                          style={inputStyle}
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-faint)" }}>%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={guardando}
                  loadingText={editTarget ? "Guardando…" : "Creando…"}
                  className="border-0"
                  style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
                >
                  {editTarget ? "Guardar cambios" : "Crear criterio"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminado */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar criterio</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `¿Seguro que quieres eliminar "${deleteTarget.nombre}"? Esta acción no se puede deshacer.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              loading={eliminando}
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

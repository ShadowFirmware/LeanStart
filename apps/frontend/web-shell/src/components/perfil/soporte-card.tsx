"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import type { ControllerRenderProps } from "react-hook-form";
import {
  apiFetch, modoDemo, useAccion,
  Button, Input, Textarea,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@leanstart/commons";

const MAX_ASUNTO = 120;
const MAX_MENSAJE = 2000;

// Espeja ReporteSoporteDto del backend: si estos mínimos y máximos se separan,
// el usuario escribe algo que el formulario acepta y el servidor rechaza.
const schema = z.object({
  asunto: z
    .string()
    .min(5, "Describe el problema en al menos 5 caracteres")
    .max(MAX_ASUNTO, `Máximo ${MAX_ASUNTO} caracteres`),
  mensaje: z
    .string()
    .min(20, "Cuéntanos un poco más: mínimo 20 caracteres")
    .max(MAX_MENSAJE, `Máximo ${MAX_MENSAJE} caracteres`),
});

type FormValues = z.infer<typeof schema>;

/**
 * Sección de soporte técnico dentro de "Mi perfil": tarjeta con el botón que
 * abre el diálogo de reporte. Vive aquí y no en un botón flotante ni en el
 * sidebar para no competir con el resto de la interfaz.
 *
 * El reporte va al buzón interno del administrador (/administrador/soporte);
 * no se manda ningún correo. El navegador se adjunta solo: es parte del
 * contexto que hace falta para reproducir la falla y que el usuario casi nunca
 * incluye por su cuenta. La ruta NO se manda — desde el perfil siempre sería la
 * misma y despistaría a quien lea el reporte; por eso el formulario pide que el
 * propio usuario diga en qué pantalla ocurrió.
 */
export function SoporteCard() {
  const [abierto, setAbierto] = useState(false);
  const { cargando, ejecutar } = useAccion();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { asunto: "", mensaje: "" },
  });

  // Limpia el formulario al cerrar: si el usuario vuelve a abrirlo, empieza en
  // blanco en vez de con el reporte que ya mandó (o con el error de la vez pasada).
  useEffect(() => {
    if (!abierto) form.reset();
  }, [abierto, form]);

  async function onSubmit(values: FormValues) {
    if (modoDemo()) {
      toast.error("El envío de reportes necesita el backend real — no está disponible en modo demo.");
      return;
    }

    await ejecutar(
      async () => {
        await apiFetch("/soporte", {
          method: "POST",
          body: JSON.stringify({
            asunto: values.asunto.trim(),
            mensaje: values.mensaje.trim(),
            navegador: typeof navigator === "undefined" ? undefined : navigator.userAgent,
          }),
          etiquetaCarga: "Enviando reporte",
        });
        toast.success("Reporte enviado. El equipo de soporte lo revisará.");
        setAbierto(false);
      },
      {
        etiqueta: "Enviando reporte",
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo enviar el reporte. Inténtalo de nuevo."),
      }
    );
  }

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand)" }}
        >
          <LifeBuoy className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
            Soporte técnico
          </h2>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            ¿Algo no funciona como esperabas? Repórtalo y el administrador lo revisa.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setAbierto(true)}
        className="h-10 rounded-xl font-semibold text-sm w-fit"
      >
        Reportar un problema
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soporte técnico</DialogTitle>
            <DialogDescription>
              Cuéntanos qué falló y lo revisamos. El reporte le llega al administrador.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="asunto"
                render={({ field }: { field: ControllerRenderProps<FormValues, "asunto"> }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel>Asunto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. No carga el canvas de mi empresa" maxLength={MAX_ASUNTO} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mensaje"
                render={({ field }: { field: ControllerRenderProps<FormValues, "mensaje"> }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel>¿Qué pasó?</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        maxLength={MAX_MENSAJE}
                        placeholder="Describe en qué pantalla estabas, qué hiciste y qué esperabas que pasara."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <p className="text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>
                Se adjuntarán automáticamente tu nombre, correo, rol y navegador, para ayudar a
                reproducir la falla y saber cómo contactarte.
              </p>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={cargando}
                  loadingText="Enviando…"
                  className="border-0"
                  style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
                >
                  Enviar reporte
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

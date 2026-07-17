"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Wrench, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@leanstart/commons";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@leanstart/commons";
import { Input } from "@leanstart/commons";
import { Textarea } from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import { useEmpresasStore } from "../store/empresas";
import {
  ServicioPrecioField, SERVICIO_PRECIO_VACIO, validarServicioPrecio, servicioPrecioToStore,
  type ServicioPrecioValue,
} from "../components/servicio-precio-field";

const MAX_NOMBRE = 80;
const MAX_DESCRIPCION = 500;
const MAX_CARACTERISTICAS = 500;

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(MAX_NOMBRE, `Máximo ${MAX_NOMBRE} caracteres`),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(MAX_DESCRIPCION, `Máximo ${MAX_DESCRIPCION} caracteres`),
  caracteristicas: z.string().max(MAX_CARACTERISTICAS, `Máximo ${MAX_CARACTERISTICAS} caracteres`).optional(),
});

type FormValues = z.infer<typeof schema>;

const inputStyle = {
  backgroundColor: "var(--hover-surface)",
  border: "1px solid var(--border-hair)",
  color: "var(--text-strong)",
};

const cardStyle = { backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" };

export function ServicioNewView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const agregarProducto = useEmpresasStore((s) => s.agregarProducto);
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const [loading, setLoading] = useState(false);
  const [precio, setPrecio] = useState<ServicioPrecioValue>(SERVICIO_PRECIO_VACIO);
  const [precioError, setPrecioError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", descripcion: "", caracteristicas: "" },
  });

  if (!empresa) return null;

  async function onSubmit(values: FormValues) {
    const err = validarServicioPrecio(precio);
    setPrecioError(err);
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      await agregarProducto(id, {
        nombre: values.nombre,
        tipo: "servicio",
        descripcion: values.descripcion,
        caracteristicas: values.caracteristicas || undefined,
        ...servicioPrecioToStore(precio),
      });
      toast.success(`"${values.nombre}" fue agregado correctamente.`);
      router.push(`/emprendedor/empresas/${id}/productos`);
    } catch {
      toast.error("No se pudo agregar el servicio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href={`/emprendedor/empresas/${id}/productos`}
        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" /> Productos
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <Wrench className="w-5 h-5" style={{ color: "#10B981" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Nuevo servicio</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
            Un servicio que ofrece <span style={{ color: "var(--text-strong)" }}>{empresa.nombre}</span>.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* Nombre */}
          <div className="rounded-2xl p-4 md:p-6" style={cardStyle}>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                <FormItem className="gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                      Nombre del servicio
                    </FormLabel>
                    <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {field.value?.length ?? 0} / {MAX_NOMBRE}
                    </span>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Ej. Consultoría de marca personalizada"
                      className="h-9 text-sm focus-visible:ring-0"
                      style={inputStyle}
                      maxLength={MAX_NOMBRE}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Descripción */}
          <div className="rounded-2xl p-4 md:p-6" style={cardStyle}>
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }: { field: ControllerRenderProps<FormValues, "descripcion"> }) => (
                <FormItem className="gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                      Descripción
                    </FormLabel>
                    <span className="text-xs" style={{ color: (field.value?.length ?? 0) < 10 ? "var(--text-faint)" : "var(--text-dim)" }}>
                      {field.value?.length ?? 0} / {MAX_DESCRIPCION} (mín. 10)
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el servicio: qué incluye, cómo se entrega, qué problema resuelve."
                      className="min-h-28 resize-none text-sm focus-visible:ring-0"
                      style={inputStyle}
                      maxLength={MAX_DESCRIPCION}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Modalidad de precio */}
          <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-4" style={cardStyle}>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: "var(--brand)" }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                Modalidad de precio
              </span>
            </div>
            <ServicioPrecioField
              value={precio}
              onChange={(v) => { setPrecio(v); if (precioError) setPrecioError(validarServicioPrecio(v)); }}
              error={precioError ?? undefined}
            />
          </div>

          {/* Características (opcional) */}
          <div className="rounded-2xl p-4 md:p-6" style={cardStyle}>
            <FormField
              control={form.control}
              name="caracteristicas"
              render={({ field }: { field: ControllerRenderProps<FormValues, "caracteristicas"> }) => (
                <FormItem className="gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                      Características
                    </FormLabel>
                    <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                      Opcional · {field.value?.length ?? 0} / {MAX_CARACTERISTICAS}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder={"Ej.\nAtención personalizada\nEntrega en 48h\nRevisiones incluidas"}
                      className="min-h-28 resize-none text-sm focus-visible:ring-0"
                      style={inputStyle}
                      maxLength={MAX_CARACTERISTICAS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              nativeButton={false}
              className="h-9 px-5 text-sm"
              style={{ backgroundColor: "var(--border-subtle)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              render={<Link href={`/emprendedor/empresas/${id}/productos`} />}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-6 text-sm font-semibold border-0"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              {loading ? "Guardando..." : "Guardar servicio"}
            </Button>
          </div>

        </form>
      </Form>
      </div>
    </div>
  );
}

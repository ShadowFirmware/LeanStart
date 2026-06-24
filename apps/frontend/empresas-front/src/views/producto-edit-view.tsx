"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@leanstart/commons";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@leanstart/commons";
import { Input } from "@leanstart/commons";
import { Textarea } from "@leanstart/commons";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import type { TipoProducto } from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";

const TIPOS: { value: TipoProducto; label: string }[] = [
  { value: "producto", label: "Producto" },
  { value: "servicio", label: "Servicio" },
];

const MAX_NOMBRE = 80;
const MAX_DESCRIPCION = 500;
const MAX_CARACTERISTICAS = 500;
const MAX_PRECIO = 9_999_999.99;

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(MAX_NOMBRE, `Máximo ${MAX_NOMBRE} caracteres`),
  tipo: z.enum(["producto", "servicio"], { error: "Selecciona un tipo" }),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(MAX_DESCRIPCION, `Máximo ${MAX_DESCRIPCION} caracteres`),
  caracteristicas: z.string().max(MAX_CARACTERISTICAS, `Máximo ${MAX_CARACTERISTICAS} caracteres`).optional(),
  precio: z.string().optional().refine(
    (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= MAX_PRECIO),
    `El precio debe estar entre 0 y ${MAX_PRECIO.toLocaleString("es-MX")}`
  ),
});

type FormValues = z.infer<typeof schema>;

const inputStyle = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#F2F0F7",
};

export function ProductoEditView() {
  const { id, pid } = useParams<{ id: string; pid: string }>();
  const router = useRouter();
  const actualizarProducto = useEmpresasStore((s) => s.actualizarProducto);
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const producto = empresa?.productosList?.find((p) => p.id === pid);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: producto
      ? {
          nombre: producto.nombre,
          tipo: producto.tipo,
          descripcion: producto.descripcion,
          caracteristicas: producto.caracteristicas ?? "",
          precio: producto.precio != null ? String(producto.precio) : "",
        }
      : { nombre: "", tipo: "" as TipoProducto, descripcion: "", caracteristicas: "", precio: "" },
  });

  if (!empresa || !producto) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Link href={`/emprendedor/empresas/${id}/productos`} className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "#7E7C86" }}>
          <ArrowLeft className="w-4 h-4" /> Productos
        </Link>
        <p className="text-sm" style={{ color: "#7E7C86" }}>Este producto no existe o fue eliminado.</p>
      </div>
    );
  }

  function onSubmit(values: FormValues) {
    setLoading(true);
    const precio = values.precio ? parseFloat(values.precio) : undefined;
    actualizarProducto(id, pid, {
      nombre: values.nombre,
      tipo: values.tipo,
      descripcion: values.descripcion,
      caracteristicas: values.caracteristicas || undefined,
      precio: isNaN(precio!) ? undefined : precio,
    });
    toast.success(`"${values.nombre}" se actualizó correctamente.`);
    router.push(`/emprendedor/empresas/${id}/productos`);
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/emprendedor/empresas/${id}/productos`}
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "#7E7C86" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
        >
          <ArrowLeft className="w-4 h-4" /> Productos
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Editar producto</h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
            Actualiza los datos de <span style={{ color: "#F2F0F7" }} className="break-words">{producto.nombre}</span>.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Nombre + Tipo */}
            <div
              className="rounded-2xl p-4 md:p-6 flex flex-col gap-5"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
                        Nombre del producto
                      </FormLabel>
                      <span className="text-xs" style={{ color: "#4A4850" }}>
                        {field.value?.length ?? 0} / {MAX_NOMBRE}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Ej. Botella inteligente 500ml"
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

              <FormItem className="gap-1.5">
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
                  Tipo
                </FormLabel>
                <Controller
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-9 text-sm focus-visible:ring-0" style={inputStyle}>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent side="bottom" sideOffset={4}>
                        {TIPOS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.tipo && (
                  <p className="text-xs text-destructive">{form.formState.errors.tipo.message}</p>
                )}
              </FormItem>
            </div>

            {/* Descripción */}
            <div
              className="rounded-2xl p-4 md:p-6"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }: { field: ControllerRenderProps<FormValues, "descripcion"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
                        Descripción
                      </FormLabel>
                      <span className="text-xs" style={{ color: (field.value?.length ?? 0) < 10 ? "#4A4850" : "#7E7C86" }}>
                        {field.value?.length ?? 0} / {MAX_DESCRIPCION} (mín. 10)
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el producto: qué es, cómo funciona, qué problema resuelve."
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

            {/* Características */}
            <div
              className="rounded-2xl p-4 md:p-6"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <FormField
                control={form.control}
                name="caracteristicas"
                render={({ field }: { field: ControllerRenderProps<FormValues, "caracteristicas"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
                        Características
                      </FormLabel>
                      <span className="text-xs" style={{ color: "#4A4850" }}>
                        Opcional · {field.value?.length ?? 0} / {MAX_CARACTERISTICAS}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={"Ej.\nMaterial resistente al agua\nCarga rápida"}
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

            {/* Precio */}
            <div
              className="rounded-2xl p-4 md:p-6"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <FormField
                control={form.control}
                name="precio"
                render={({ field }: { field: ControllerRenderProps<FormValues, "precio"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
                        Precio
                      </FormLabel>
                      <span className="text-xs" style={{ color: "#4A4850" }}>Opcional</span>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#4A4850" }}>$</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max={MAX_PRECIO}
                          step="0.01"
                          placeholder="0.00"
                          className="h-9 pl-6 text-sm focus-visible:ring-0"
                          style={inputStyle}
                          {...field}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= MAX_PRECIO && v.length <= 12)) {
                              field.onChange(v);
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <Button
                type="button"
                nativeButton={false}
                className="h-9 px-5 text-sm justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
                render={<Link href={`/emprendedor/empresas/${id}/productos`} />}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-6 text-sm font-semibold border-0 justify-center"
                style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

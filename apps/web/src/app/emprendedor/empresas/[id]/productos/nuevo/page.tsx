"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ControllerRenderProps } from "react-hook-form";
import type { TipoProducto } from "@/types";
import { useEmpresasStore } from "@/store/empresas";

const TIPOS: { value: TipoProducto; label: string; descripcion: string }[] = [
  { value: "producto", label: "Producto", descripcion: "Bien o artículo tangible o digital" },
  { value: "servicio", label: "Servicio", descripcion: "Actividad o trabajo que se presta al cliente" },
];

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  tipo: z.enum(["producto", "servicio"], {
    error: "Selecciona un tipo",
  }),
  descripcion: z.string().min(10, "Mínimo 10 caracteres"),
  precio: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputStyle = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#F2F0F7",
};

export default function NuevoProductoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const agregarProducto = useEmpresasStore((s) => s.agregarProducto);
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", tipo: "" as TipoProducto, descripcion: "", precio: "" },
  });

  if (!empresa) return null;

  function onSubmit(values: FormValues) {
    setLoading(true);
    const precio = values.precio ? parseFloat(values.precio) : undefined;
    agregarProducto(id, {
      nombre: values.nombre,
      tipo: values.tipo,
      descripcion: values.descripcion,
      precio: isNaN(precio!) ? undefined : precio,
    });
    toast.success(`"${values.nombre}" fue agregado correctamente.`);
    router.push(`/emprendedor/empresas/${id}/productos`);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href={`/emprendedor/empresas/${id}/productos`}
        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" /> Productos
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Nuevo producto</h1>
        <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
          Agrega un producto o servicio de <span style={{ color: "#F2F0F7" }}>{empresa.nombre}</span>.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* Nombre + Tipo */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
                    Nombre del producto
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Botella inteligente 500ml"
                      className="h-9 text-sm focus-visible:ring-0"
                      style={inputStyle}
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
                    <SelectContent>
                      {TIPOS.map(({ value, label, descripcion }) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <span>{label}</span>
                            <span className="ml-2 text-xs opacity-50">{descripcion}</span>
                          </div>
                        </SelectItem>
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
            className="rounded-2xl p-6"
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
                      {field.value?.length ?? 0} / mín. 10
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el producto: qué es, cómo funciona, qué problema resuelve."
                      className="min-h-28 resize-none text-sm focus-visible:ring-0"
                      style={inputStyle}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Precio (opcional) */}
          <div
            className="rounded-2xl p-6"
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
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                        style={{ color: "#4A4850" }}
                      >
                        $
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="h-9 pl-6 text-sm focus-visible:ring-0"
                        style={inputStyle}
                        {...field}
                      />
                    </div>
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
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
              render={<Link href={`/emprendedor/empresas/${id}/productos`} />}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-6 text-sm font-semibold border-0"
              style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
            >
              {loading ? "Guardando..." : "Guardar producto"}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}

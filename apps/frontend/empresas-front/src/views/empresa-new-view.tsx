"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@leanstart/commons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@leanstart/commons";
import { Input } from "@leanstart/commons";
import { Textarea } from "@leanstart/commons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import type { GiroEmpresa } from "@leanstart/commons";
import { fileToDataUrl } from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";

const GIROS: { value: GiroEmpresa; label: string }[] = [
  { value: "tecnologia", label: "Tecnología" },
  { value: "educacion", label: "Educación" },
  { value: "salud", label: "Salud" },
  { value: "sustentabilidad", label: "Sustentabilidad" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "comercio", label: "Comercio" },
  { value: "servicios", label: "Servicios" },
];

const MAX_NOMBRE = 80;
const MAX_DESCRIPCION = 500;
const MAX_MERCADO = 500;

const schema = z.object({
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(MAX_NOMBRE, `Máximo ${MAX_NOMBRE} caracteres`),
  giro: z.enum(
    ["tecnologia", "educacion", "salud", "sustentabilidad", "alimentacion", "comercio", "servicios"],
    { error: "Selecciona un giro" }
  ),
  descripcion: z.string().min(20, "Mínimo 20 caracteres").max(MAX_DESCRIPCION, `Máximo ${MAX_DESCRIPCION} caracteres`),
  mercadoObjetivo: z.string().min(20, "Mínimo 20 caracteres").max(MAX_MERCADO, `Máximo ${MAX_MERCADO} caracteres`),
});

type FormValues = z.infer<typeof schema>;

export function EmpresaNewView() {
  const router = useRouter();
  const agregarEmpresa = useEmpresasStore((s) => s.agregarEmpresa);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", giro: "" as GiroEmpresa, descripcion: "", mercadoObjetivo: "" },
  });

  const nombreActual = form.watch("nombre");

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen es muy grande. Máximo 2MB.");
      e.target.value = "";
      return;
    }
    const validos = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validos.includes(file.type)) {
      toast.error("Formato no soportado. Usa PNG, JPG, SVG o WebP.");
      e.target.value = "";
      return;
    }

    setLogoFile(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoPreview(dataUrl);
      toast.success(`Imagen "${file.name}" lista.`);
    } catch {
      toast.error("No se pudo leer la imagen.");
    }
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nombre", values.nombre);
      formData.append("giro", values.giro);
      formData.append("descripcion", values.descripcion);
      formData.append("mercadoObjetivo", values.mercadoObjetivo);
      formData.append("estado", "borrador");
      if (logoFile) formData.append("logo", logoFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/empresas`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("api_unavailable");

      const empresa = await res.json();
      toast.success(`"${values.nombre}" fue registrada correctamente.`);
      router.push(`/emprendedor/empresas/${empresa.id}`);
    } catch {
      // Backend no disponible — guardar en store local
      const id = agregarEmpresa({
        nombre: values.nombre,
        giro: values.giro,
        descripcion: values.descripcion,
        mercadoObjetivo: values.mercadoObjetivo,
        logoUrl: logoPreview ?? undefined,
      });
      toast.success(`"${values.nombre}" fue registrada correctamente.`);
      router.push(`/emprendedor/empresas/${id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/emprendedor/empresas"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" />
        Mis Empresas
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>
          Nueva empresa
        </h1>
        <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
          Registra la información general. Después podrás agregar productos,
          el Lean Canvas y tus hipótesis.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* Logo + identidad */}
          <div
            className="rounded-2xl p-4 md:p-6 flex items-center gap-6"
            style={{
              backgroundColor: "#131219",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Logo upload */}
            <div className="shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden group transition-colors"
                style={{
                  backgroundColor: "rgba(154,98,250,0.10)",
                  border: "2px dashed rgba(154,98,250,0.3)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.6)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.3)")
                }
              >
                {logoPreview ? (
                  <>
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                      <Camera className="w-5 h-5" style={{ color: "#F2F0F7" }} />
                    </div>
                  </>
                ) : nombreActual ? (
                  <>
                    <span className="text-2xl font-bold" style={{ color: "#9A62FA" }}>
                      {nombreActual.charAt(0).toUpperCase()}
                    </span>
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: "rgba(13,12,16,0.6)" }}
                    >
                      <Camera className="w-5 h-5" style={{ color: "#F2F0F7" }} />
                    </div>
                  </>
                ) : (
                  <Camera className="w-6 h-6" style={{ color: "#9A62FA" }} />
                )}
              </button>
            </div>

            {/* Nombre + Giro */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: "#7E7C86" }}
                      >
                        Nombre de la empresa
                      </FormLabel>
                      <span className="text-xs" style={{ color: "#4A4850" }}>
                        {field.value?.length ?? 0} / {MAX_NOMBRE}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Ej. EcoBottle"
                        className="h-9 text-sm focus-visible:ring-0"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#F2F0F7",
                        }}
                        maxLength={MAX_NOMBRE}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormItem className="gap-1.5">
                <FormLabel
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: "#7E7C86" }}
                >
                  Giro o categoría
                </FormLabel>
                <Controller
                  control={form.control}
                  name="giro"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="w-full h-9 text-sm focus-visible:ring-0"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#F2F0F7",
                        }}
                      >
                        <SelectValue placeholder="Selecciona un giro" />
                      </SelectTrigger>
                      <SelectContent>
                        {GIROS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.giro && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.giro.message}
                  </p>
                )}
              </FormItem>
            </div>
          </div>

          {/* Descripción + Mercado */}
          <div
            className="rounded-2xl p-4 md:p-6 flex flex-col gap-5"
            style={{
              backgroundColor: "#131219",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }: { field: ControllerRenderProps<FormValues, "descripcion"> }) => (
                <FormItem className="gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "#7E7C86" }}
                    >
                      Descripción
                    </FormLabel>
                    <span
                      className="text-xs"
                      style={{ color: (field.value?.length ?? 0) < 20 ? "#4A4850" : "#7E7C86" }}
                    >
                      {field.value?.length ?? 0} / {MAX_DESCRIPCION} (mín. 20)
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe en qué consiste tu empresa o idea de negocio."
                      className="min-h-24 resize-none text-sm focus-visible:ring-0"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#F2F0F7",
                      }}
                      maxLength={MAX_DESCRIPCION}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div
              className="h-px w-full"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            />

            <FormField
              control={form.control}
              name="mercadoObjetivo"
              render={({ field }: { field: ControllerRenderProps<FormValues, "mercadoObjetivo"> }) => (
                <FormItem className="gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "#7E7C86" }}
                    >
                      Mercado objetivo
                    </FormLabel>
                    <span
                      className="text-xs"
                      style={{ color: (field.value?.length ?? 0) < 20 ? "#4A4850" : "#7E7C86" }}
                    >
                      {field.value?.length ?? 0} / {MAX_MERCADO} (mín. 20)
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="¿A quién va dirigida tu empresa? Describe el perfil de tu cliente ideal."
                      className="min-h-24 resize-none text-sm focus-visible:ring-0"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#F2F0F7",
                      }}
                      maxLength={MAX_MERCADO}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "#4A4850" }}>
              Se registrará con estado{" "}
              <span style={{ color: "#9A62FA" }}>Borrador</span>
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                nativeButton={false}
                className="h-9 px-5 text-sm"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F2F0F7",
                }}
                render={<Link href="/emprendedor/empresas" />}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-6 text-sm font-semibold border-0"
                style={{
                  background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
                  color: "#FBFBFC",
                }}
              >
                {loading ? "Registrando..." : "Registrar empresa"}
              </Button>
            </div>
          </div>

        </form>
      </Form>
      </div>
    </div>
  );
}

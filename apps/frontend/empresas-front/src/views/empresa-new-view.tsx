"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, AlertCircle } from "lucide-react";
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
import { compressImageToDataUrl, compressImageToBlob, apiUpload, modoDemo, useCurrentUser } from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import { useNombreDuplicado } from "../hooks/use-nombre-duplicado";

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
  const currentUser = useCurrentUser();
  const agregarEmpresa = useEmpresasStore((s) => s.agregarEmpresa);
  const actualizarEmpresa = useEmpresasStore((s) => s.actualizarEmpresa);
  const empresasExistentes = useEmpresasStore((s) => s.empresas);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", giro: "" as GiroEmpresa, descripcion: "", mercadoObjetivo: "" },
  });

  const nombreActual = form.watch("nombre");
  const nombreDuplicado = useNombreDuplicado(nombreActual, empresasExistentes);

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

    try {
      // Solo para la vista previa en pantalla — el archivo real (logoFile) se sube a
      // S3 después de crear la empresa, cuando ya existe el id que necesita la ruta.
      const dataUrl = await compressImageToDataUrl(file, { maxDimension: 512, mimeType: "image/png" });
      setLogoPreview(dataUrl);
      setLogoFile(file);
      toast.success(`Imagen "${file.name}" lista.`);
    } catch {
      toast.error("No se pudo leer la imagen.");
    }
  }

  async function onSubmit(values: FormValues) {
    if (nombreDuplicado) return;

    setLoading(true);
    try {
      // En modo real el logo se sube por separado (necesita el id de la empresa),
      // así que aquí se crea sin logoUrl; en demo no hay backend al que subirlo,
      // así que se conserva el data URL como antes.
      const id = await agregarEmpresa({
        nombre: values.nombre,
        giro: values.giro,
        descripcion: values.descripcion,
        mercadoObjetivo: values.mercadoObjetivo,
        logoUrl: modoDemo() ? (logoPreview ?? undefined) : undefined,
        ownerId: currentUser?.id,
      });

      if (!modoDemo() && logoFile) {
        try {
          const blob = await compressImageToBlob(logoFile, { maxDimension: 512, mimeType: "image/png" });
          const { logoUrl } = await apiUpload<{ logoUrl: string }>(`/empresas/${id}/logo`, blob, {
            nombreArchivo: logoFile.name,
            etiquetaCarga: null,
          });
          await actualizarEmpresa(id, { logoUrl });
        } catch {
          toast.error("La empresa se creó, pero el logo no se pudo subir. Puedes intentarlo de nuevo después.");
        }
      }

      toast.success(`"${values.nombre}" fue registrada correctamente.`);
      router.push(`/emprendedor/empresas/${id}`);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : undefined;
      toast.error(mensaje || "No se pudo registrar la empresa. Inténtalo de nuevo.");
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
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" />
        Mis Empresas
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
          Nueva empresa
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
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
              backgroundColor: "var(--surface-profile)",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--border-subtle)",
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
                  ((e.currentTarget as HTMLElement).style.borderColor = "var(--brand-line)")
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
                      className="object-contain p-2"
                      unoptimized
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                      <Camera className="w-5 h-5" style={{ color: "var(--text-strong)" }} />
                    </div>
                  </>
                ) : nombreActual ? (
                  <>
                    <span className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
                      {nombreActual.charAt(0).toUpperCase()}
                    </span>
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: "var(--shell-header)" }}
                    >
                      <Camera className="w-5 h-5" style={{ color: "var(--text-strong)" }} />
                    </div>
                  </>
                ) : (
                  <Camera className="w-6 h-6" style={{ color: "var(--brand)" }} />
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
                        style={{ color: "var(--text-dim)" }}
                      >
                        Nombre de la empresa
                      </FormLabel>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {field.value?.length ?? 0} / {MAX_NOMBRE}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Ej. EcoBottle"
                        className="h-9 text-sm focus-visible:ring-0"
                        style={{
                          backgroundColor: "var(--hover-surface)",
                          border: "1px solid var(--border-hair)",
                          color: "var(--text-strong)",
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
                  style={{ color: "var(--text-dim)" }}
                >
                  Giro o categoría
                </FormLabel>
                <Controller
                  control={form.control}
                  name="giro"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} items={GIROS}>
                      <SelectTrigger
                        className="w-full h-9 text-sm focus-visible:ring-0"
                        style={{
                          backgroundColor: "var(--hover-surface)",
                          border: "1px solid var(--border-hair)",
                          color: "var(--text-strong)",
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
              backgroundColor: "var(--surface-profile)",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--border-subtle)",
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
                      style={{ color: "var(--text-dim)" }}
                    >
                      Descripción
                    </FormLabel>
                    <span
                      className="text-xs"
                      style={{ color: (field.value?.length ?? 0) < 20 ? "var(--text-faint)" : "var(--text-dim)" }}
                    >
                      {field.value?.length ?? 0} / {MAX_DESCRIPCION} (mín. 20)
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe en qué consiste tu empresa o idea de negocio."
                      className="min-h-24 resize-none text-sm focus-visible:ring-0"
                      style={{
                        backgroundColor: "var(--hover-surface)",
                        border: "1px solid var(--border-hair)",
                        color: "var(--text-strong)",
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
              style={{ backgroundColor: "var(--border-subtle)" }}
            />

            <FormField
              control={form.control}
              name="mercadoObjetivo"
              render={({ field }: { field: ControllerRenderProps<FormValues, "mercadoObjetivo"> }) => (
                <FormItem className="gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-dim)" }}
                    >
                      Mercado objetivo
                    </FormLabel>
                    <span
                      className="text-xs"
                      style={{ color: (field.value?.length ?? 0) < 20 ? "var(--text-faint)" : "var(--text-dim)" }}
                    >
                      {field.value?.length ?? 0} / {MAX_MERCADO} (mín. 20)
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="¿A quién va dirigida tu empresa? Describe el perfil de tu cliente ideal."
                      className="min-h-24 resize-none text-sm focus-visible:ring-0"
                      style={{
                        backgroundColor: "var(--hover-surface)",
                        border: "1px solid var(--border-hair)",
                        color: "var(--text-strong)",
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

          {/* Alerta de nombre duplicado — persistente, no un toast que desaparece solo */}
          {nombreDuplicado && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#EF4444",
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              El nombre de esta empresa ya está utilizado. Elige uno diferente.
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Se registrará con estado{" "}
              <span style={{ color: "var(--brand)" }}>Borrador</span>
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                nativeButton={false}
                className="h-9 px-5 text-sm"
                style={{
                  backgroundColor: "var(--border-subtle)",
                  border: "1px solid var(--border-hair)",
                  color: "var(--text-strong)",
                }}
                render={<Link href="/emprendedor/empresas" />}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={nombreDuplicado}
                loading={loading}
                loadingText="Registrando…"
                className="h-9 px-6 text-sm font-semibold border-0"
                style={{
                  background: "var(--brand-gradient)",
                  color: "var(--brand-fg)",
                }}
              >
                Registrar empresa
              </Button>
            </div>
          </div>

        </form>
      </Form>
      </div>
    </div>
  );
}

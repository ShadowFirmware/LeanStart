"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Camera, Trash2, ShieldCheck, Palette } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ControllerRenderProps } from "react-hook-form";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
  Input, Button,
  useCurrentUser, usePerfilStore, useHasHydrated, compressImageToDataUrl,
  type Role,
} from "@leanstart/commons";

const ROL_LABEL: Record<Role, string> = {
  administrador: "Administrador",
  emprendedor: "Emprendedor",
  mentor: "Mentor",
  evaluador: "Evaluador",
};

const perfilSchema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto"),
  correo: z.email("Correo electrónico inválido"),
});

type PerfilFormValues = z.infer<typeof perfilSchema>;

export function PerfilView() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const hydrated = useHasHydrated();
  const overrides = usePerfilStore((s) => (currentUser ? s.perfiles[currentUser.id] : undefined));
  const actualizarPerfil = usePerfilStore((s) => s.actualizarPerfil);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);

  const nombreBase = (hydrated && overrides?.nombre) || currentUser?.name || "";
  const correoBase = (hydrated && overrides?.correo) || currentUser?.email || "";

  const form = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: nombreBase, correo: correoBase },
  });

  // Sincroniza los valores una vez que el store hidrata / cambia el usuario.
  useEffect(() => {
    if (!currentUser) return;
    form.reset({ nombre: nombreBase, correo: correoBase });
    setAvatarUrl(overrides?.avatarUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, hydrated, overrides?.nombre, overrides?.correo, overrides?.avatarUrl]);

  if (!currentUser) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--text-dim)" }}>
        No hay una sesión activa.
      </div>
    );
  }

  const rol = currentUser.rol;
  const inicial = (form.watch("nombre") || currentUser.name || "?").charAt(0).toUpperCase();

  async function handleAvatarFile(file: File) {
    setSubiendoAvatar(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, {
        maxDimension: 256,
        quality: 0.8,
        mimeType: file.type === "image/png" ? "image/png" : "image/jpeg",
      });
      setAvatarUrl(dataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen.");
    } finally {
      setSubiendoAvatar(false);
    }
  }

  function onSubmit(values: PerfilFormValues) {
    if (!currentUser) return;
    actualizarPerfil(currentUser.id, {
      nombre: values.nombre.trim(),
      correo: values.correo.trim(),
      avatarUrl,
    });
    toast.success("Perfil actualizado correctamente.");
    // Regresa a la vista desde la que se abrió el perfil (no forzamos el
    // dashboard). Si no hay historial previo, caemos al inicio del rol.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${rol}/dashboard`);
    }
  }

  const inputStyle = {
    backgroundColor: "var(--input-surface)",
    border: "1px solid var(--border-hair)",
    color: "var(--text-strong)",
  } as const;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <Link
        href={`/${rol}/dashboard`}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-strong)" }}>
          Mi perfil
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Consulta y actualiza la información de tu cuenta.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-6"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Avatar + rol */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold overflow-hidden shrink-0"
              style={{ backgroundColor: "var(--brand-tint-strong)", color: "var(--brand)" }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                inicial
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)", border: "2px solid var(--surface-profile)" }}
              aria-label="Cambiar foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarFile(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit"
              style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand-accent)" }}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> {ROL_LABEL[rol]}
            </span>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(undefined)}
                className="inline-flex items-center gap-1 text-xs w-fit transition-colors"
                style={{ color: "var(--destructive)" }}
              >
                <Trash2 className="w-3 h-3" /> Quitar foto
              </button>
            )}
          </div>
        </div>

        <div className="h-px w-full" style={{ background: "var(--border-subtle)" }} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }: { field: ControllerRenderProps<PerfilFormValues, "nombre"> }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    Nombre completo
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" className="focus-visible:ring-0" style={inputStyle} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="correo"
              render={({ field }: { field: ControllerRenderProps<PerfilFormValues, "correo"> }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    Correo electrónico
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" className="focus-visible:ring-0" style={inputStyle} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={subiendoAvatar}
                className="h-10 rounded-xl font-semibold text-sm border-0"
                style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
              >
                Guardar cambios
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl text-sm"
                onClick={() => {
                  form.reset({ nombre: nombreBase, correo: correoBase });
                  setAvatarUrl(overrides?.avatarUrl);
                }}
              >
                Descartar
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Apariencia — selector de tema claro / oscuro / sistema */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand)" }}
          >
            <Palette className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
              Apariencia
            </h2>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Elige el tema de la interfaz. &quot;Sistema&quot; sigue la configuración de tu dispositivo.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

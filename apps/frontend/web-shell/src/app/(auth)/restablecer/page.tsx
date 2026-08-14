"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  apiFetch,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";

const restablecerSchema = z
  .object({
    password: z.string().min(8, "Debe tener al menos 8 caracteres"),
    confirmar: z.string(),
  })
  .refine((data) => data.password === data.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

type RestablecerFormValues = z.infer<typeof restablecerSchema>;

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Link
        href="/login"
        className="absolute top-10 left-12 z-10 flex items-center gap-2 text-sm transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a iniciar sesión
      </Link>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(154,98,250,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(174,108,253,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div
        className="relative w-full max-w-[420px] rounded-2xl p-8 flex flex-col gap-7"
        style={{
          backgroundColor: "var(--surface-glass)",
          border: "1px solid var(--brand-tint-strong)",
          backdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, var(--brand-line), transparent)" }}
        />
        <div className="flex flex-col items-center gap-4">
          <Logo height={32} priority />
          {children}
        </div>
      </div>
    </div>
  );
}

function RestablecerForm() {
  const token = useSearchParams().get("token");
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);
  const [invalido, setInvalido] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RestablecerFormValues>({
    resolver: zodResolver(restablecerSchema),
    defaultValues: { password: "", confirmar: "" },
  });

  async function onSubmit(values: RestablecerFormValues) {
    if (!token) return;
    setLoading(true);
    try {
      await apiFetch("/auth/restablecer", {
        method: "POST",
        body: JSON.stringify({ token, password: values.password }),
        skipAuth: true,
        etiquetaCarga: null,
      });
      setListo(true);
    } catch (error) {
      // El backend responde 401 con este mismo mensaje si el token ya expiró,
      // ya se usó, o nunca existió — no hay forma de distinguirlos ni falta.
      setInvalido(true);
      toast.error(error instanceof Error ? error.message : "El enlace no es válido o ya expiró.");
    } finally {
      setLoading(false);
    }
  }

  if (!token || invalido) {
    return (
      <>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            Enlace no válido
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {token
              ? "Este enlace ya expiró, ya se usó, o es incorrecto."
              : "Falta el token de recuperación en la URL."}
          </p>
        </div>
        <div className="h-px w-full" style={{ background: "var(--border-subtle)" }} />
        <div className="flex flex-col items-center gap-4 w-full">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(239,68,68,0.12)" }}
          >
            <XCircle className="w-7 h-7" style={{ color: "#EF4444" }} />
          </div>
          <Link
            href="/recuperar"
            className="h-11 w-full rounded-xl font-semibold text-sm flex items-center justify-center border-0 transition-all duration-200"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            Pedir un enlace nuevo
          </Link>
        </div>
      </>
    );
  }

  if (listo) {
    return (
      <>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            Contraseña actualizada
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <div className="h-px w-full" style={{ background: "var(--border-subtle)" }} />
        <div className="flex flex-col items-center gap-4 w-full">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(154,98,250,0.15)" }}
          >
            <CheckCircle2 className="w-7 h-7" style={{ color: "var(--brand-accent)" }} />
          </div>
          <Link
            href="/login"
            className="h-11 w-full rounded-xl font-semibold text-sm flex items-center justify-center border-0 transition-all duration-200"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            Iniciar sesión
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center space-y-1">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Elige tu nueva contraseña
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Mínimo 8 caracteres.
        </p>
      </div>
      <div className="h-px w-full" style={{ background: "var(--border-subtle)" }} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full">
          <FormField
            control={form.control}
            name="password"
            render={({ field }: { field: ControllerRenderProps<RestablecerFormValues, "password"> }) => (
              <FormItem className="gap-1.5">
                <FormLabel
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Nueva contraseña
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input-auth focus-visible:ring-0 pr-11"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "var(--text-dim)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmar"
            render={({ field }: { field: ControllerRenderProps<RestablecerFormValues, "confirmar"> }) => (
              <FormItem className="gap-1.5">
                <FormLabel
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Confirmar contraseña
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input-auth focus-visible:ring-0 pr-11"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "var(--text-dim)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl font-semibold text-sm mt-1 border-0 transition-all duration-200"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--brand-gradient-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--brand-gradient)";
            }}
          >
            {loading ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      </Form>
    </>
  );
}

export default function RestablecerPage() {
  return (
    <CardShell>
      <Suspense fallback={null}>
        <RestablecerForm />
      </Suspense>
    </CardShell>
  );
}

"use client";

import { useState } from "react";
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
  modoDemo,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";

const recuperarSchema = z.object({
  email: z.email("Correo electrónico inválido"),
});

type RecuperarFormValues = z.infer<typeof recuperarSchema>;

export default function RecuperarPage() {
  const [loading, setLoading] = useState(false);
  const [enviadoA, setEnviadoA] = useState<string | null>(null);

  const form = useForm<RecuperarFormValues>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RecuperarFormValues) {
    setLoading(true);
    try {
      if (modoDemo()) {
        // Sin backend real en modo demo: no hay a quién mandarle el correo.
        // La respuesta es genérica de cualquier forma (nunca revela si el
        // correo existe), así que simular el mismo resultado es honesto.
        await new Promise((r) => setTimeout(r, 700));
      } else {
        await apiFetch("/auth/recuperar", {
          method: "POST",
          body: JSON.stringify({ correo: values.email }),
          skipAuth: true,
          etiquetaCarga: null,
        });
      }
      setEnviadoA(values.email);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el correo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Back button */}
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

      {/* Radial glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(154,98,250,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(174,108,253,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Card */}
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
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--brand-line), transparent)",
          }}
        />

        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-4">
          <Logo height={32} priority />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
              {enviadoA ? "Revisa tu correo" : "Recuperar contraseña"}
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {enviadoA
                ? "Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña."
                : "Ingresa tu correo y te enviaremos instrucciones para restablecerla."}
            </p>
          </div>
        </div>

        <div className="h-px w-full" style={{ background: "var(--border-subtle)" }} />

        {enviadoA ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(154,98,250,0.15)" }}
              >
                <MailCheck className="w-7 h-7" style={{ color: "var(--brand-accent)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-strong)" }}>
                Enviamos las instrucciones a{" "}
                <span className="font-medium">{enviadoA}</span>.
              </p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                ¿No lo ves? Revisa tu carpeta de spam o vuelve a intentarlo.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setEnviadoA(null);
                  form.reset();
                }}
                className="h-11 w-full rounded-xl font-medium text-sm transition-colors"
                style={{
                  backgroundColor: "var(--hover-surface)",
                  border: "1px solid var(--border-hair)",
                  color: "var(--text-strong)",
                }}
              >
                Usar otro correo
              </button>
              <Link
                href="/login"
                className="h-11 w-full rounded-xl font-semibold text-sm flex items-center justify-center border-0 transition-all duration-200"
                style={{
                  background: "var(--brand-gradient)",
                  color: "var(--brand-fg)",
                }}
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="email"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<RecuperarFormValues, "email">;
                }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Correo electrónico
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="input-auth focus-visible:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl font-semibold text-sm mt-1 border-0 transition-all duration-200"
                style={{
                  background: "var(--brand-gradient)",
                  color: "var(--brand-fg)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--brand-gradient-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--brand-gradient)";
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar instrucciones"
                )}
              </Button>

              <p className="text-center text-sm" style={{ color: "var(--text-dim)" }}>
                ¿Recordaste tu contraseña?{" "}
                <Link
                  href="/login"
                  className="transition-colors"
                  style={{ color: "var(--brand)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand-accent)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand)")}
                >
                  Iniciar sesión
                </Link>
              </p>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}

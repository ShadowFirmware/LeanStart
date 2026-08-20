"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
} from "@leanstart/commons";
import { Input } from "@leanstart/commons";
import { Button } from "@leanstart/commons";
import { toast } from "sonner";
import type { ControllerRenderProps } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/logo";

const loginSchema = z.object({
  email: z.email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Credenciales incorrectas. Verifica tu correo y contraseña.");
      return;
    }

    // Quien redirige a la home del rol tras un login correcto es el middleware
    // (proxy.ts), al re-ejecutarse con router.refresh(). Pero si llegamos aquí con
    // ?sesion=expirada ese rebote está desactivado a propósito — es la marca que
    // corta el bucle de cierre de sesión — así que hay que recargar sin ella para
    // que el middleware vuelva a hacer su trabajo.
    if (new URLSearchParams(window.location.search).has("sesion")) {
      window.location.replace("/login");
      return;
    }

    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-10 left-12 z-10 flex items-center gap-2 text-sm transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      {/* Radial glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(154,98,250,0.18) 0%, transparent 70%)",
        }}
      />
      {/* Bottom subtle glow */}
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
        {/* Top accent line */}
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
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Inicia sesión en tu cuenta
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: "var(--border-subtle)" }}
        />

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({
                field,
              }: {
                field: ControllerRenderProps<LoginFormValues, "email">;
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

            <FormField
              control={form.control}
              name="password"
              render={({
                field,
              }: {
                field: ControllerRenderProps<LoginFormValues, "password">;
              }) => (
                <FormItem className="gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Contraseña
                    </FormLabel>
                    <Link
                      href="/recuperar"
                      className="text-xs transition-colors"
                      style={{ color: "var(--brand)" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--brand-accent)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--brand)")
                      }
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
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
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Submit */}
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
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
            <p className="text-center text-sm" style={{ color: "var(--text-dim)" }}>
              ¿No tienes cuenta?{" "}
              <Link
                href="/registro"
                className="transition-colors"
                style={{ color: "var(--brand)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand-accent)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--brand)")}
              >
                Crear cuenta
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}

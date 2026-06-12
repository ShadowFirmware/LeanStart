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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ControllerRenderProps } from "react-hook-form";
import Image from "next/image";
import logo from "../../../../public/logo.png";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundColor: "#151419" }}
    >
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
          backgroundColor: "rgba(32,33,37,0.85)",
          border: "1px solid rgba(154,98,250,0.2)",
          backdropFilter: "blur(16px)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(154,98,250,0.6), transparent)",
          }}
        />

        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src={logo}
            alt="LeanStart"
            height={52}
            className="w-auto object-contain"
            priority
          />
          <div className="text-center space-y-1">
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ color: "#FBFBFC" }}
            >
              Bienvenido de vuelta
            </h1>
            <p className="text-sm" style={{ color: "#9B9A9F" }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
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
                    style={{ color: "#9B9A9F" }}
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
                      style={{ color: "#9B9A9F" }}
                    >
                      Contraseña
                    </FormLabel>
                    <button
                      type="button"
                      className="text-xs transition-colors"
                      style={{ color: "#9A62FA" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "#C687F5")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "#9A62FA")
                      }
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="input-auth focus-visible:ring-0"
                      {...field}
                    />
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
                background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
                color: "#FBFBFC",
                boxShadow: "0 4px 24px rgba(154,98,250,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background =
                    "linear-gradient(135deg, #8E58EE 0%, #9A62FA 100%)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 32px rgba(154,98,250,0.5)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 24px rgba(154,98,250,0.35)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
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
          </form>
        </Form>
      </div>
    </div>
  );
}

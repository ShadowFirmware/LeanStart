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
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import logo from "../../../../public/logo.png";

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
    // Solo-front (sin backend): simulamos el envío. Al conectar backend, aquí va
    // el POST /auth/recuperar. Mostramos un mensaje genérico para no revelar si
    // el correo existe (buena práctica de seguridad).
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setEnviadoA(values.email);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundColor: "#151419" }}
    >
      {/* Back button */}
      <Link
        href="/login"
        className="absolute top-10 left-12 z-10 flex items-center gap-2 text-sm transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
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
          backgroundColor: "rgba(32,33,37,0.85)",
          border: "1px solid rgba(154,98,250,0.2)",
          backdropFilter: "blur(16px)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.4)",
        }}
      >
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
            height={32}
            style={{ width: "auto" }}
            className="object-contain"
            priority
          />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#FBFBFC" }}>
              {enviadoA ? "Revisa tu correo" : "Recuperar contraseña"}
            </h1>
            <p className="text-sm" style={{ color: "#9B9A9F" }}>
              {enviadoA
                ? "Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña."
                : "Ingresa tu correo y te enviaremos instrucciones para restablecerla."}
            </p>
          </div>
        </div>

        <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />

        {enviadoA ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(154,98,250,0.15)" }}
              >
                <MailCheck className="w-7 h-7" style={{ color: "#C687F5" }} />
              </div>
              <p className="text-sm" style={{ color: "#F2F0F7" }}>
                Enviamos las instrucciones a{" "}
                <span className="font-medium">{enviadoA}</span>.
              </p>
              <p className="text-xs" style={{ color: "#7E7C86" }}>
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
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F2F0F7",
                }}
              >
                Usar otro correo
              </button>
              <Link
                href="/login"
                className="h-11 w-full rounded-xl font-semibold text-sm flex items-center justify-center border-0 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
                  color: "#FBFBFC",
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

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl font-semibold text-sm mt-1 border-0 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
                  color: "#FBFBFC",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLElement).style.background =
                      "linear-gradient(135deg, #8E58EE 0%, #9A62FA 100%)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)";
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

              <p className="text-center text-sm" style={{ color: "#7E7C86" }}>
                ¿Recordaste tu contraseña?{" "}
                <Link
                  href="/login"
                  className="transition-colors"
                  style={{ color: "#9A62FA" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C687F5")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9A62FA")}
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

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ErrorArt } from "@/components/error-art";
import { Button } from "@leanstart/commons";
import { RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registro para depuración en consola del navegador
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10"
      style={{ backgroundColor: "var(--shell)" }}
    >
      {/* Radial glow superior */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(154,98,250,0.16) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-4xl rounded-3xl p-8 md:p-12 flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12"
        style={{
          backgroundColor: "var(--surface-glass)",
          border: "1px solid var(--brand-tint-strong)",
          backdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Línea de acento superior */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--brand-line), transparent)",
          }}
        />

        {/* Columna de texto */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <Logo height={22} priority />

          <h1
            className="mt-7 text-2xl md:text-3xl font-semibold"
            style={{ color: "var(--text-strong)" }}
          >
            Algo salió mal
          </h1>
          <p
            className="mt-2.5 text-sm leading-relaxed max-w-sm"
            style={{ color: "var(--text-dim)" }}
          >
            Ocurrió un error inesperado al procesar tu solicitud. Puedes intentar
            de nuevo o regresar al inicio.
          </p>
          {error.digest && (
            <p className="mt-2 text-[11px] font-mono" style={{ color: "var(--text-faint)" }}>
              Código: {error.digest}
            </p>
          )}

          <div className="mt-7 flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
            <Button
              onClick={() => reset()}
              className="h-11 min-w-0 rounded-xl font-semibold text-sm border-0 px-6"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              <RotateCcw className="mr-2 w-4 h-4 shrink-0" />
              Intentar de nuevo
            </Button>
            <Button
              variant="outline"
              className="h-11 min-w-0 rounded-xl font-semibold text-sm px-6"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--border-hair)",
                color: "var(--text-strong)",
              }}
              nativeButton={false}
              render={<Link href="/" />}
            >
              <Home className="mr-2 w-4 h-4 shrink-0" />
              Inicio
            </Button>
          </div>
        </div>

        {/* Ilustración (mascota aleatoria) */}
        <ErrorArt className="shrink-0 w-52 sm:w-64 md:w-72" />
      </div>
    </div>
  );
}

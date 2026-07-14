"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@leanstart/commons";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

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
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundColor: "#0D0C10" }}
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
        className="relative w-full max-w-[440px] rounded-2xl p-9 flex flex-col items-center text-center gap-6"
        style={{
          backgroundColor: "rgba(19,18,25,0.85)",
          border: "1px solid rgba(154,98,250,0.2)",
          backdropFilter: "blur(16px)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Línea de acento superior */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(154,98,250,0.6), transparent)",
          }}
        />

        <Image
          src="/logo.png"
          alt="LeanStart"
          height={30}
          width={130}
          unoptimized
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
          priority
        />

        {/* Icono */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: "rgba(239,110,110,0.09)",
            border: "1px solid rgba(239,110,110,0.2)",
          }}
        >
          <AlertTriangle className="w-7 h-7" style={{ color: "#EF6E6E" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold" style={{ color: "#F2F0F7" }}>
            Algo salió mal
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xs mx-auto"
            style={{ color: "#7E7C86" }}
          >
            Ocurrió un error inesperado al procesar tu solicitud. Puedes intentar
            de nuevo o regresar al inicio.
          </p>
          {error.digest && (
            <p
              className="text-[11px] font-mono pt-1"
              style={{ color: "#4A4850" }}
            >
              Código: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-1">
          <Button
            onClick={() => reset()}
            className="h-11 w-full rounded-xl font-semibold text-sm border-0"
            style={{
              background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
              color: "#FBFBFC",
            }}
          >
            <RotateCcw className="mr-2 w-4 h-4" />
            Intentar de nuevo
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl font-semibold text-sm"
            style={{
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F2F0F7",
            }}
            nativeButton={false}
            render={<Link href="/" />}
          >
            <Home className="mr-2 w-4 h-4" />
            Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}

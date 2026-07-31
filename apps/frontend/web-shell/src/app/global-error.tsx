"use client";

import { useEffect, useState } from "react";

const ERROR_ART = [
  "/images/error-robot.svg",
  "/images/error-ghost.svg",
  "/images/error-search.svg",
  "/images/error-plug.svg",
  "/images/error-lock.svg",
  "/images/error-rocket.svg",
  "/images/error-cloud.svg",
];

/**
 * Boundary de error a nivel raíz. Reemplaza al layout completo cuando el
 * fallo ocurre en el propio RootLayout, por lo que debe declarar <html> y
 * <body> propios. Se usan estilos inline para garantizar el render aun si
 * la hoja de estilos global no llegó a cargar.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [art, setArt] = useState<string | null>(null);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    let last: string | null = null;
    try {
      last = sessionStorage.getItem("ls-error-art");
    } catch {
      /* noop */
    }
    const pool = last ? ERROR_ART.filter((a) => a !== last) : ERROR_ART;
    const choice = pool[Math.floor(Math.random() * pool.length)] ?? ERROR_ART[0];
    try {
      sessionStorage.setItem("ls-error-art", choice);
    } catch {
      /* noop */
    }
    // Lee/escribe sessionStorage (sistema externo real) — encaja en el caso que el
    // propio lint sí permite: sincronizar con algo fuera de React, no estado derivado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArt(choice);
  }, []);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          backgroundColor: "var(--shell)",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Glow superior */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(154,98,250,0.16) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "440px",
            borderRadius: "16px",
            padding: "2.25rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "1.5rem",
            backgroundColor: "var(--surface-glass)",
            border: "1px solid var(--brand-tint-strong)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {/* Línea de acento superior */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              height: "1px",
              width: "66%",
              borderRadius: "9999px",
              background:
                "linear-gradient(90deg, transparent, var(--brand-line), transparent)",
            }}
          />

          {/* Ilustración (mascota aleatoria). <img> nativo: global-error debe
              funcionar aun si falla el layout raíz, por eso no usamos next/image.
              Reservamos el espacio para no provocar salto al cargar. */}
          <div style={{ width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {art && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={art}
                alt=""
                width={180}
                height={180}
                style={{ width: "180px", height: "auto", animation: "error-art-in 0.22s ease-out both" }}
              />
            )}
          </div>

          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--text-strong)",
                margin: "0 0 0.5rem",
              }}
            >
              Error crítico de la aplicación
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "var(--text-dim)",
                maxWidth: "20rem",
                margin: "0 auto",
              }}
            >
              Ocurrió un problema al cargar LeanStart. Intenta recargar la
              aplicación; si el error persiste, vuelve más tarde.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "var(--text-dim)",
                  paddingTop: "0.5rem",
                  margin: 0,
                }}
              >
                Código: {error.digest}
              </p>
            )}
          </div>

          <button
            onClick={() => reset()}
            style={{
              height: "44px",
              width: "100%",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
              color: "var(--brand-fg)",
              background: "var(--brand-gradient)",
            }}
          >
            Recargar aplicación
          </button>
        </div>
      </body>
    </html>
  );
}

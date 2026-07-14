"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          backgroundColor: "#0D0C10",
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
            backgroundColor: "rgba(19,18,25,0.9)",
            border: "1px solid rgba(154,98,250,0.2)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.4)",
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
                "linear-gradient(90deg, transparent, rgba(154,98,250,0.6), transparent)",
            }}
          />

          {/* Icono */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(239,110,110,0.09)",
              border: "1px solid rgba(239,110,110,0.2)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF6E6E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#F2F0F7",
                margin: "0 0 0.5rem",
              }}
            >
              Error crítico de la aplicación
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "#7E7C86",
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
                  color: "#4A4850",
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
              color: "#FBFBFC",
              background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
            }}
          >
            Recargar aplicación
          </button>
        </div>
      </body>
    </html>
  );
}

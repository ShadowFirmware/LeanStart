import { Logo } from "@/components/logo";

type LoadingScreenProps = {
  /** Texto opcional bajo el logo (ej. "Cargando tu espacio…"). */
  message?: string;
  /**
   * Si es `true` cubre toda la ventana con el fondo oscuro de marca (ideal
   * para `loading.tsx` de rutas). Si es `false` se adapta al contenedor padre
   * y usa fondo transparente (ideal para secciones o suspense locales).
   * Por defecto `true`.
   */
  fullScreen?: boolean;
};

/**
 * Preloader con el lenguaje visual de LeanStart: fondo oscuro con glow radial
 * morado, logo y un anillo cónico que gira suavemente sobre un núcleo que
 * "respira". Pensado como pantalla de carga sutil entre navegaciones.
 */
export function LoadingScreen({
  message = "Cargando…",
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-4"
          : "flex min-h-60 w-full items-center justify-center overflow-hidden px-4"
      }
      style={fullScreen ? { backgroundColor: "var(--shell)" } : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Glow radial superior */}
      {fullScreen && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 30%, rgba(154,98,250,0.16) 0%, transparent 70%)",
          }}
        />
      )}

      <div
        className="relative flex flex-col items-center gap-8 text-center"
        style={{ animation: "ls-loader-in 0.5s ease-out both" }}
      >
        <Logo height={30} priority />

        {/* Spinner: anillo cónico + núcleo que respira */}
        <div className="relative h-14 w-14">
          {/* Glow suave detrás del núcleo */}
          <div
            className="absolute inset-2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(154,98,250,0.45) 0%, transparent 70%)",
              animation: "ls-loader-breathe 1.8s ease-in-out infinite",
            }}
          />

          {/* Pista tenue del anillo */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "3px solid var(--brand-tint)" }}
          />

          {/* Arco morado que gira (cónico enmascarado a anillo) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 90deg, transparent 0deg, transparent 60deg, var(--brand) 300deg, var(--brand-2) 360deg)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
              animation: "ls-loader-spin 0.9s linear infinite",
            }}
          />
        </div>

        {message && (
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-medium tracking-wide"
              style={{ color: "var(--muted-foreground)" }}
            >
              {message}
            </span>
            <span className="flex gap-0.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1 w-1 rounded-full"
                  style={{
                    backgroundColor: "var(--brand)",
                    animation: `ls-loader-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </span>
          </div>
        )}

        <span className="sr-only">Cargando contenido</span>
      </div>
    </div>
  );
}

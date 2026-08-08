"use client";

import { cn } from "../../lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Primitivos de carga compartidos.

   Un solo lenguaje visual para "algo está pasando" en toda la app: el mismo
   anillo cónico morado del preloader de marca (<LoadingScreen>), reducido a
   piezas reutilizables:

     · <Spinner/>        → dentro de botones, badges, filas… (inline)
     · <ViewLoader/>     → área de contenido completa (route loading, suspense)
     · <LoadingOverlay/> → cubre una tarjeta/sección mientras se guarda
     · <ViewSkeleton/>   → esqueleto neutro mientras rehidrata un store persistido

   Ninguno depende de keyframes propios del web-shell: giran con `animate-spin`
   y laten con `animate-pulse` de Tailwind, así que funcionan en cualquier app
   que consuma @leanstart/commons.
   ────────────────────────────────────────────────────────────────────────── */

export function Spinner({
  size = 16,
  className,
  style,
}: {
  /** Diámetro en px. El grosor del anillo se deriva del tamaño. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const grosor = Math.max(2, Math.round(size / 8));

  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 animate-spin rounded-full align-middle", className)}
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 90deg, transparent 0deg, transparent 60deg, var(--brand) 300deg, var(--brand-2) 360deg)",
        WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${grosor}px), #000 calc(100% - ${grosor}px))`,
        mask: `radial-gradient(farthest-side, transparent calc(100% - ${grosor}px), #000 calc(100% - ${grosor}px))`,
        ...style,
      }}
    />
  );
}

/**
 * Carga a nivel de área de contenido: se centra en el contenedor padre sin
 * tapar el sidebar. Es lo que renderizan los `loading.tsx` de cada módulo.
 */
export function ViewLoader({
  message = "Cargando…",
  size = 34,
  className,
}: {
  message?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center",
        className
      )}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <span
          className="absolute rounded-full animate-pulse"
          style={{
            inset: size / 6,
            background: "radial-gradient(circle, rgba(154,98,250,0.45) 0%, transparent 70%)",
          }}
        />
        <span
          className="absolute inset-0 rounded-full"
          style={{ border: `${Math.max(2, Math.round(size / 12))}px solid var(--brand-tint)` }}
        />
        <Spinner size={size} />
      </div>

      <span className="text-sm font-medium tracking-wide" style={{ color: "var(--muted-foreground)" }}>
        {message}
      </span>
    </div>
  );
}

/**
 * Velo sobre una tarjeta o sección mientras se registra un cambio. El
 * contenedor padre debe ser `position: relative`.
 */
export function LoadingOverlay({
  show,
  message = "Guardando…",
  className,
}: {
  show: boolean;
  message?: string;
  className?: string;
}) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[inherit] backdrop-blur-[2px]",
        className
      )}
      style={{ backgroundColor: "var(--overlay-loading)" }}
    >
      <Spinner size={26} />
      <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>
        {message}
      </span>
    </div>
  );
}

/* ─── Esqueletos ─── */

function Bloque({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("animate-pulse rounded-md", className)}
      style={{ backgroundColor: "var(--hover-surface)", ...style }}
    />
  );
}

function Tarjeta({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl", className)}
      style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)" }}
    />
  );
}

export type VarianteSkeleton = "lista" | "tarjetas" | "formulario" | "detalle" | "tabla";

/**
 * Esqueleto neutro que sustituye a una vista mientras el store persistido
 * rehidrata. Servidor y primer render de cliente pintan exactamente esto, así
 * que no hay mismatch de hidratación y el usuario nunca ve un vacío en blanco.
 */
export function ViewSkeleton({
  variante = "lista",
  filas = 3,
  ancho = "max-w-5xl",
  conHeader = true,
  className,
}: {
  variante?: VarianteSkeleton;
  filas?: number;
  /** Clase de ancho máximo, para que coincida con la vista real. */
  ancho?: string;
  conHeader?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("p-4 md:p-8 mx-auto w-full flex flex-col gap-6", ancho, className)}
    >
      <span className="sr-only">Cargando contenido</span>

      {conHeader && (
        <div>
          <Bloque className="h-7 w-48" style={{ backgroundColor: "var(--border-subtle)" }} />
          <Bloque className="h-4 w-32 mt-2" />
        </div>
      )}

      {variante === "tarjetas" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: Math.max(filas, 3) }).map((_, i) => (
            <Tarjeta key={i} className="h-40" />
          ))}
        </div>
      )}

      {variante === "lista" && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: filas }).map((_, i) => (
            <Tarjeta key={i} className="h-20" />
          ))}
        </div>
      )}

      {variante === "tabla" && (
        <Tarjeta className="h-105" />
      )}

      {variante === "formulario" && (
        <div
          className="rounded-xl p-5 flex flex-col gap-5"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)" }}
        >
          {Array.from({ length: Math.max(filas, 3) }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Bloque className="h-3 w-24" />
              <Bloque className="h-9 w-full" style={{ backgroundColor: "var(--hover-surface-2)" }} />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Bloque className="h-9 w-24" style={{ backgroundColor: "var(--hover-surface-2)" }} />
            <Bloque className="h-9 w-32" style={{ backgroundColor: "var(--border-subtle)" }} />
          </div>
        </div>
      )}

      {variante === "detalle" && (
        <>
          <Tarjeta className="h-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Tarjeta className="h-56 lg:col-span-2" />
            <Tarjeta className="h-56" />
          </div>
        </>
      )}
    </div>
  );
}

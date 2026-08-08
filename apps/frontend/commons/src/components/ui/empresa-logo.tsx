"use client";

import { cn } from "../../lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Logo de una empresa, con la inicial como respaldo.

   Estaba reescrito casi igual en cada listado (dashboards de mentor/evaluador,
   lista de empresas, reportes, historial, vitrina pública): mismo recorte, mismo
   fondo tinte y misma inicial, con el tamaño y el radio variando de una copia a
   otra. Aquí es un solo componente y esas dos cosas son props.

   Se usa <img> y no next/image a propósito: los logos se guardan como data URL
   dentro del propio registro de la empresa, que es justo lo que el optimizador
   de Next no puede procesar (habría que pasar `unoptimized` en cada uso), y así
   commons no arrastra una dependencia del framework host.
   ────────────────────────────────────────────────────────────────────────── */

/** Grosor visual del contorno. Las tarjetas sobre fondo propio lo quieren; las filas de una lista no. */
export type BordeLogo = "ninguno" | "sutil" | "marca";

const RADIO_CLASS = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
} as const;

const BORDE_STYLE: Record<BordeLogo, string | undefined> = {
  ninguno: undefined,
  sutil: "1px solid var(--border-hair)",
  marca: "1px solid var(--brand-tint-strong)",
};

export interface EmpresaLogoProps {
  /** Nombre de la empresa: da el alt y, si no hay logo, la inicial. */
  nombre: string;
  logoUrl?: string;
  /** Lado de la caja en px. */
  size?: number;
  radio?: keyof typeof RADIO_CLASS;
  borde?: BordeLogo;
  className?: string;
}

export function EmpresaLogo({
  nombre,
  logoUrl,
  size = 40,
  radio = "xl",
  borde = "ninguno",
  className,
}: EmpresaLogoProps) {
  // Proporcionales al tamaño para que un logo de 88px y uno de 36px se vean
  // como la misma pieza a distinta escala.
  const relleno = Math.max(2, Math.round(size * 0.12));
  const base: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: "var(--brand-tint)",
    border: BORDE_STYLE[borde],
    boxSizing: "border-box",
  };

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={nombre}
        loading="lazy"
        decoding="async"
        className={cn("object-contain shrink-0", RADIO_CLASS[radio], className)}
        style={{ ...base, padding: relleno }}
      />
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center font-bold shrink-0", RADIO_CLASS[radio], className)}
      style={{ ...base, fontSize: Math.round(size * 0.4), color: "var(--brand)" }}
      aria-hidden
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

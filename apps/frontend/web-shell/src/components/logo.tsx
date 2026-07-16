import Image from "next/image";
import { cn } from "@leanstart/commons";

/** Relación de aspecto del logotipo (1025 × 243 px). */
const RATIO = 1025 / 243;

interface LogoProps {
  /** Altura visual en px. El ancho se calcula manteniendo la proporción. */
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Logotipo de LeanStart que se adapta al tema.
 *
 * Renderiza dos variantes y alterna entre ellas con CSS (variante `dark:`),
 * de modo que no hay parpadeo ni dependemos de JS en el cliente:
 *  - `logo.png`        → texto blanco, para fondos oscuros (modo oscuro).
 *  - `logo-light.png`  → texto en tinta oscura, para fondos claros (modo claro).
 * El ícono y la palabra "Start" conservan el morado de marca en ambos temas.
 */
export function Logo({ height = 32, priority, className }: LogoProps) {
  const width = Math.round(height * RATIO);
  return (
    <span
      className={cn("inline-block leading-none", className)}
      style={{ height, width }}
    >
      <Image
        src="/logo.png"
        alt="LeanStart"
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className="hidden h-full w-full object-contain dark:block"
      />
      <Image
        src="/logo-light.png"
        alt="LeanStart"
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className="block h-full w-full object-contain dark:hidden"
      />
    </span>
  );
}

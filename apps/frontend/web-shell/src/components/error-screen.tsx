import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { Button } from "@leanstart/commons";
import { ArrowLeft, Home, type LucideIcon } from "lucide-react";

/** Ilustraciones de marca (mascotas) para las páginas de error. */
const ART = [
  "/images/error-robot.svg",
  "/images/error-ghost.svg",
  "/images/error-search.svg",
  "/images/error-plug.svg",
  "/images/error-lock.svg",
  "/images/error-rocket.svg",
  "/images/error-cloud.svg",
];

type ErrorAction = {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: "primary" | "outline";
};

type ErrorScreenProps = {
  /** Código a mostrar en grande (ej. "404", "500"). Opcional. */
  code?: string;
  title: string;
  description: string;
  /** Icono lucide (heredado, opcional). Ya no se muestra: usamos la ilustración. */
  icon?: LucideIcon;
  /** Color de acento del código. Por defecto morado de marca. */
  accent?: string;
  /** @deprecated ya no se usa (se dejaba para el ícono). */
  accentBg?: string;
  /** @deprecated ya no se usa (se dejaba para el ícono). */
  accentBorder?: string;
  actions?: ErrorAction[];
};

const PRIMARY_BG = "var(--brand-gradient)";

/**
 * Pantalla de error reutilizable con el lenguaje visual de LeanStart: tarjeta
 * de vidrio con glow morado, logo compacto, texto a la izquierda y una
 * ilustración (mascota) a la derecha —al estilo de las páginas de error de las
 * grandes plataformas—. La usan las páginas de estado HTTP (400/401/403/500/503)
 * y el not-found.
 */
export function ErrorScreen({
  code,
  title,
  description,
  accent = "var(--brand)",
  actions = [{ label: "Volver al inicio", href: "/", icon: ArrowLeft, variant: "primary" }],
}: ErrorScreenProps) {
  // Elegimos la ilustración en el SERVIDOR, por request: aparece de inmediato
  // (ya viene en el HTML, sin esperar a que hidrate el cliente) y cambia en
  // cada carga. Las páginas que usan esto declaran `dynamic = "force-dynamic"`.
  const illustration = ART[Math.floor(Math.random() * ART.length)];

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

          {code && (
            <p
              className="mt-7 text-5xl md:text-6xl font-bold tracking-tight leading-none"
              style={{ color: accent }}
            >
              {code}
            </p>
          )}
          <h1
            className="mt-3 text-xl md:text-2xl font-semibold"
            style={{ color: "var(--text-strong)" }}
          >
            {title}
          </h1>
          <p
            className="mt-2.5 text-sm leading-relaxed max-w-sm"
            style={{ color: "var(--text-dim)" }}
          >
            {description}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
            {actions.map(({ label, href, icon: ActionIcon, variant = "primary" }) =>
              variant === "primary" ? (
                <Button
                  key={label}
                  className="h-11 min-w-0 rounded-xl font-semibold text-sm border-0 px-6"
                  style={{ background: PRIMARY_BG, color: "var(--brand-fg)" }}
                  nativeButton={false}
                  render={<Link href={href} />}
                >
                  {ActionIcon && <ActionIcon className="mr-2 w-4 h-4 shrink-0" />}
                  {label}
                </Button>
              ) : (
                <Button
                  key={label}
                  variant="outline"
                  className="h-11 min-w-0 rounded-xl font-semibold text-sm px-6"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-hair)",
                    color: "var(--text-strong)",
                  }}
                  nativeButton={false}
                  render={<Link href={href} />}
                >
                  {ActionIcon && <ActionIcon className="mr-2 w-4 h-4 shrink-0" />}
                  {label}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Ilustración (mascota aleatoria, elegida por request) */}
        <div className="shrink-0 w-52 sm:w-64 md:w-72">
          <Image
            src={illustration}
            alt=""
            width={320}
            height={320}
            priority
            unoptimized
            draggable={false}
            className="w-full h-auto select-none [animation:error-art-in_0.22s_ease-out_both]"
          />
        </div>
      </div>
    </div>
  );
}

export { Home };

import Link from "next/link";
import Image from "next/image";
import { Button } from "@leanstart/commons";
import { ArrowLeft, Home, type LucideIcon } from "lucide-react";

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
  icon: LucideIcon;
  /** Color de acento del icono/código. Por defecto morado de marca. */
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
  actions?: ErrorAction[];
};

const PRIMARY_BG = "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)";

/**
 * Pantalla de error reutilizable con el lenguaje visual de LeanStart
 * (fondo oscuro, glow radial, tarjeta con acento morado). La usan las
 * páginas de estado HTTP (400/401/403/500/503) y el not-found.
 */
export function ErrorScreen({
  code,
  title,
  description,
  icon: Icon,
  accent = "#9A62FA",
  accentBg = "rgba(154,98,250,0.09)",
  accentBorder = "rgba(154,98,250,0.18)",
  actions = [{ label: "Volver al inicio", href: "/", icon: ArrowLeft, variant: "primary" }],
}: ErrorScreenProps) {
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
          style={{ backgroundColor: accentBg, border: `1px solid ${accentBorder}` }}
        >
          <Icon className="w-7 h-7" style={{ color: accent }} />
        </div>

        <div className="space-y-2">
          {code && (
            <p
              className="text-6xl font-bold tracking-tight leading-none"
              style={{ color: accent }}
            >
              {code}
            </p>
          )}
          <h1 className="text-xl font-semibold" style={{ color: "#F2F0F7" }}>
            {title}
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xs mx-auto"
            style={{ color: "#7E7C86" }}
          >
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-1">
          {actions.map(({ label, href, icon: ActionIcon, variant = "primary" }) =>
            variant === "primary" ? (
              <Button
                key={label}
                className="h-11 w-full rounded-xl font-semibold text-sm border-0"
                style={{ background: PRIMARY_BG, color: "#FBFBFC" }}
                nativeButton={false}
                render={<Link href={href} />}
              >
                {ActionIcon && <ActionIcon className="mr-2 w-4 h-4" />}
                {label}
              </Button>
            ) : (
              <Button
                key={label}
                variant="outline"
                className="h-11 w-full rounded-xl font-semibold text-sm"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F2F0F7",
                }}
                nativeButton={false}
                render={<Link href={href} />}
              >
                {ActionIcon && <ActionIcon className="mr-2 w-4 h-4" />}
                {label}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export { Home };

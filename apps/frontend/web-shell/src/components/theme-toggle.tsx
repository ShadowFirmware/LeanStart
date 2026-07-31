"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn, useHasHydrated } from "@leanstart/commons";

const OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

/**
 * Control segmentado Claro / Oscuro / Sistema. Vive en la página de Perfil.
 * Antes de hidratar renderiza un esqueleto neutro para evitar el desajuste
 * SSR/cliente que provoca `useTheme` (el tema real solo se conoce en cliente).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasHydrated();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-subtle)" }}
      role="radiogroup"
      aria-label="Tema de la interfaz"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            )}
            style={{
              backgroundColor: active ? "var(--brand-tint)" : "transparent",
              color: active ? "var(--brand)" : "var(--text-dim)",
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

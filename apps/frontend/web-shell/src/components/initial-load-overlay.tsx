"use client";

import { useEffect, useState } from "react";
import {
  Rocket, PieChart, TrendingUp, Users,
  BarChart3, Target, Lightbulb, User as UserIcon, DollarSign,
  CheckCircle2, Circle, Heart, Sparkles,
} from "lucide-react";
import { useCargaInicialStore } from "@leanstart/commons";
import { Logo } from "@/components/logo";

const PASOS = ["Modelo de negocio", "Mentorías", "Métricas", "Insights", "Listo"];

const BADGES = [
  { icon: Rocket, className: "top-6 left-8 sm:left-16" },
  { icon: PieChart, className: "top-16 right-4 sm:right-10" },
  { icon: TrendingUp, className: "bottom-20 left-2 sm:left-8" },
  { icon: Users, className: "bottom-8 right-8 sm:right-20" },
];

/**
 * Pantalla de carga inicial: se muestra una sola vez, justo después de iniciar
 * sesión, mientras `LiveSync` trae empresas/notificaciones/perfil (y según el
 * rol, usuarios/criterios/viabilidad/reportes). El checklist y el % reflejan
 * cuántas de esas tareas ya resolvieron — no es una animación decorativa.
 */
export function InitialLoadOverlay() {
  const activa = useCargaInicialStore((s) => s.activa);
  const total = useCargaInicialStore((s) => s.total);
  const completadas = useCargaInicialStore((s) => s.completadas);
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (activa) {
      setVisible(true);
      setSaliendo(false);
      return;
    }
    setSaliendo(true);
    const t = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(t);
  }, [activa]);

  if (!visible) return null;

  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const pasoActivo = Math.min(Math.floor((pct / 100) * PASOS.length), PASOS.length - 1);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 transition-opacity duration-400"
      style={{ backgroundColor: "var(--shell)", opacity: saliendo ? 0 : 1 }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Glow radial de fondo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 45% at 50% 20%, rgba(154,98,250,0.16) 0%, transparent 70%)" }}
      />

      {/* Logo */}
      <div className="absolute top-8 left-8">
        <Logo height={26} priority />
      </div>

      <div className="relative flex flex-col items-center gap-8 w-full max-w-lg">
        {/* Ilustración: tablero tipo canvas con piezas + insignias flotantes */}
        <div className="relative w-full max-w-xs sm:max-w-sm h-48 flex items-center justify-center">
          {BADGES.map(({ icon: Icon, className }, i) => (
            <div
              key={i}
              className={`absolute w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${className}`}
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", color: "var(--brand)" }}
            >
              <Icon className="w-5 h-5" />
            </div>
          ))}

          <div
            className="relative grid grid-cols-3 grid-rows-2 gap-1.5 rounded-2xl p-3 shadow-2xl"
            style={{ backgroundColor: "#F5F3FF" }}
          >
            {[BarChart3, "solid", Target, UserIcon, Lightbulb, DollarSign].map((Item, i) => {
              const destacado = i === 4; // el foco de la pieza: la idea (lightbulb)
              if (Item === "solid") {
                return (
                  <div
                    key={i}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg"
                    style={{ background: "var(--brand-gradient)" }}
                  />
                );
              }
              const Icon = Item as React.ElementType;
              return (
                <div
                  key={i}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center ${destacado ? "animate-pulse" : ""}`}
                  style={{
                    background: destacado ? "var(--brand-gradient)" : "#EDE9FE",
                    color: destacado ? "#fff" : "var(--brand)",
                  }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Texto */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-strong)" }}>
            Preparando tu <span style={{ color: "var(--brand)" }}>ecosistema de ideas…</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
            Estamos organizando tu modelo de negocio, mentorías y métricas.
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%`, background: "var(--brand-gradient)" }}
            />
          </div>
          <span className="text-sm font-semibold shrink-0" style={{ color: "var(--brand)" }}>{pct}%</span>
        </div>

        {/* Checklist */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {PASOS.map((paso, i) => {
            const hecho = i < pasoActivo || pct === 100;
            const actual = i === pasoActivo && pct < 100;
            return (
              <div key={paso} className="flex items-center gap-1.5">
                {hecho ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: "var(--brand)" }} />
                ) : (
                  <Circle
                    className="w-4 h-4"
                    style={{ color: actual ? "var(--brand)" : "var(--text-faint)" }}
                  />
                )}
                <span className="text-sm" style={{ color: hecho || actual ? "var(--text-strong)" : "var(--text-faint)" }}>
                  {paso}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cita */}
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-4 w-full"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--brand-gradient)", color: "#fff" }}
          >
            <Heart className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
              Cada gran idea necesita una estructura sólida.
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
              Estamos construyendo el camino para que tu proyecto despegue.
            </p>
          </div>
          <Sparkles className="w-4 h-4 shrink-0 ml-auto" style={{ color: "var(--brand)" }} />
        </div>
      </div>
    </div>
  );
}

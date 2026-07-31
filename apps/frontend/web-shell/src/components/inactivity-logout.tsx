"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AlarmClock } from "lucide-react";
import { cerrarSesionBackend, modoDemo } from "@leanstart/commons";

const TIEMPO_TOTAL_MS = 5 * 60 * 1000;
// Los últimos 30s del temporizador se muestran como cuenta regresiva en pantalla,
// para darle al usuario margen de mover el mouse / tocar algo y cancelar el cierre.
const AVISO_MS = 30 * 1000;
const EVENTOS_ACTIVIDAD = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

/**
 * Cierra la sesión automáticamente tras 5 minutos sin interacción del usuario
 * (para no dejar una sesión autenticada abierta indefinidamente en un equipo
 * compartido o abandonado), avisando con 30s de anticipación mediante un
 * modal con cuenta regresiva que cualquier actividad cancela.
 */
export function InactivityLogout() {
  const { status } = useSession();
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const timeoutPrincipalRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intervalCuentaRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const limpiarTemporizadores = useCallback(() => {
    if (timeoutPrincipalRef.current) clearTimeout(timeoutPrincipalRef.current);
    if (intervalCuentaRef.current) clearInterval(intervalCuentaRef.current);
  }, []);

  const cerrarPorInactividad = useCallback(() => {
    limpiarTemporizadores();
    cerrarSesionBackend().catch(() => {});
    signOut({ callbackUrl: "/login" });
  }, [limpiarTemporizadores]);

  const iniciarAvisoFinal = useCallback(() => {
    setSegundosRestantes(AVISO_MS / 1000);
    intervalCuentaRef.current = setInterval(() => {
      setSegundosRestantes((actual) => {
        if (actual === null || actual <= 1) {
          cerrarPorInactividad();
          return null;
        }
        return actual - 1;
      });
    }, 1000);
  }, [cerrarPorInactividad]);

  const reiniciarTemporizador = useCallback(() => {
    limpiarTemporizadores();
    setSegundosRestantes(null);
    timeoutPrincipalRef.current = setTimeout(iniciarAvisoFinal, TIEMPO_TOTAL_MS - AVISO_MS);
  }, [limpiarTemporizadores, iniciarAvisoFinal]);

  useEffect(() => {
    if (modoDemo() || status !== "authenticated") return;

    // Arranca los timers y suscribe los listeners de actividad (sistema externo:
    // window + setTimeout/setInterval) — el caso que el propio lint sí permite.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reiniciarTemporizador();
    EVENTOS_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, reiniciarTemporizador));

    return () => {
      limpiarTemporizadores();
      EVENTOS_ACTIVIDAD.forEach((evento) => window.removeEventListener(evento, reiniciarTemporizador));
    };
  }, [status, reiniciarTemporizador, limpiarTemporizadores]);

  if (segundosRestantes === null) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(10, 8, 20, 0.75)", backdropFilter: "blur(4px)" }}
      role="alertdialog"
      aria-live="assertive"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-elevated)" }}
      >
        <span
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--brand-gradient)", color: "#fff" }}
        >
          <AlarmClock className="w-8 h-8" />
        </span>

        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-strong)" }}>
            ¿Sigues ahí?
          </h2>
          <p className="text-sm mt-2" style={{ color: "var(--text-dim)" }}>
            Por seguridad, tu sesión se va a cerrar por inactividad.
            <br />
            Redirigiendo a la página principal en:
          </p>
        </div>

        <div className="text-6xl font-bold tabular-nums" style={{ color: "var(--brand)" }}>
          {segundosRestantes}
        </div>

        <button
          type="button"
          onClick={reiniciarTemporizador}
          className="h-11 w-full rounded-xl font-semibold text-sm border-0 transition-opacity hover:opacity-90"
          style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
        >
          Seguir conectado
        </button>
      </div>
    </div>
  );
}

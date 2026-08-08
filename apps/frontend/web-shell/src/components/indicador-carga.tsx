"use client";

import { useCargaStore, Spinner } from "@leanstart/commons";

/**
 * Indicador flotante de "se están registrando cambios".
 *
 * Se monta una sola vez en el shell, así que cubre TODAS las vistas y módulos:
 * cualquier escritura contra la API —y cualquier acción envuelta en `useAccion`
 * en modo demo— lo enciende sin que la vista tenga que hacer nada.
 *
 * No sustituye a los toasts: el toast confirma el resultado, esto comunica que
 * el trabajo está en curso. El mínimo visible lo administra el store, de modo
 * que aquí no hay temporizadores ni estado local: es función pura del estado.
 */
export function IndicadorCarga() {
  const visible = useCargaStore((s) => s.visible);
  const etiqueta = useCargaStore((s) => s.etiqueta);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={visible}
      className="pointer-events-none fixed inset-x-0 top-3 z-60 flex justify-center px-4 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <div
        className="flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-4"
        style={{
          backgroundColor: "var(--surface-glass)",
          border: "1px solid var(--border-hair)",
          boxShadow: "var(--shadow-card)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Spinner size={14} />
        <span className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>
          {etiqueta ?? "Guardando cambios"}
          <span className="ml-0.5" aria-hidden>…</span>
        </span>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent, Textarea, Button, modoDemo } from "@leanstart/commons";
import type { EstadoObservacion } from "@leanstart/commons";
import { useNotificacionesStore } from "@leanstart/notificaciones-front";
import { useObservacionesStore, type TipoElementoObservacion } from "../store/observaciones";
import { useEmpresasStore } from "../store/empresas";

const ESTADO_OBS_CONFIG: Record<EstadoObservacion, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador — sin enviar", color: "var(--text-dim)", bg: "var(--border-hair)" },
  pendiente: { label: "Pendiente", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_revision: { label: "En revisión", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  atendida: { label: "Atendida", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  cerrada: { label: "Cerrada", color: "var(--text-dim)", bg: "var(--border-hair)" },
};

const MAX_COMENTARIO = 500;

interface ObservacionesButtonProps {
  empresaId: string;
  tipoElemento: TipoElementoObservacion;
  elementoId: string;
  /** Cuando es true muestra el formulario para agregar una nueva observación (solo mentor). */
  puedeComentar?: boolean;
  /** Cuando es true permite marcar observaciones pendientes como "En revisión" (solo emprendedor). */
  puedeMarcarEnRevision?: boolean;
  /** Cuando es false, oculta por completo el hilo (aún no le corresponde verlo según el estado del proyecto). */
  puedeVer?: boolean;
  /**
   * Cuando es true, las observaciones "en_revision" se muestran como si siguieran "pendiente"
   * (uso exclusivo del mentor: no debe ver que el emprendedor ya corrigió algo hasta que
   * este envíe el proyecto nuevamente).
   */
  ocultarCorreccionesPendientes?: boolean;
  autorNombre?: string;
}

export function ObservacionesButton({
  empresaId,
  tipoElemento,
  elementoId,
  puedeComentar = false,
  puedeMarcarEnRevision = false,
  puedeVer = true,
  ocultarCorreccionesPendientes = false,
  autorNombre = "Mentor",
}: ObservacionesButtonProps) {
  const observaciones = useObservacionesStore((s) => s.observaciones);
  const agregarObservacion = useObservacionesStore((s) => s.agregarObservacion);
  const actualizarEstadoObservacion = useObservacionesStore((s) => s.actualizarEstadoObservacion);
  const empresaNombre = useEmpresasStore((s) => s.empresas.find((e) => e.id === empresaId)?.nombre ?? "tu proyecto");
  const agregarNotificacion = useNotificacionesStore((s) => s.agregarNotificacion);
  const [draft, setDraft] = useState("");

  const hilo = observaciones.filter(
    (o) => o.empresaId === empresaId && o.tipoElemento === tipoElemento && o.elementoId === elementoId
  );

  if (!puedeVer) return null;
  if (!puedeComentar && hilo.length === 0) return null;

  async function enviar() {
    if (!draft.trim()) return;
    try {
      await agregarObservacion({ empresaId, tipoElemento, elementoId, autorNombre, comentario: draft.trim() });
      // En modo real el backend ya crea esta notificación al guardar la observación
      // (ver ObservacionesService.crear); en demo la simulamos aquí, entre pestañas.
      if (modoDemo()) {
        agregarNotificacion({
          tipo: "comentario_mentor",
          destinatario: "emprendedor",
          titulo: "Nuevo comentario de tu mentor",
          mensaje: `${autorNombre} dejó un comentario en "${empresaNombre}".`,
          empresaNombre,
          creadaEn: "Justo ahora",
        });
      }
      setDraft("");
      toast.success("Observación agregada.");
    } catch {
      toast.error("No se pudo agregar la observación.");
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-medium transition-colors shrink-0"
            style={{
              color: hilo.length > 0 ? "var(--brand-accent)" : "var(--text-dim)",
              backgroundColor: hilo.length > 0 ? "rgba(154,98,250,0.16)" : "var(--border-subtle)",
            }}
            aria-label="Observaciones"
          />
        }
      >
        <MessageSquare className="w-3 h-3" />
        {hilo.length > 0 && hilo.length}
      </PopoverTrigger>

      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        className="w-80 flex flex-col gap-3"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
          Observaciones{hilo.length > 0 ? ` (${hilo.length})` : ""}
        </p>

        {hilo.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>Aún no hay observaciones.</p>
        ) : (
          <div
            className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(154,98,250,0.35)] hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(154,98,250,0.5)]"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(154,98,250,0.35) transparent" }}
          >
            {hilo.map((o) => {
              const estadoMostrado = ocultarCorreccionesPendientes && o.estado === "en_revision" ? "pendiente" : o.estado;
              const cfg = ESTADO_OBS_CONFIG[estadoMostrado];
              return (
                <div
                  key={o.id}
                  className="flex flex-col gap-1 pb-3"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>{o.autorNombre}</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words" style={{ color: "var(--muted-foreground)", overflowWrap: "anywhere" }}>
                    {o.comentario}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{o.creadaEn}</span>
                    {puedeMarcarEnRevision && estadoMostrado === "pendiente" && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await actualizarEstadoObservacion(o.id, "en_revision");
                            // En modo real el backend ya notifica al mentor al marcar "en_revision"
                            // (ver ObservacionesService.actualizarEstado); en demo la simulamos aquí.
                            if (modoDemo()) {
                              agregarNotificacion({
                                tipo: "cambio_emprendedor",
                                destinatario: "mentor",
                                titulo: "El emprendedor atendió un comentario",
                                mensaje: `Hay cambios pendientes de revisar en "${empresaNombre}".`,
                                empresaNombre,
                                creadaEn: "Justo ahora",
                              });
                            }
                            toast.success("Comentario marcado como listo.");
                          } catch {
                            toast.error("No se pudo actualizar la observación.");
                          }
                        }}
                        className="flex items-center gap-1.5 shrink-0"
                        style={{ color: "#10B981" }}
                      >
                        <span className="text-[11px] font-medium">Marcar como resuelto</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {puedeComentar && estadoMostrado === "en_revision" && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await actualizarEstadoObservacion(o.id, "atendida");
                            toast.success("Comentario confirmado como atendido.");
                          } catch {
                            toast.error("No se pudo actualizar la observación.");
                          }
                        }}
                        className="flex items-center gap-1.5 shrink-0"
                        style={{ color: "#10B981" }}
                      >
                        <span className="text-[11px] font-medium">Confirmar resuelto</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {puedeComentar && (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              maxLength={MAX_COMENTARIO}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe una observación..."
              rows={3}
              className="resize-none text-sm"
              style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            />
            <Button
              type="button"
              size="sm"
              onClick={enviar}
              disabled={!draft.trim()}
              className="self-end h-8 px-3 text-xs border-0"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              <Send className="w-3 h-3" /> Agregar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

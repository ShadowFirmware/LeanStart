"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent, Textarea, Button } from "@leanstart/commons";
import type { EstadoObservacion } from "@leanstart/commons";
import { useObservacionesStore, type TipoElementoObservacion } from "../store/observaciones";

const ESTADO_OBS_CONFIG: Record<EstadoObservacion, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_revision: { label: "En revisión", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  atendida: { label: "Atendida", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  cerrada: { label: "Cerrada", color: "#7E7C86", bg: "rgba(255,255,255,0.08)" },
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
  const [draft, setDraft] = useState("");

  const hilo = observaciones.filter(
    (o) => o.empresaId === empresaId && o.tipoElemento === tipoElemento && o.elementoId === elementoId
  );

  if (!puedeVer) return null;
  if (!puedeComentar && hilo.length === 0) return null;

  function enviar() {
    if (!draft.trim()) return;
    agregarObservacion({ empresaId, tipoElemento, elementoId, autorNombre, comentario: draft.trim() });
    setDraft("");
    toast.success("Observación agregada.");
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
              color: hilo.length > 0 ? "#C9A8FE" : "#7E7C86",
              backgroundColor: hilo.length > 0 ? "rgba(154,98,250,0.16)" : "rgba(255,255,255,0.06)",
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
        style={{ backgroundColor: "#1A1921", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7E7C86" }}>
          Observaciones{hilo.length > 0 ? ` (${hilo.length})` : ""}
        </p>

        {hilo.length === 0 ? (
          <p className="text-sm" style={{ color: "#4A4850" }}>Aún no hay observaciones.</p>
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
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: "#F2F0F7" }}>{o.autorNombre}</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words" style={{ color: "#C4C2CC", overflowWrap: "anywhere" }}>
                    {o.comentario}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px]" style={{ color: "#4A4850" }}>{o.creadaEn}</span>
                    {puedeMarcarEnRevision && estadoMostrado === "pendiente" && (
                      <button
                        type="button"
                        onClick={() => {
                          actualizarEstadoObservacion(o.id, "en_revision");
                          toast.success("Comentario marcado como listo.");
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
                        onClick={() => {
                          actualizarEstadoObservacion(o.id, "atendida");
                          toast.success("Comentario confirmado como atendido.");
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
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
            />
            <Button
              type="button"
              size="sm"
              onClick={enviar}
              disabled={!draft.trim()}
              className="self-end h-8 px-3 text-xs border-0"
              style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
            >
              <Send className="w-3 h-3" /> Agregar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { Bell, MessageSquare, ClipboardCheck, CheckCircle2, RotateCcw, Building2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { useHasHydrated } from "@leanstart/commons";
import { useNotificacionesStore, type TipoNotificacion, type DestinatarioNotificacion } from "../store/notificaciones";

const TIPO_CONFIG: Record<TipoNotificacion, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  comentario_mentor:   { icon: MessageSquare,  color: "#3B82F6", bg: "rgba(59,130,246,0.12)",   label: "Comentario de mentor" },
  cambio_emprendedor:  { icon: PencilLine,     color: "#9A62FA", bg: "rgba(154,98,250,0.12)",   label: "Cambio del emprendedor" },
  enviado_evaluacion:  { icon: ClipboardCheck, color: "#F59E0B", bg: "rgba(245,158,11,0.12)",   label: "Enviado a evaluación" },
  proyecto_publicado:  { icon: CheckCircle2,   color: "#10B981", bg: "rgba(16,185,129,0.12)",   label: "Publicado" },
  proyecto_devuelto:   { icon: RotateCcw,      color: "#EF4444", bg: "rgba(239,68,68,0.12)",    label: "Devuelto" },
};

interface NotificacionesViewProps {
  /** Rol cuyas notificaciones se muestran. */
  destinatario?: DestinatarioNotificacion;
}

export function NotificacionesView({ destinatario = "emprendedor" }: NotificacionesViewProps = {}) {
  const hydrated = useHasHydrated();
  const todas = useNotificacionesStore((s) => s.notificaciones);
  const marcarLeida = useNotificacionesStore((s) => s.marcarLeida);
  const marcarTodasLeidasStore = useNotificacionesStore((s) => s.marcarTodasLeidas);

  const notificaciones = todas.filter((n) => (n.destinatario ?? "emprendedor") === destinatario);
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  async function marcarTodasLeidas() {
    try {
      await marcarTodasLeidasStore();
    } catch {
      toast.error("No se pudieron marcar las notificaciones como leídas.");
    }
  }

  // Esqueleto neutro hasta rehidratar el store persistido (evita mismatch de hidratación).
  if (!hydrated) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="h-7 w-48 rounded-md animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-24 rounded-md mt-2 animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Notificaciones</h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
            {noLeidas > 0
              ? `${noLeidas} sin leer`
              : "Todo al día"}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            type="button"
            onClick={marcarTodasLeidas}
            className="text-xs px-3 h-8 rounded-lg transition-colors w-full sm:w-auto shrink-0"
            style={{ color: "#9A62FA", border: "1px solid rgba(154,98,250,0.2)", backgroundColor: "rgba(154,98,250,0.06)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.06)")}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Lista */}
      {notificaciones.length === 0 ? (
        <div
          className="rounded-xl p-14 text-center"
          style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Bell className="w-9 h-9 mx-auto mb-3" style={{ color: "#4A4850" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "#F2F0F7" }}>Sin notificaciones</p>
          <p className="text-sm" style={{ color: "#7E7C86" }}>
            Aquí aparecerán los avisos sobre tus proyectos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notificaciones.map((n) => {
            const cfg = TIPO_CONFIG[n.tipo];
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.leida) marcarLeida(n.id).catch(() => toast.error("No se pudo marcar como leída."));
                }}
                className="flex items-start gap-4 rounded-xl px-5 py-4 text-left w-full transition-colors"
                style={{
                  backgroundColor: n.leida ? "#131219" : "#19172280",
                  border: `1px solid ${n.leida ? "rgba(255,255,255,0.06)" : "rgba(154,98,250,0.18)"}`,
                }}
                onMouseEnter={(e) => {
                  if (!n.leida) (e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.35)";
                }}
                onMouseLeave={(e) => {
                  if (!n.leida) (e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.18)";
                }}
              >
                {/* Ícono + punto de no leída */}
                <div className="relative shrink-0 mt-0.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  {!n.leida && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#9A62FA" }}
                    />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className="text-sm font-semibold leading-snug"
                      style={{ color: n.leida ? "#9B9A9F" : "#F2F0F7" }}
                    >
                      {n.titulo}
                    </p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#7E7C86" }}>
                    {n.mensaje}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    {n.empresaNombre && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" style={{ color: "#4A4850" }} />
                        <span className="text-[11px]" style={{ color: "#4A4850" }}>{n.empresaNombre}</span>
                      </div>
                    )}
                    <span className="text-[11px]" style={{ color: "#4A4850" }}>{n.creadaEn}</span>
                    {!n.leida && (
                      <span className="text-[11px] ml-auto" style={{ color: "#9A62FA" }}>
                        Clic para marcar como leída
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

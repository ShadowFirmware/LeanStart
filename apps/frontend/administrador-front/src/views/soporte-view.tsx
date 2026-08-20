"use client";

import { useMemo, useState } from "react";
import { LifeBuoy, Search, Mail, MailWarning, CornerDownRight, Monitor } from "lucide-react";
import { toast } from "sonner";
import { usePagination, PaginationBar, useHasHydrated, ViewSkeleton, Button } from "@leanstart/commons";
import { useSoporteStore, type EstadoReporte, type ReporteSoporte } from "../store/soporte";

const TODOS = "todos";

const FILTROS: { value: string; label: string }[] = [
  { value: "nuevo", label: "Nuevos" },
  { value: "atendido", label: "Atendidos" },
  { value: TODOS, label: "Todos" },
];

const ESTADO_COLOR: Record<EstadoReporte, string> = {
  nuevo: "#9A62FA",
  atendido: "#10B981",
};

/**
 * Buzón de soporte del administrador. La lista sale de la base, no de un correo:
 * aunque Resend esté caído o sin configurar, el reporte llega aquí igual — por
 * eso los que no se pudieron avisar se marcan en vez de esconderse.
 */
export function SoporteView() {
  const hydrated = useHasHydrated();
  const reportes = useSoporteStore((s) => s.reportes);
  const cambiarEstado = useSoporteStore((s) => s.cambiarEstado);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("nuevo");
  const [abierto, setAbierto] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return reportes.filter((r) => {
      const coincideBusqueda =
        !q ||
        r.asunto.toLowerCase().includes(q) ||
        r.mensaje.toLowerCase().includes(q) ||
        r.autorNombre.toLowerCase().includes(q) ||
        r.autorCorreo.toLowerCase().includes(q);
      const coincideEstado = filtroEstado === TODOS || r.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [reportes, busqueda, filtroEstado]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtrados, {
    resetKey: `${busqueda}|${filtroEstado}`,
  });

  const nuevos = reportes.filter((r) => r.estado === "nuevo").length;

  async function alternarEstado(reporte: ReporteSoporte) {
    const destino: EstadoReporte = reporte.estado === "atendido" ? "nuevo" : "atendido";
    try {
      await cambiarEstado(reporte.id, destino);
      toast.success(destino === "atendido" ? "Reporte marcado como atendido." : "Reporte reabierto.");
    } catch {
      toast.error("No se pudo actualizar el reporte.");
    }
  }

  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={5} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Buzón de soporte</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Reportes que los usuarios mandan desde &quot;Mi perfil → Soporte técnico&quot;.
          {nuevos > 0 && ` ${nuevos} sin atender.`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
          <input
            type="text"
            placeholder="Buscar por asunto, mensaje o persona..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
            style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
          />
        </div>
        <div
          className="flex items-center gap-1 rounded-lg p-1 shrink-0 overflow-x-auto"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
        >
          {FILTROS.map(({ value, label }) => {
            const isActive = filtroEstado === value;
            return (
              <button
                key={value}
                onClick={() => setFiltroEstado(value)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: isActive ? "rgba(154,98,250,0.18)" : "transparent",
                  color: isActive ? "var(--text-strong)" : "var(--text-dim)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div
          className="rounded-xl p-14 text-center"
          style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
        >
          <LifeBuoy className="w-9 h-9 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>
            {busqueda ? "Sin resultados" : filtroEstado === "nuevo" ? "Nada pendiente" : "Aún no hay reportes"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            {busqueda
              ? "Prueba con otros términos."
              : "Los reportes de soporte técnico de los usuarios aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pageItems.map((r) => {
            const expandido = abierto === r.id;
            return (
              <div
                key={r.id}
                className="rounded-xl overflow-hidden transition-colors"
                style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
              >
                <button
                  type="button"
                  onClick={() => setAbierto(expandido ? null : r.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                  aria-expanded={expandido}
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: ESTADO_COLOR[r.estado] }}
                    aria-label={r.estado === "nuevo" ? "Sin atender" : "Atendido"}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>
                      {r.asunto}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>
                      {r.autorNombre} · {r.autorRoles.join(", ")} · {r.creadoEn}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.respuestas.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-dim)" }}>
                        <CornerDownRight className="w-3.5 h-3.5" />
                        {r.respuestas.length}
                      </span>
                    )}
                    {!r.avisado && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(239,68,68,0.14)", color: "#EF4444" }}
                        title="El reporte se guardó, pero el aviso por correo no salió. Revisa RESEND_API_KEY."
                      >
                        <MailWarning className="w-3 h-3" /> Sin avisar
                      </span>
                    )}
                  </div>
                </button>

                {expandido && (
                  <div className="px-4 pb-4 flex flex-col gap-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap pt-4"
                      style={{ color: "var(--text-strong)" }}
                    >
                      {r.mensaje}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-dim)" }}>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <a href={`mailto:${r.autorCorreo}`} className="underline underline-offset-2">{r.autorCorreo}</a>
                      </span>
                      {r.navegador && (
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <Monitor className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{r.navegador}</span>
                        </span>
                      )}
                    </div>

                    {r.respuestas.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {r.respuestas.map((resp) => (
                          <div
                            key={resp.id}
                            className="rounded-lg p-3"
                            style={{ backgroundColor: "var(--hover-surface-2)" }}
                          >
                            <p className="text-xs mb-1" style={{ color: "var(--text-dim)" }}>
                              {resp.remitente} · {resp.recibidaEn}
                            </p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-strong)" }}>
                              {resp.cuerpo}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" className="h-9 rounded-lg text-sm" onClick={() => alternarEstado(r)}>
                        {r.estado === "atendido" ? "Reabrir" : "Marcar como atendido"}
                      </Button>
                      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                        Contesta por correo: las respuestas del hilo se archivan aquí.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
}

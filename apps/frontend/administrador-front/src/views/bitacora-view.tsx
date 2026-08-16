"use client";

import { useMemo, useState } from "react";
import { Search, ScrollText } from "lucide-react";
import { usePagination, PaginationBar, useHasHydrated, ViewSkeleton } from "@leanstart/commons";
import { useBitacoraStore, type ServicioBitacora } from "../store/bitacora";

const SERVICIO_CONFIG: Record<ServicioBitacora, { label: string; color: string }> = {
  auth: { label: "Usuarios y privilegios", color: "#9A62FA" },
  empresas: { label: "Empresas", color: "#3B82F6" },
  evaluaciones: { label: "Evaluaciones", color: "#10B981" },
};

const TODOS = "todos";

const FILTROS_SERVICIO = [
  { value: TODOS, label: "Todos" },
  { value: "auth", label: "Usuarios y privilegios" },
  { value: "empresas", label: "Empresas" },
  { value: "evaluaciones", label: "Evaluaciones" },
];

function formatAccion(accion: string): string {
  return accion.replace(/[._]/g, " ");
}

export function BitacoraView() {
  const hydrated = useHasHydrated();
  const entradas = useBitacoraStore((s) => s.entradas);

  const [busqueda, setBusqueda] = useState("");
  const [filtroServicio, setFiltroServicio] = useState(TODOS);

  const entradasFiltradas = useMemo(() => {
    return entradas.filter((e) => {
      const q = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !q ||
        e.actorNombre.toLowerCase().includes(q) ||
        e.actorCorreo.toLowerCase().includes(q) ||
        e.accion.toLowerCase().includes(q) ||
        (e.entidadDescripcion?.toLowerCase().includes(q) ?? false) ||
        (e.detalle?.toLowerCase().includes(q) ?? false);
      const coincideServicio = filtroServicio === TODOS || e.servicio === filtroServicio;
      return coincideBusqueda && coincideServicio;
    });
  }, [entradas, busqueda, filtroServicio]);

  const { page, setPage, totalPages, pageItems: entradasPagina, pageSize, totalItems } = usePagination(entradasFiltradas, {
    resetKey: `${busqueda}|${filtroServicio}`,
  });

  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={6} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Bitácora de auditoría</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Registro de acciones administrativas sobre usuarios, roles, privilegios, empresas y evaluaciones.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
          <input
            type="text"
            placeholder="Buscar por actor, acción o detalle..."
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
          {FILTROS_SERVICIO.map(({ value, label }) => {
            const isActive = filtroServicio === value;
            return (
              <button
                key={value}
                onClick={() => setFiltroServicio(value)}
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

      {entradasFiltradas.length === 0 ? (
        <div
          className="rounded-xl p-14 text-center"
          style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
        >
          <ScrollText className="w-9 h-9 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>
            {busqueda || filtroServicio !== TODOS ? "Sin resultados" : "Aún no hay entradas"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            {busqueda || filtroServicio !== TODOS ? "Prueba con otros términos o filtros." : "Las acciones administrativas aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entradasPagina.map((e) => {
            const cfg = SERVICIO_CONFIG[e.servicio];
            return (
              <div
                key={e.id}
                className="flex flex-wrap items-center gap-3 rounded-xl px-5 py-3.5"
                style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
              >
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
                  style={{ color: cfg.color, backgroundColor: `${cfg.color}1F` }}
                >
                  {cfg.label}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm" style={{ color: "var(--text-strong)" }}>
                    <span className="font-medium">{e.actorNombre}</span>{" "}
                    <span style={{ color: "var(--text-dim)" }}>{formatAccion(e.accion)}</span>
                    {e.entidadDescripcion && (
                      <>
                        {" "}
                        <span style={{ color: "var(--text-dim)" }}>—</span>{" "}
                        <span className="font-medium">{e.entidadDescripcion}</span>
                      </>
                    )}
                  </p>
                  {e.detalle && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{e.detalle}</p>
                  )}
                </div>

                <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>{e.creadaEn}</span>
              </div>
            );
          })}
        </div>
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        pageSize={pageSize}
        itemLabel={totalItems === 1 ? "entrada" : "entradas"}
      />
    </div>
  );
}

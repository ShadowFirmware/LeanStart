"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare, ClipboardList, CheckCircle2, Search, ChevronDown, ArrowRight,
  LayoutTemplate, Package, Lightbulb, Building2,
} from "lucide-react";
import { useEmpresasStore, useObservacionesStore, type CanvasData, type Observacion } from "@leanstart/empresas-front";
import { useHasHydrated, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, usePagination, PaginationBar, ViewSkeleton, EmpresaLogo } from "@leanstart/commons";
import type { EstadoObservacion } from "@leanstart/commons";

const TODOS_LOS_ESTADOS = "todos";
const TODOS_LOS_MODULOS = "todos";

const ESTADO_OBS_CONFIG: Record<EstadoObservacion, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador", color: "var(--text-dim)", bg: "var(--border-hair)" },
  pendiente: { label: "Pendiente", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  // El mentor nunca ve una observación suya en "resuelta" (el backend la oculta hasta que
  // el emprendedor la manda de vuelta) — entrada solo para que el Record quede completo.
  resuelta: { label: "Resuelta", color: "var(--text-dim)", bg: "var(--border-hair)" },
  en_revision: { label: "En revisión", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  atendida: { label: "Atendida", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  cerrada: { label: "Cerrada", color: "var(--text-dim)", bg: "var(--border-hair)" },
};

const MODULO_CONFIG: Record<Observacion["tipoElemento"], { label: string; icon: React.ElementType }> = {
  canvas: { label: "Lean Canvas", icon: LayoutTemplate },
  producto: { label: "Producto", icon: Package },
  hipotesis: { label: "Hipótesis", icon: Lightbulb },
  general: { label: "Comentario general", icon: Building2 },
};

const CANVAS_BLOCK_LABELS: Record<keyof CanvasData, string> = {
  problema: "Problema",
  solucion: "Solución",
  pvp: "Propuesta de valor única",
  ventajaInjusta: "Ventaja injusta",
  segmentosClientes: "Segmentos de clientes",
  metricasClave: "Métricas clave",
  canales: "Canales",
  estructuraCostos: "Estructura de costos",
  fuentesIngresos: "Fuentes de ingresos",
};

interface MentorHistorialViewProps {
  autorNombre?: string;
}

export function MentorHistorialView({ autorNombre = "Mentor Demo" }: MentorHistorialViewProps = {}) {
  const hydrated = useHasHydrated();
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const observacionesRaw = useObservacionesStore((s) => s.observaciones);
  const empresas = hydrated ? empresasRaw : [];
  const observaciones = hydrated ? observacionesRaw : [];

  const registros = observaciones
    .filter((o) => o.autorNombre === autorNombre)
    .map((o) => {
      const empresa = empresas.find((e) => e.id === o.empresaId);

      let elemento: string;
      if (o.tipoElemento === "canvas") {
        elemento = CANVAS_BLOCK_LABELS[o.elementoId as keyof CanvasData] ?? o.elementoId;
      } else if (o.tipoElemento === "general") {
        elemento = "Información principal";
      } else if (o.tipoElemento === "producto") {
        elemento = empresa?.productosList?.find((p) => p.id === o.elementoId)?.nombre ?? "Producto eliminado";
      } else {
        const indice = empresa?.hipotesisList?.findIndex((h) => h.id === o.elementoId) ?? -1;
        elemento = indice >= 0 ? `Hipótesis #${indice + 1}` : "Hipótesis eliminada";
      }

      return {
        id: o.id,
        empresaId: o.empresaId,
        fecha: o.creadaEn,
        empresaNombre: empresa?.nombre ?? "Empresa eliminada",
        empresaLogoUrl: empresa?.logoUrl,
        modulo: o.tipoElemento,
        elemento,
        comentario: o.comentario,
        estado: o.estado,
      };
    });

  const total = registros.length;
  const atendidas = registros.filter((r) => r.estado === "atendida" || r.estado === "cerrada").length;
  const pendientes = total - atendidas;

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(TODOS_LOS_ESTADOS);
  const [filtroModulo, setFiltroModulo] = useState(TODOS_LOS_MODULOS);

  const registrosFiltrados = registros.filter((r) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      !texto || r.empresaNombre.toLowerCase().includes(texto) || r.comentario.toLowerCase().includes(texto);
    const coincideEstado = filtroEstado === TODOS_LOS_ESTADOS || r.estado === filtroEstado;
    const coincideModulo = filtroModulo === TODOS_LOS_MODULOS || r.modulo === filtroModulo;
    return coincideBusqueda && coincideEstado && coincideModulo;
  });

  /* ─── Agrupación por proyecto ───
     Un mentor con veinte observaciones repartidas en tres empresas veía veinte
     tarjetas seguidas repitiendo el nombre del proyecto: una lista larguísima
     aunque estuviera paginada, porque la unidad de la página era la observación
     y no el proyecto. Ahora la página lista proyectos —que es como el mentor
     piensa su trabajo— y cada uno abre sus observaciones al desplegarlo. */
  const grupos = useMemo(() => {
    const porEmpresa = new Map<string, typeof registrosFiltrados>();
    for (const registro of registrosFiltrados) {
      const acumulado = porEmpresa.get(registro.empresaId);
      if (acumulado) acumulado.push(registro);
      else porEmpresa.set(registro.empresaId, [registro]);
    }

    return [...porEmpresa.entries()]
      .map(([empresaId, items]) => ({
        empresaId,
        empresaNombre: items[0].empresaNombre,
        empresaLogoUrl: items[0].empresaLogoUrl,
        items,
        atendidas: items.filter((r) => r.estado === "atendida" || r.estado === "cerrada").length,
        pendientes: items.filter((r) => r.estado !== "atendida" && r.estado !== "cerrada").length,
      }))
      // Primero los proyectos que todavía esperan algo, y entre ellos los que
      // más carga acumulan: lo que el mentor necesita atender queda arriba.
      .sort((a, b) => b.pendientes - a.pendientes || b.items.length - a.items.length || a.empresaNombre.localeCompare(b.empresaNombre));
  }, [registrosFiltrados]);

  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  function alternarGrupo(empresaId: string) {
    setExpandidos((previos) => {
      const siguiente = new Set(previos);
      if (siguiente.has(empresaId)) siguiente.delete(empresaId);
      else siguiente.add(empresaId);
      return siguiente;
    });
  }

  // Buscando un texto, esconder los resultados detrás de un clic sería absurdo:
  // con búsqueda activa los grupos vienen abiertos.
  const hayBusqueda = busqueda.trim().length > 0;

  const { page, setPage, totalPages, pageItems: gruposPagina, pageSize, totalItems } = usePagination(grupos, {
    pageSize: 8,
    resetKey: `${busqueda}|${filtroEstado}|${filtroModulo}`,
  });

  // Esqueleto neutro hasta rehidratar: evita mostrar "sin observaciones" un instante.
  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={4} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Historial de Mentorías</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Consulta todas las observaciones que has realizado anteriormente.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Observaciones realizadas", value: total, icon: MessageSquare },
          { label: "Pendientes de resolución", value: pendientes, icon: ClipboardList },
          { label: "Atendidas", value: atendidas, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.15)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>{label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-strong)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Búsqueda y filtros */}
      {registros.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--text-faint)" }}
            />
            <input
              type="text"
              placeholder="Buscar por empresa o comentario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>

          <Select
            value={filtroEstado}
            onValueChange={(v) => setFiltroEstado(v ?? TODOS_LOS_ESTADOS)}
            items={[
              { value: TODOS_LOS_ESTADOS, label: "Todos los estados" },
              ...(Object.entries(ESTADO_OBS_CONFIG) as [EstadoObservacion, typeof ESTADO_OBS_CONFIG[EstadoObservacion]][])
                .map(([value, cfg]) => ({ value, label: cfg.label })),
            ]}
          >
            <SelectTrigger
              className="w-full sm:w-48 h-9 text-sm shrink-0"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_ESTADOS}>Todos los estados</SelectItem>
              {(Object.entries(ESTADO_OBS_CONFIG) as [EstadoObservacion, typeof ESTADO_OBS_CONFIG[EstadoObservacion]][])
                .map(([value, cfg]) => (
                  <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={filtroModulo}
            onValueChange={(v) => setFiltroModulo(v ?? TODOS_LOS_MODULOS)}
            items={[
              { value: TODOS_LOS_MODULOS, label: "Todos los módulos" },
              ...(Object.entries(MODULO_CONFIG) as [Observacion["tipoElemento"], typeof MODULO_CONFIG[Observacion["tipoElemento"]]][])
                .map(([value, cfg]) => ({ value, label: cfg.label })),
            ]}
          >
            <SelectTrigger
              className="w-full sm:w-48 h-9 text-sm shrink-0"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_MODULOS}>Todos los módulos</SelectItem>
              {(Object.entries(MODULO_CONFIG) as [Observacion["tipoElemento"], typeof MODULO_CONFIG[Observacion["tipoElemento"]]][])
                .map(([value, cfg]) => (
                  <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lista de observaciones */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
            Observaciones por proyecto
          </p>
          {grupos.length > 0 && (
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              {registrosFiltrados.length} {registrosFiltrados.length === 1 ? "observación" : "observaciones"} en{" "}
              {grupos.length} {grupos.length === 1 ? "proyecto" : "proyectos"}
            </p>
          )}
        </div>

        {registrosFiltrados.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
          >
            <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {registros.length === 0
                ? "Aún no has dejado observaciones. Cuando comentes en un proyecto, aparecerán aquí."
                : "Sin resultados para tu búsqueda/filtros."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {gruposPagina.map((grupo) => {
              const abierto = hayBusqueda || expandidos.has(grupo.empresaId);
              return (
                <div
                  key={grupo.empresaId}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
                >
                  {/* Cabecera del proyecto: desplegar va aquí y abrir el proyecto
                      en su propio enlace, al pie del grupo — anidar un <a> dentro
                      de un <button> no es HTML válido y rompe el teclado. */}
                  <button
                    type="button"
                    onClick={() => alternarGrupo(grupo.empresaId)}
                    aria-expanded={abierto}
                    className="flex w-full min-w-0 items-center gap-4 px-5 py-4 text-left"
                  >
                    <EmpresaLogo nombre={grupo.empresaNombre} logoUrl={grupo.empresaLogoUrl} size={40} radio="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>
                        {grupo.empresaNombre}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                        {grupo.items.length} {grupo.items.length === 1 ? "observación" : "observaciones"}
                        {grupo.pendientes > 0 && ` · ${grupo.pendientes} sin atender`}
                        {grupo.atendidas > 0 && ` · ${grupo.atendidas} ${grupo.atendidas === 1 ? "atendida" : "atendidas"}`}
                      </p>
                    </div>
                    {grupo.pendientes > 0 && (
                      <span
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
                        style={{ color: "#F59E0B", backgroundColor: "rgba(245,158,11,0.12)" }}
                      >
                        {grupo.pendientes} pendiente{grupo.pendientes === 1 ? "" : "s"}
                      </span>
                    )}
                    <ChevronDown
                      className="w-4 h-4 shrink-0 transition-transform"
                      style={{ color: "var(--text-dim)", transform: abierto ? "rotate(180deg)" : "none" }}
                      aria-hidden
                    />
                  </button>

                  {abierto && (
                    <div className="flex flex-col" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      {grupo.items.map((r, i) => {
                        const cfg = ESTADO_OBS_CONFIG[r.estado];
                        const moduloCfg = MODULO_CONFIG[r.modulo];
                        return (
                          <div
                            key={r.id}
                            className="flex items-start gap-3 px-5 py-3"
                            style={{ borderTop: i === 0 ? "none" : "1px solid var(--hover-surface)" }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)" }}
                            >
                              <moduloCfg.icon className="w-4 h-4" style={{ color: "var(--brand)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <p className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>
                                  {moduloCfg.label} · {r.elemento}
                                </p>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                                  >
                                    {cfg.label}
                                  </span>
                                  <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-faint)" }}>
                                    {r.fecha}
                                  </span>
                                </div>
                              </div>
                              {/* Recortado a dos líneas: un comentario de 500 caracteres
                                  no puede estirar la fila del resto. */}
                              <p
                                className="text-sm mt-1 leading-relaxed break-words line-clamp-2"
                                style={{ color: "var(--muted-foreground)", overflowWrap: "anywhere" }}
                                title={r.comentario}
                              >
                                {r.comentario}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      <Link
                        href={`/mentor/empresas/${grupo.empresaId}`}
                        className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-medium transition-colors"
                        style={{ color: "var(--brand)", borderTop: "1px solid var(--hover-surface)" }}
                      >
                        Abrir proyecto
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
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
          itemLabel={totalItems === 1 ? "proyecto" : "proyectos"}
        />
      </div>
    </div>
  );
}

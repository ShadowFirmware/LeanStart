"use client";

import { useMemo, useState } from "react";
import {
  BarChart3, FileText, LayoutTemplate, Sparkles, Search, Plus,
  ChevronRight, ChevronLeft, History as HistoryIcon, User, CalendarDays,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  useCurrentUser, useUsuariosStore,
  usePagination, PaginationBar, useHasHydrated, ViewSkeleton, GIRO_LABELS, EmpresaLogo,
} from "@leanstart/commons";
import { useEmpresasStore, type Empresa } from "@leanstart/empresas-front";
import { useCriteriosStore } from "../store/criterios";
import { useViabilidadStore } from "../store/viabilidad";
import { useEvaluacionesStore } from "../store/evaluaciones";
import { useReportesGeneradosStore, type TipoReporte } from "../store/reportes-generados";
import { calcularReporte } from "../lib/reporte";
import { ReporteDocumento } from "../components/reporte-documento";

const cardStyle = { backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" };
const TODOS_LOS_TIPOS = "todos";

const TIPO_CONFIG: Record<
  TipoReporte,
  { label: string; hint: string; icon: React.ElementType; color: string; bg: string }
> = {
  boleta: {
    label: "Boleta de evaluación",
    hint: "Criterios, calificación y viabilidad",
    icon: FileText,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
  },
  canvas: {
    label: "Reporte Lean Canvas",
    hint: "Bloques del canvas y comentarios del evaluador",
    icon: LayoutTemplate,
    color: "var(--brand)",
    bg: "var(--brand-tint)",
  },
};

export function ReportesView() {
  const hydrated = useHasHydrated();
  const empresas = useEmpresasStore((s) => s.empresas);
  const criterios = useCriteriosStore((s) => s.criterios);
  const niveles = useViabilidadStore((s) => s.niveles);
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);
  const evaluaciones = useEvaluacionesStore((s) => s.evaluaciones);
  const usuarios = useUsuariosStore((s) => s.usuarios);

  const historial = useReportesGeneradosStore((s) => s.reportes);
  const registrarReporte = useReportesGeneradosStore((s) => s.registrarReporte);

  const usuarioActual = useCurrentUser();

  const empresasOrdenadas = useMemo(
    () => [...empresas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })),
    [empresas]
  );

  // Filtros del historial
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>(TODOS_LOS_TIPOS);

  // Diálogo "Generar reporte"
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paso, setPaso] = useState<"tipo" | "empresa">("tipo");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoReporte | null>(null);
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("");

  // Documento activo (recién generado o reabierto desde el historial). `guardado` distingue
  // uno del otro: un reporte recién generado no se guarda en el historial hasta que el
  // admin le da clic explícito a "Guardar reporte" (antes se guardaba solo con elegir la
  // empresa, aunque el admin solo quisiera ver una vista previa y cerrarla sin guardar nada).
  const [reporteActivo, setReporteActivo] = useState<{ tipo: TipoReporte; empresaId: string; guardado: boolean } | null>(null);

  const empresaActiva = reporteActivo ? empresas.find((e) => e.id === reporteActivo.empresaId) : undefined;
  const evaluacionActiva = reporteActivo ? evaluaciones[reporteActivo.empresaId] : undefined;
  const autorEmpresaActiva = empresaActiva
    ? (usuarios.find((u) => u.id === empresaActiva.ownerId)?.nombre ?? "—")
    : "—";
  const calculoActivo = useMemo(
    () => (empresaActiva ? calcularReporte(empresaActiva, evaluacionActiva, criterios, niveles, pesoEvaluacion) : null),
    [empresaActiva, evaluacionActiva, criterios, niveles, pesoEvaluacion]
  );

  function abrirDialogo() {
    setPaso("tipo");
    setTipoSeleccionado(null);
    setBusquedaEmpresa("");
    setDialogOpen(true);
  }

  function elegirTipo(tipo: TipoReporte) {
    setTipoSeleccionado(tipo);
    setPaso("empresa");
  }

  function elegirEmpresa(empresa: Empresa) {
    if (!tipoSeleccionado) return;
    // Solo abre la vista previa — el reporte no queda en el historial hasta que el
    // admin le dé clic a "Guardar reporte" dentro del documento.
    setReporteActivo({ tipo: tipoSeleccionado, empresaId: empresa.id, guardado: false });
    setDialogOpen(false);
  }

  async function guardarReporteActivo() {
    if (!reporteActivo || !empresaActiva) return;
    await registrarReporte({
      empresaId: empresaActiva.id,
      empresaNombre: empresaActiva.nombre,
      tipo: reporteActivo.tipo,
      generadoPor: usuarioActual?.name?.trim() || "Administrador",
    });
  }

  const empresasFiltradasDialogo = empresasOrdenadas.filter((e) =>
    e.nombre.toLowerCase().includes(busquedaEmpresa.toLowerCase())
  );

  const historialFiltrado = historial.filter((r) => {
    const coincideTipo = filtroTipo === TODOS_LOS_TIPOS || r.tipo === filtroTipo;
    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      r.empresaNombre.toLowerCase().includes(q) ||
      (r.generadoPor ?? "").toLowerCase().includes(q);
    return coincideTipo && coincideBusqueda;
  });

  const { page, setPage, totalPages, pageItems: historialPagina, pageSize, totalItems } = usePagination(historialFiltrado, {
    resetKey: `${busqueda}|${filtroTipo}`,
  });

  // Un reporte combina cinco stores persistidos (empresas, criterios, viabilidad,
  // evaluaciones, historial): sin esta guarda el historial parpadearía vacío.
  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={4} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--brand-tint)", border: "1px solid var(--brand-tint-strong)" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Reportes</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
              Consulta el historial de reportes generados o crea uno nuevo para una empresa.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={abrirDialogo}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 h-10 rounded-xl border-0 shrink-0 transition-opacity hover:opacity-90"
          style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
        >
          <Plus className="w-4 h-4" /> Generar reporte
        </button>
      </div>

      {/* Encabezado de la sección de historial (siempre visible) */}
      <div className="flex items-center gap-2 pt-1">
        <HistoryIcon className="w-4 h-4" style={{ color: "var(--brand)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Historial de reportes</h2>
        {historial.length > 0 && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand)" }}
          >
            {historial.length}
          </span>
        )}
      </div>

      {/* Filtros del historial */}
      {historial.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            <input
              type="text"
              placeholder="Buscar por empresa o autor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>
          <Select
            value={filtroTipo}
            onValueChange={(v) => setFiltroTipo(v ?? TODOS_LOS_TIPOS)}
            items={[
              { value: TODOS_LOS_TIPOS, label: "Todos los tipos" },
              ...(Object.entries(TIPO_CONFIG) as [TipoReporte, typeof TIPO_CONFIG[TipoReporte]][]).map(([tipo, cfg]) => ({ value: tipo, label: cfg.label })),
            ]}
          >
            <SelectTrigger
              className="w-full sm:w-56 h-9 text-sm shrink-0"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_TIPOS}>Todos los tipos</SelectItem>
              {(Object.entries(TIPO_CONFIG) as [TipoReporte, typeof TIPO_CONFIG[TipoReporte]][]).map(([tipo, cfg]) => (
                <SelectItem key={tipo} value={tipo}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Historial de reportes generados */}
      {historialFiltrado.length === 0 ? (
        <div className="rounded-2xl p-10 flex flex-col items-center text-center" style={cardStyle}>
          {historial.length === 0 ? (
            <>
              <HistoryIcon className="w-9 h-9 mb-3" style={{ color: "var(--text-faint)" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>Aún no se han generado reportes</p>
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>Usa “Generar reporte” para crear la boleta de evaluación o el reporte de Lean Canvas de una empresa.</p>
            </>
          ) : (
            <>
              <Sparkles className="w-9 h-9 mb-3" style={{ color: "var(--text-faint)" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>Sin resultados</p>
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>Prueba con otros términos o filtros.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {historialPagina.map((r) => {
            const empresa = empresas.find((e) => e.id === r.empresaId);
            const cfg = TIPO_CONFIG[r.tipo];
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setReporteActivo({ tipo: r.tipo, empresaId: r.empresaId, guardado: true })}
                disabled={!empresa}
                title={empresa ? `Abrir ${cfg.label}` : "La empresa fue eliminada"}
                className="flex flex-col rounded-xl p-5 text-left transition-[border-color] disabled:opacity-60 disabled:cursor-not-allowed"
                style={cardStyle}
                onMouseEnter={(e) => { if (empresa) e.currentTarget.style.borderColor = "rgba(154,98,250,0.25)"; }}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              >
                {/* Header: logo empresa + nombre + tipo de reporte */}
                <div className="flex items-start gap-3 mb-4">
                  {empresa ? (
                    <EmpresaLogo nombre={empresa.nombre} logoUrl={empresa.logoUrl} size={48} borde="sutil" />
                  ) : (
                    <div
                      className="rounded-xl flex items-center justify-center font-bold shrink-0"
                      style={{ width: 48, height: 48, fontSize: 19, backgroundColor: "var(--border-subtle)", color: "var(--text-dim)" }}
                    >
                      {r.empresaNombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug truncate" style={{ color: "var(--text-strong)" }}>
                      {r.empresaNombre}
                    </p>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1 max-w-full"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      <cfg.icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{cfg.label}</span>
                    </span>
                  </div>
                  {empresa && <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: "var(--text-faint)" }} />}
                </div>

                {/* Pie: autor + fecha */}
                <div
                  className="flex items-center justify-between gap-3 pt-3.5 mt-auto"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
                    <span className="text-xs truncate" style={{ color: "var(--text-dim)" }}>
                      {r.generadoPor || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CalendarDays className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                    <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
                      {r.generadoEn}
                    </span>
                  </div>
                </div>

                {!empresa && (
                  <span className="text-[11px] mt-2" style={{ color: "#EF4444" }}>Empresa eliminada</span>
                )}
              </button>
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
        itemLabel={totalItems === 1 ? "reporte" : "reportes"}
      />

      {/* Diálogo: generar reporte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          {paso === "tipo" ? (
            <>
              <DialogHeader>
                <DialogTitle>Generar reporte</DialogTitle>
                <DialogDescription>Elige el tipo de reporte que quieres generar.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2.5">
                {(Object.entries(TIPO_CONFIG) as [TipoReporte, typeof TIPO_CONFIG[TipoReporte]][]).map(([tipo, cfg]) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => elegirTipo(tipo)}
                    className="flex items-center gap-3 rounded-xl p-3.5 text-left transition-colors"
                    style={{ backgroundColor: "var(--hover-surface-2)", border: "1px solid var(--border-hair)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(154,98,250,0.10)" }}>
                      <cfg.icon className="w-4.5 h-4.5" style={{ color: "var(--brand)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>{cfg.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{cfg.hint}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 ml-auto" style={{ color: "var(--text-faint)" }} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <button
                  type="button"
                  onClick={() => setPaso("tipo")}
                  className="inline-flex items-center gap-1 text-xs mb-1 w-fit transition-colors"
                  style={{ color: "var(--text-dim)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-strong)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Cambiar tipo de reporte
                </button>
                <DialogTitle>Selecciona la empresa</DialogTitle>
                <DialogDescription>{tipoSeleccionado && TIPO_CONFIG[tipoSeleccionado].label}</DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={busquedaEmpresa}
                  onChange={(e) => setBusquedaEmpresa(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
                  style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
                />
              </div>

              <div className="max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
                {empresasFiltradasDialogo.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: "var(--text-dim)" }}>No se encontraron empresas.</p>
                ) : (
                  empresasFiltradasDialogo.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => elegirEmpresa(e)}
                      className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors"
                      style={{ backgroundColor: "var(--hover-surface-2)", border: "1px solid var(--border-hair)" }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = "rgba(154,98,250,0.35)")}
                      onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = "var(--border-hair)")}
                    >
                      <EmpresaLogo nombre={e.nombre} logoUrl={e.logoUrl} size={36} borde="sutil" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-strong)" }}>{e.nombre}</p>
                        <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>{GIRO_LABELS[e.giro]}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-faint)" }} />
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Documento imprimible */}
      {reporteActivo && empresaActiva && calculoActivo && (
        <ReporteDocumento
          tipo={reporteActivo.tipo}
          empresa={empresaActiva}
          autorEmpresa={autorEmpresaActiva}
          calculo={calculoActivo}
          comentarioEvaluador={evaluacionActiva?.comentarioEvaluador ?? ""}
          guardado={reporteActivo.guardado}
          onGuardar={guardarReporteActivo}
          onClose={() => setReporteActivo(null)}
        />
      )}
    </div>
  );
}

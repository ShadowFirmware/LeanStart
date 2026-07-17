"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3, FileText, LayoutTemplate, Sparkles, Search, Plus,
  ChevronRight, ChevronLeft, History as HistoryIcon,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@leanstart/commons";
import { useEmpresasStore, type Empresa } from "@leanstart/empresas-front";
import { useCriteriosStore } from "../store/criterios";
import { useViabilidadStore } from "../store/viabilidad";
import { useEvaluacionesStore } from "../store/evaluaciones";
import { useReportesGeneradosStore, type TipoReporte } from "../store/reportes-generados";
import { calcularReporte, GIRO_LABELS } from "../lib/reporte";
import { ReporteDocumento } from "../components/reporte-documento";

const cardStyle = { backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" };
const TODOS_LOS_TIPOS = "todos";

const TIPO_CONFIG: Record<TipoReporte, { label: string; hint: string; icon: React.ElementType }> = {
  boleta: { label: "Boleta de evaluación", hint: "Criterios, calificación y viabilidad", icon: FileText },
  canvas: { label: "Reporte Lean Canvas", hint: "Bloques del canvas y comentarios del evaluador", icon: LayoutTemplate },
};

/** Logo de la empresa (o inicial) con tamaño configurable. */
function EmpresaLogo({ empresa, size = 40 }: { empresa: Empresa; size?: number }) {
  if (empresa.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={empresa.logoUrl}
        alt={empresa.nombre}
        className="rounded-xl object-contain shrink-0"
        style={{
          width: size,
          height: size,
          padding: Math.max(2, Math.round(size * 0.12)),
          backgroundColor: "rgba(154,98,250,0.12)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxSizing: "border-box",
        }}
      />
    );
  }
  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: "rgba(154,98,250,0.12)", color: "#9A62FA" }}
    >
      {empresa.nombre.charAt(0).toUpperCase()}
    </div>
  );
}

export function ReportesView() {
  const empresas = useEmpresasStore((s) => s.empresas);
  const criterios = useCriteriosStore((s) => s.criterios);
  const niveles = useViabilidadStore((s) => s.niveles);
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);
  const evaluaciones = useEvaluacionesStore((s) => s.evaluaciones);

  const historial = useReportesGeneradosStore((s) => s.reportes);
  const registrarReporte = useReportesGeneradosStore((s) => s.registrarReporte);

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

  // Documento activo (recién generado o reabierto desde el historial)
  const [reporteActivo, setReporteActivo] = useState<{ tipo: TipoReporte; empresaId: string } | null>(null);

  const empresaActiva = reporteActivo ? empresas.find((e) => e.id === reporteActivo.empresaId) : undefined;
  const evaluacionActiva = reporteActivo ? evaluaciones[reporteActivo.empresaId] : undefined;
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

  async function elegirEmpresa(empresa: Empresa) {
    if (!tipoSeleccionado) return;
    try {
      await registrarReporte({ empresaId: empresa.id, empresaNombre: empresa.nombre, tipo: tipoSeleccionado });
      setReporteActivo({ tipo: tipoSeleccionado, empresaId: empresa.id });
      setDialogOpen(false);
    } catch {
      toast.error("No se pudo registrar el reporte.");
    }
  }

  const empresasFiltradasDialogo = empresasOrdenadas.filter((e) =>
    e.nombre.toLowerCase().includes(busquedaEmpresa.toLowerCase())
  );

  const historialFiltrado = historial.filter((r) => {
    const coincideTipo = filtroTipo === TODOS_LOS_TIPOS || r.tipo === filtroTipo;
    const coincideBusqueda = r.empresaNombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(154,98,250,0.12)", border: "1px solid rgba(154,98,250,0.2)" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "#9A62FA" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Reportes</h1>
            <p className="text-sm mt-0.5" style={{ color: "#7E7C86" }}>
              Consulta el historial de reportes generados o crea uno nuevo para una empresa.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={abrirDialogo}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 h-10 rounded-xl border-0 shrink-0 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
        >
          <Plus className="w-4 h-4" /> Generar reporte
        </button>
      </div>

      {/* Filtros del historial */}
      {historial.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#4A4850" }} />
            <input
              type="text"
              placeholder="Buscar por empresa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.07)", color: "#F2F0F7" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            />
          </div>
          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v ?? TODOS_LOS_TIPOS)}>
            <SelectTrigger
              className="w-full sm:w-56 h-9 text-sm shrink-0"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.07)", color: "#F2F0F7" }}
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
              <HistoryIcon className="w-9 h-9 mb-3" style={{ color: "#4A4850" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "#F2F0F7" }}>Aún no se han generado reportes</p>
              <p className="text-sm" style={{ color: "#7E7C86" }}>Usa “Generar reporte” para crear la boleta de evaluación o el reporte de Lean Canvas de una empresa.</p>
            </>
          ) : (
            <>
              <Sparkles className="w-9 h-9 mb-3" style={{ color: "#4A4850" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "#F2F0F7" }}>Sin resultados</p>
              <p className="text-sm" style={{ color: "#7E7C86" }}>Prueba con otros términos o filtros.</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {historialFiltrado.map((r) => {
            const empresa = empresas.find((e) => e.id === r.empresaId);
            const cfg = TIPO_CONFIG[r.tipo];
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setReporteActivo({ tipo: r.tipo, empresaId: r.empresaId })}
                disabled={!empresa}
                className="flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-[border-color] disabled:opacity-50 disabled:cursor-not-allowed"
                style={cardStyle}
                onMouseEnter={(e) => { if (empresa) e.currentTarget.style.borderColor = "rgba(154,98,250,0.25)"; }}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)" }}
                >
                  <cfg.icon className="w-4.5 h-4.5" style={{ color: "#9A62FA" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold truncate" style={{ color: "#F2F0F7" }}>
                      {empresa ? r.empresaNombre : `${r.empresaNombre} (eliminada)`}
                    </p>
                    <span className="text-[11px] whitespace-nowrap" style={{ color: "#4A4850" }}>{r.generadoEn}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
                    {cfg.label}{empresa ? ` · ${GIRO_LABELS[empresa.giro]}` : ""}
                  </p>
                </div>
                {empresa && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#4A4850" }} />}
              </button>
            );
          })}
        </div>
      )}

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
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(154,98,250,0.10)" }}>
                      <cfg.icon className="w-4.5 h-4.5" style={{ color: "#9A62FA" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "#F2F0F7" }}>{cfg.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>{cfg.hint}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 ml-auto" style={{ color: "#4A4850" }} />
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
                  style={{ color: "#7E7C86" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F2F0F7")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#7E7C86")}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Cambiar tipo de reporte
                </button>
                <DialogTitle>Selecciona la empresa</DialogTitle>
                <DialogDescription>{tipoSeleccionado && TIPO_CONFIG[tipoSeleccionado].label}</DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#4A4850" }} />
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={busquedaEmpresa}
                  onChange={(e) => setBusquedaEmpresa(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <div className="max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
                {empresasFiltradasDialogo.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: "#7E7C86" }}>No se encontraron empresas.</p>
                ) : (
                  empresasFiltradasDialogo.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => elegirEmpresa(e)}
                      className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = "rgba(154,98,250,0.35)")}
                      onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                    >
                      <EmpresaLogo empresa={e} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: "#F2F0F7" }}>{e.nombre}</p>
                        <p className="text-xs truncate" style={{ color: "#7E7C86" }}>{GIRO_LABELS[e.giro]}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#4A4850" }} />
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
          calculo={calculoActivo}
          comentarioEvaluador={evaluacionActiva?.comentarioEvaluador ?? ""}
          onClose={() => setReporteActivo(null)}
        />
      )}
    </div>
  );
}

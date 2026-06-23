"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Lightbulb,
  Sparkles,
  Lock,
  Users,
  BarChart2,
  Share2,
  TrendingDown,
  TrendingUp,
  GitCompare,
  Zap,
  UserCheck,
} from "lucide-react";
import { useEmpresasStore } from "@/store/empresas";

/* ─── Colores por bloque ─── */
const C = {
  problema:              "#8A1A5E",
  solucion:              "#1A6A3A",
  metricasClave:         "#0A4A5C",
  pvp:                   "#5C18A0",
  ventajaInjusta:        "#9A5A10",
  canales:               "#8A2810",
  segmentosClientes:     "#103E8A",
  estructuraCostos:      "#28108A",
  fuentesIngresos:       "#105C8A",
};

/* ─── Bloque principal ─── */
function Block({
  icon: Icon,
  title,
  hint,
  color,
  style,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
  color: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: color,
        borderRadius: 14,
        padding: "20px 20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        ...style,
      }}
    >
      <Icon size={18} color="rgba(255,255,255,0.85)" strokeWidth={2} />
      <div>
        <p style={{ color: "white", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.3 }}>
          {title}
        </p>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 5, lineHeight: 1.5 }}>
          {hint}
        </p>
      </div>
      {children}
    </div>
  );
}

/* ─── Sub-sección dentro de un bloque ─── */
function SubBlock({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 10,
        padding: "14px 16px",
        marginTop: "auto",
        minHeight: 100,
      }}
    >
      <Icon size={14} color="rgba(255,255,255,0.6)" strokeWidth={2} />
      <p style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>
        {title}
      </p>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 3, lineHeight: 1.5 }}>
        {hint}
      </p>
    </div>
  );
}

const GAP = 6;

/* ─── Página ─── */
export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));

  if (!empresa) return null;

  const canvasBloques = empresa.canvasBloques ?? 0;
  const pct = Math.round((canvasBloques / 9) * 100);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-5">
        <Link
          href={`/emprendedor/empresas/${id}`}
          className="inline-flex items-center gap-2 text-sm mb-5 transition-colors"
          style={{ color: "#7E7C86" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
        >
          <ArrowLeft className="w-4 h-4" /> {empresa.nombre}
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F2F0F7" }}>Lean Canvas</h1>
            <p className="text-sm mt-0.5" style={{ color: "#7E7C86" }}>
              {canvasBloques} de 9 bloques completados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#9A62FA" }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "#7E7C86" }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="max-w-5xl mx-auto overflow-x-auto">
        <div style={{ minWidth: 820 }}>

          {/* Filas 1–2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gridTemplateRows: "minmax(210px, 1fr) minmax(155px, 1fr)", gap: GAP }}>

            {/* Col 1: Problema (span 2) */}
            <div style={{ gridRow: "1 / 3", display: "flex", flexDirection: "column", gap: GAP }}>
              <Block
                icon={AlertCircle}
                title="Problema"
                hint="Lista los 3 principales problemas de tus clientes"
                color={C.problema}
                style={{ flex: 1 }}
              >
                <SubBlock
                  icon={GitCompare}
                  title="Alternativas existentes"
                  hint="Cómo resuelven hoy este problema"
                />
              </Block>
            </div>

            {/* Col 2 fila 1: Solución */}
            <Block
              icon={Lightbulb}
              title="Solución"
              hint="Las 3 características más importantes de tu solución"
              color={C.solucion}
              style={{ gridRow: 1 }}
            />

            {/* Col 3: PVP (span 2) */}
            <div style={{ gridRow: "1 / 3", display: "flex", flexDirection: "column", gap: GAP }}>
              <Block
                icon={Sparkles}
                title="Propuesta de valor única"
                hint="Mensaje claro y convincente que distingue tu oferta de todas las demás"
                color={C.pvp}
                style={{ flex: 1 }}
              >
                <SubBlock
                  icon={Zap}
                  title="Concepto de alto nivel"
                  hint='Analogía "X para Y" que resume tu propuesta'
                />
              </Block>
            </div>

            {/* Col 4 fila 1: Ventaja injusta */}
            <Block
              icon={Lock}
              title="Ventaja injusta"
              hint="Algo que no puede ser copiado o comprado fácilmente"
              color={C.ventajaInjusta}
              style={{ gridRow: 1 }}
            />

            {/* Col 5: Segmentos (span 2) */}
            <div style={{ gridRow: "1 / 3", display: "flex", flexDirection: "column", gap: GAP }}>
              <Block
                icon={Users}
                title="Segmentos de clientes"
                hint="Clientes y usuarios objetivo"
                color={C.segmentosClientes}
                style={{ flex: 1 }}
              >
                <SubBlock
                  icon={UserCheck}
                  title="Primeros adoptadores"
                  hint="Características de tus clientes ideales iniciales"
                />
              </Block>
            </div>

            {/* Col 2 fila 2: Métricas clave */}
            <Block
              icon={BarChart2}
              title="Métricas clave"
              hint="Indicadores clave que reflejan el estado de tu negocio"
              color={C.metricasClave}
              style={{ gridRow: 2 }}
            />

            {/* Col 4 fila 2: Canales */}
            <Block
              icon={Share2}
              title="Canales"
              hint="Rutas para llegar a tus clientes"
              color={C.canales}
              style={{ gridRow: 2 }}
            />
          </div>

          {/* Fila 3: Costos + Ingresos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginTop: GAP }}>
            <Block
              icon={TrendingDown}
              title="Estructura de costos"
              hint="Lista tus costos fijos y variables principales"
              color={C.estructuraCostos}
              style={{ minHeight: 140 }}
            />
            <Block
              icon={TrendingUp}
              title="Fuentes de ingresos"
              hint="Cómo y cuánto cobra tu empresa"
              color={C.fuentesIngresos}
              style={{ minHeight: 140 }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

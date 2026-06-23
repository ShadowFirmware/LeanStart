"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Package, Tag, Calendar,
} from "lucide-react";
import { useEmpresasStore } from "@/store/empresas";
import type { TipoProducto } from "@/types";

const TIPO_CONFIG: Record<TipoProducto, { label: string; color: string; bg: string }> = {
  producto: { label: "Producto", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  servicio: { label: "Servicio", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
};

export default function ProductosPage() {
  const { id } = useParams<{ id: string }>();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));

  if (!empresa) return null;

  const productos = empresa.productosList ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link
        href={`/emprendedor/empresas/${id}`}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" /> {empresa.nombre}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#F2F0F7" }}>Productos</h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
            {productos.length === 0
              ? "Sin productos registrados"
              : `${productos.length} ${productos.length === 1 ? "producto registrado" : "productos registrados"}`}
          </p>
        </div>
        <Link
          href={`/emprendedor/empresas/${id}/productos/nuevo`}
          className="inline-flex items-center gap-1.5 text-sm px-4 h-9 rounded-lg font-medium"
          style={{
            background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
            color: "#FBFBFC",
          }}
        >
          <Plus className="w-4 h-4" /> Agregar producto
        </Link>
      </div>

      {/* Lista */}
      {productos.length === 0 ? (
        <div
          className="rounded-2xl p-16 flex flex-col items-center text-center"
          style={{ backgroundColor: "#131219", border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.14)" }}
          >
            <Package className="w-5 h-5" style={{ color: "#9A62FA" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#F2F0F7" }}>Sin productos aún</p>
          <p className="text-sm mb-6" style={{ color: "#7E7C86" }}>
            Agrega los productos o servicios que ofrece {empresa.nombre}.
          </p>
          <Link
            href={`/emprendedor/empresas/${id}/productos/nuevo`}
            className="inline-flex items-center gap-1.5 text-xs px-4 h-8 rounded-lg font-medium"
            style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
          >
            <Plus className="w-3.5 h-3.5" /> Agregar primer producto
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {productos.map((p) => {
            const tipo = TIPO_CONFIG[p.tipo] ?? TIPO_CONFIG["producto"];
            return (
              <div
                key={p.id}
                className="rounded-2xl px-5 py-4 flex items-start gap-4"
                style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Ícono */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: tipo.bg, border: `1px solid ${tipo.color}22` }}
                >
                  <Package className="w-4.5 h-4.5" style={{ color: tipo.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>{p.nombre}</p>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: tipo.color, backgroundColor: tipo.bg }}
                    >
                      {tipo.label}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "#7E7C86" }}>
                    {p.descripcion}
                  </p>
                  <div className="flex items-center gap-4 mt-2.5">
                    {p.precio != null && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" style={{ color: "#4A4850" }} />
                        <span className="text-xs" style={{ color: "#7E7C86" }}>
                          ${p.precio.toLocaleString("es-MX")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" style={{ color: "#4A4850" }} />
                      <span className="text-xs" style={{ color: "#4A4850" }}>{p.creadoEn}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Package, Tag, Pencil, Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmpresasStore } from "@/store/empresas";
import type { TipoProducto } from "@/types";

const TIPO_CONFIG: Record<TipoProducto, { label: string; color: string; bg: string }> = {
  producto: { label: "Producto", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  servicio: { label: "Servicio", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
};

export default function ProductosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const eliminarProducto = useEmpresasStore((s) => s.eliminarProducto);

  if (!empresa) return null;

  const productos = empresa.productosList ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => {
            const tipo = TIPO_CONFIG[p.tipo] ?? TIPO_CONFIG["producto"];
            const caracteristicas = p.caracteristicas
              ? p.caracteristicas.split("\n").map((c) => c.trim()).filter(Boolean)
              : [];
            return (
              <div
                key={p.id}
                className="rounded-2xl p-5 flex flex-col"
                style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Header: ícono + tipo */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tipo.bg, border: `1px solid ${tipo.color}22` }}
                  >
                    <Package className="w-4 h-4" style={{ color: tipo.color }} />
                  </div>
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={{ color: tipo.color, backgroundColor: tipo.bg }}
                  >
                    {tipo.label}
                  </span>
                </div>

                {/* Nombre */}
                <p className="text-sm font-semibold leading-snug" style={{ color: "#F2F0F7" }}>
                  {p.nombre}
                </p>

                {/* Descripción */}
                <p className="text-xs mt-2 leading-relaxed line-clamp-2 flex-1" style={{ color: "#7E7C86" }}>
                  {p.descripcion}
                </p>

                {/* Características */}
                {caracteristicas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {caracteristicas.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#7E7C86" }}
                      >
                        {c}
                      </span>
                    ))}
                    {caracteristicas.length > 3 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#4A4850" }}>
                        +{caracteristicas.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer: precio + acciones */}
                <div
                  className="flex items-center justify-between mt-4 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {p.precio != null ? (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" style={{ color: "#4A4850" }} />
                      <span className="text-xs font-medium" style={{ color: "#F2F0F7" }}>
                        ${p.precio.toLocaleString("es-MX")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px]" style={{ color: "#4A4850" }}>Sin precio</span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => router.push(`/emprendedor/empresas/${id}/productos/${p.id}/editar`)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                      style={{ color: "#4A4850" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#9A62FA"; e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#4A4850"; e.currentTarget.style.backgroundColor = "transparent"; }}
                      title="Editar producto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) {
                          eliminarProducto(id, p.id);
                        }
                      }}
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                      style={{ color: "#4A4850" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#4A4850"; e.currentTarget.style.backgroundColor = "transparent"; }}
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

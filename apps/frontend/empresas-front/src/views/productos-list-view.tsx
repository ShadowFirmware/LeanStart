"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Package, Tag, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import type { TipoProducto } from "@leanstart/commons";

const TIPO_CONFIG: Record<TipoProducto, { label: string; color: string; bg: string }> = {
  producto: { label: "Producto", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  servicio: { label: "Servicio", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
};

interface ProductosListViewProps {
  basePath?: string;
  readOnly?: boolean;
}

export function ProductosListView({
  basePath = "/emprendedor/empresas",
  readOnly = false,
}: ProductosListViewProps = {}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const eliminarProducto = useEmpresasStore((s) => s.eliminarProducto);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);

  if (!empresa) return null;

  const productos = empresa.productosList ?? [];

  function confirmDelete() {
    if (!deleteTarget) return;
    eliminarProducto(id, deleteTarget.id);
    toast.success(`"${deleteTarget.nombre}" fue eliminado.`);
    setDeleteTarget(null);
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link
        href={`${basePath}/${id}`}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="truncate max-w-[160px] md:max-w-none">{empresa.nombre}</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold" style={{ color: "#F2F0F7" }}>Productos</h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
            {productos.length === 0
              ? "Sin productos registrados"
              : `${productos.length} ${productos.length === 1 ? "producto registrado" : "productos registrados"}`}
          </p>
        </div>
        {!readOnly && (
          <Link
            href={`${basePath}/${id}/productos/nuevo`}
            className="inline-flex items-center justify-center gap-1.5 text-sm px-4 h-9 rounded-lg font-medium shrink-0 w-full sm:w-auto"
            style={{
              background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)",
              color: "#FBFBFC",
            }}
          >
            <Plus className="w-4 h-4" /> Agregar producto
          </Link>
        )}
      </div>

      {/* Lista */}
      {productos.length === 0 ? (
        <div
          className="rounded-2xl p-8 md:p-16 flex flex-col items-center text-center"
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
            {readOnly ? `${empresa.nombre} no tiene productos registrados.` : `Agrega los productos o servicios que ofrece ${empresa.nombre}.`}
          </p>
          {!readOnly && (
            <Link
              href={`${basePath}/${id}/productos/nuevo`}
              className="inline-flex items-center gap-1.5 text-xs px-4 h-8 rounded-lg font-medium"
              style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
            >
              <Plus className="w-3.5 h-3.5" /> Agregar primer producto
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => {
            const tipo = TIPO_CONFIG[p.tipo] ?? TIPO_CONFIG["producto"];
            const caracteristicas = p.caracteristicas
              ? p.caracteristicas.split("\n").map((c) => c.trim()).filter(Boolean)
              : [];
            const editHref = `${basePath}/${id}/productos/${p.id}/editar`;
            return (
              <div
                key={p.id}
                onClick={() => router.push(editHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(editHref);
                  }
                }}
                role="button"
                tabIndex={0}
                className="rounded-2xl p-5 flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A62FA]"
                style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
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
                <p className="text-sm font-semibold leading-snug line-clamp-2 break-words" style={{ color: "#F2F0F7" }}>
                  {p.nombre}
                </p>

                {/* Descripción */}
                <p className="text-xs mt-2 leading-relaxed line-clamp-2 flex-1 break-words" style={{ color: "#7E7C86" }}>
                  {p.descripcion}
                </p>

                {/* Características */}
                {caracteristicas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {caracteristicas.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full truncate max-w-[140px]"
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
                  className="flex items-center justify-between gap-2 mt-4 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {p.precio != null ? (
                    <div className="flex items-center gap-1 min-w-0">
                      <Tag className="w-3 h-3 shrink-0" style={{ color: "#4A4850" }} />
                      <span className="text-xs font-medium truncate" style={{ color: "#F2F0F7" }}>
                        ${p.precio.toLocaleString("es-MX")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px]" style={{ color: "#4A4850" }}>Sin precio</span>
                  )}
                  {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(editHref);
                        }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ color: "#7E7C86" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#9A62FA"; e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#7E7C86"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        title="Editar producto"
                        aria-label="Editar producto"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: p.id, nombre: p.nombre });
                        }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ color: "#7E7C86" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#7E7C86"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        title="Eliminar producto"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmación de eliminado */}
      {!readOnly && (
        <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget
                  ? `¿Seguro que quieres eliminar "${deleteTarget.nombre}"? Esta acción no se puede deshacer.`
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white border-0"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

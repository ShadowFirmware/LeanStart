"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Package, Wrench, Tag, Pencil, Trash2, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@leanstart/commons";
import { useEmpresasStore } from "../store/empresas";
import { puedeVerObservaciones, useObservacionesStore, mentorPuedeComentarEnEstado, emprendedorPuedeEditar } from "../store/observaciones";
import { ObservacionesButton } from "../components/observaciones-button";
import { resumenPrecio } from "../lib/producto-precio";
import type { TipoProducto } from "@leanstart/commons";

const TIPO_CONFIG: Record<TipoProducto, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  producto: { label: "Producto", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: Package },
  servicio: { label: "Servicio", color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: Wrench },
};

const TODOS = "todos";
const FILTROS_TIPO = [
  { value: TODOS, label: "Todos" },
  { value: "producto", label: "Productos" },
  { value: "servicio", label: "Servicios" },
];

type Orden = "az" | "za" | "recientes";
const ORDENES: { value: Orden; label: string }[] = [
  { value: "az", label: "Nombre (A–Z)" },
  { value: "za", label: "Nombre (Z–A)" },
  { value: "recientes", label: "Más recientes" },
];

interface ProductosListViewProps {
  basePath?: string;
  readOnly?: boolean;
  /** Cuando es true, permite dejar observaciones por producto (uso exclusivo del mentor). */
  permitirComentarios?: boolean;
  autorNombre?: string;
}

export function ProductosListView({
  basePath = "/emprendedor/empresas",
  readOnly = false,
  permitirComentarios = false,
  autorNombre,
}: ProductosListViewProps = {}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const eliminarProducto = useEmpresasStore((s) => s.eliminarProducto);
  const observaciones = useObservacionesStore((s) => s.observaciones);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>(TODOS);
  const [orden, setOrden] = useState<Orden>("az");

  const productos = useMemo(() => empresa?.productosList ?? [], [empresa]);

  // El emprendedor solo puede editar mientras el proyecto está en captura o le toca atender observaciones.
  const puedeEditar = !readOnly && !!empresa && emprendedorPuedeEditar(empresa.estado);
  const mentorPuedeComentar = permitirComentarios && !!empresa && mentorPuedeComentarEnEstado(empresa.estado);
  const ocultarCorreccionesPendientes = false;
  const puedeVerObs = empresa ? puedeVerObservaciones(empresa.estado, readOnly, permitirComentarios) : false;
  // Solo el emprendedor destaca y prioriza los productos con comentarios del mentor.
  const destacarComentarios = !readOnly && puedeVerObs;

  // Observaciones "pendientes" por producto = comentarios del mentor que el emprendedor aún no atiende.
  const pendientesPorProducto = useMemo(() => {
    const map = new Map<string, number>();
    if (!destacarComentarios || !empresa) return map;
    for (const o of observaciones) {
      if (o.empresaId === empresa.id && o.tipoElemento === "producto" && o.estado === "pendiente") {
        map.set(o.elementoId, (map.get(o.elementoId) ?? 0) + 1);
      }
    }
    return map;
  }, [observaciones, destacarComentarios, empresa]);

  const productosVisibles = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    let arr = productos.filter((p) => {
      const coincideBusqueda = !q || p.nombre.toLowerCase().includes(q);
      const coincideTipo = filtroTipo === TODOS || p.tipo === filtroTipo;
      return coincideBusqueda && coincideTipo;
    });

    // Orden base elegido por el usuario.
    if (orden === "recientes") {
      arr = [...arr].reverse(); // productosList se agrega al final: el último es el más nuevo.
    } else {
      arr = [...arr].sort((a, b) =>
        orden === "az"
          ? a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
          : b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" })
      );
    }

    // Los productos con comentarios del mentor suben al inicio (orden estable conserva el criterio anterior).
    if (destacarComentarios) {
      arr = [...arr].sort((a, b) => (pendientesPorProducto.get(b.id) ?? 0) - (pendientesPorProducto.get(a.id) ?? 0));
    }
    return arr;
  }, [productos, busqueda, filtroTipo, orden, destacarComentarios, pendientesPorProducto]);

  if (!empresa) return null;

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await eliminarProducto(id, deleteTarget.id);
      toast.success(`"${deleteTarget.nombre}" fue eliminado.`);
    } catch {
      toast.error("No se pudo eliminar el producto.");
    }
    setDeleteTarget(null);
  }

  const hayFiltrosActivos = Boolean(busqueda) || filtroTipo !== TODOS;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link
        href={`${basePath}/${id}`}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="truncate max-w-[160px] md:max-w-none">{empresa.nombre}</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-strong)" }}>Productos y servicios</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {productos.length === 0
              ? "Sin registros"
              : `${productos.length} ${productos.length === 1 ? "registro" : "registros"}`}
          </p>
        </div>
        {puedeEditar && (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link
              href={`${basePath}/${id}/productos/nuevo`}
              className="inline-flex items-center justify-center gap-1.5 text-sm px-4 h-9 rounded-lg font-medium w-full sm:w-auto transition-colors"
              style={{ color: "var(--text-strong)", backgroundColor: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.22)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.14)")}
            >
              <Package className="w-4 h-4" /> Agregar producto
            </Link>
            <Link
              href={`${basePath}/${id}/productos/nuevo-servicio`}
              className="inline-flex items-center justify-center gap-1.5 text-sm px-4 h-9 rounded-lg font-medium w-full sm:w-auto transition-colors"
              style={{ color: "var(--text-strong)", backgroundColor: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.22)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.14)")}
            >
              <Wrench className="w-4 h-4" /> Agregar servicio
            </Link>
          </div>
        )}
      </div>

      {/* Filtros (solo si hay algo que filtrar) */}
      {productos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
            />
          </div>

          {/* Filtro por tipo */}
          <div
            className="flex items-center gap-1 rounded-lg p-1 shrink-0 overflow-x-auto no-scrollbar"
            style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
          >
            {FILTROS_TIPO.map(({ value, label }) => {
              const isActive = filtroTipo === value;
              return (
                <button
                  key={value}
                  onClick={() => setFiltroTipo(value)}
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

          {/* Orden */}
          <Select value={orden} onValueChange={(v) => setOrden((v as Orden) ?? "az")}>
            <SelectTrigger
              className="w-full sm:w-44 h-9 text-sm shrink-0"
              style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            >
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {ORDENES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lista */}
      {productos.length === 0 ? (
        <div
          className="rounded-2xl p-8 md:p-16 flex flex-col items-center text-center"
          style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px dashed var(--border-hair)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.14)" }}
          >
            <Package className="w-5 h-5" style={{ color: "var(--brand)" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>Sin productos ni servicios aún</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>
            {puedeEditar ? `Agrega los productos o servicios que ofrece ${empresa.nombre}.` : `${empresa.nombre} no tiene registros.`}
          </p>
          {puedeEditar && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href={`${basePath}/${id}/productos/nuevo`}
                className="inline-flex items-center justify-center gap-1.5 text-xs px-4 h-8 rounded-lg font-medium"
                style={{ color: "var(--text-strong)", backgroundColor: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.3)" }}
              >
                <Package className="w-3.5 h-3.5" /> Agregar producto
              </Link>
              <Link
                href={`${basePath}/${id}/productos/nuevo-servicio`}
                className="inline-flex items-center justify-center gap-1.5 text-xs px-4 h-8 rounded-lg font-medium"
                style={{ color: "var(--text-strong)", backgroundColor: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <Wrench className="w-3.5 h-3.5" /> Agregar servicio
              </Link>
            </div>
          )}
        </div>
      ) : productosVisibles.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
        >
          <Search className="w-8 h-8 mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>Ningún registro coincide con los filtros.</p>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={() => { setBusqueda(""); setFiltroTipo(TODOS); }}
              className="mt-3 text-xs font-medium"
              style={{ color: "var(--brand)" }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productosVisibles.map((p) => {
            const tipo = TIPO_CONFIG[p.tipo] ?? TIPO_CONFIG.producto;
            const caracteristicas = p.caracteristicas
              ? p.caracteristicas.split("\n").map((c) => c.trim()).filter(Boolean)
              : [];
            const editHref = `${basePath}/${id}/productos/${p.id}/editar`;
            const portada = p.tipo === "producto" ? p.imagenes?.[0] : undefined;
            const pendientes = pendientesPorProducto.get(p.id) ?? 0;
            const tieneComentario = pendientes > 0;
            return (
              <div
                key={p.id}
                onClick={() => router.push(editHref)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                    e.preventDefault();
                    router.push(editHref);
                  }
                }}
                role="button"
                tabIndex={0}
                className="relative rounded-2xl p-5 flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A62FA]"
                style={{
                  backgroundColor: "var(--surface-profile)",
                  border: `1px solid ${tieneComentario ? "rgba(154,98,250,0.5)" : "var(--border-subtle)"}`,
                  boxShadow: tieneComentario ? "0 0 0 1px rgba(154,98,250,0.25), 0 8px 28px rgba(154,98,250,0.12)" : "none",
                }}
                onMouseEnter={(e) => { if (!tieneComentario) e.currentTarget.style.borderColor = "rgba(154,98,250,0.25)"; }}
                onMouseLeave={(e) => { if (!tieneComentario) e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
              >
                {/* Distintivo de comentario del mentor (estilo notificación) */}
                {tieneComentario && (
                  <span className="absolute -top-2 -right-2 z-10 flex items-center justify-center pointer-events-none">
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ backgroundColor: "var(--brand)" }} />
                    <span
                      className="relative inline-flex items-center justify-center gap-1 min-w-[24px] h-6 px-2 rounded-full text-[11px] font-bold leading-none"
                      style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)", border: "2px solid var(--surface-profile)", boxShadow: "0 4px 12px rgba(154,98,250,0.5)" }}
                    >
                      <MessageSquare className="w-3 h-3" />
                      {pendientes}
                    </span>
                  </span>
                )}

                {/* Header: portada/ícono + tipo */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  {portada ? (
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                      style={{ border: `1px solid ${tipo.color}22` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={portada} alt={p.nombre} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: tipo.bg, border: `1px solid ${tipo.color}22` }}
                    >
                      <tipo.icon className="w-4 h-4" style={{ color: tipo.color }} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ color: tipo.color, backgroundColor: tipo.bg }}
                    >
                      {tipo.label}
                    </span>
                    <ObservacionesButton
                      empresaId={id}
                      tipoElemento="producto"
                      elementoId={p.id}
                      puedeComentar={mentorPuedeComentar}
                      puedeMarcarEnRevision={!readOnly}
                      puedeVer={puedeVerObs}
                      ocultarCorreccionesPendientes={ocultarCorreccionesPendientes}
                      autorNombre={autorNombre}
                    />
                  </div>
                </div>

                {/* Nombre */}
                <p className="text-sm font-semibold leading-snug line-clamp-2 break-words" style={{ color: "var(--text-strong)" }}>
                  {p.nombre}
                </p>

                {/* Aviso de comentario del mentor */}
                {tieneComentario && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium mt-2 px-2 py-1 rounded-full w-fit"
                    style={{ color: "var(--brand-accent)", backgroundColor: "rgba(154,98,250,0.14)" }}
                  >
                    <MessageSquare className="w-3 h-3" />
                    {pendientes === 1 ? "Comentario del mentor" : `${pendientes} comentarios del mentor`}
                  </span>
                )}

                {/* Descripción */}
                <p className="text-xs mt-2 leading-relaxed line-clamp-2 flex-1 break-words" style={{ color: "var(--text-dim)" }}>
                  {p.descripcion}
                </p>

                {/* Características */}
                {caracteristicas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {caracteristicas.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full truncate max-w-[140px]"
                        style={{ backgroundColor: "var(--border-subtle)", color: "var(--text-dim)" }}
                      >
                        {c}
                      </span>
                    ))}
                    {caracteristicas.length > 3 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--border-subtle)", color: "var(--text-faint)" }}>
                        +{caracteristicas.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer: precio + acciones */}
                <div
                  className="flex items-center justify-between gap-2 mt-4 pt-3"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <Tag className="w-3 h-3 shrink-0" style={{ color: "var(--text-faint)" }} />
                    <span className="text-xs font-medium truncate" style={{ color: "var(--text-strong)" }}>
                      {resumenPrecio(p)}
                    </span>
                  </div>
                  {puedeEditar && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); router.push(editHref); }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ color: "var(--text-dim)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: p.id, nombre: p.nombre }); }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ color: "var(--text-dim)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        title="Eliminar"
                        aria-label="Eliminar"
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
      {puedeEditar && (
        <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
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

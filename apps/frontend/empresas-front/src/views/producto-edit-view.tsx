"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Pencil, Tag, Package, Wrench, AlignLeft, ListChecks, DollarSign, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@leanstart/commons";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@leanstart/commons";
import { Input } from "@leanstart/commons";
import { Textarea } from "@leanstart/commons";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import type { TipoProducto } from "@leanstart/commons";
import { useEmpresasStore, type Producto } from "../store/empresas";
import { puedeVerObservaciones, mentorPuedeComentarEnEstado, emprendedorPuedeEditar } from "../store/observaciones";
import { ObservacionesButton } from "../components/observaciones-button";
import { ProductoImagenesField } from "../components/producto-imagenes-field";
import {
  ServicioPrecioField, validarServicioPrecio, servicioPrecioToStore, storeToServicioPrecio,
  type ServicioPrecioValue,
} from "../components/servicio-precio-field";
import { resumenPrecio, MODALIDAD_PRECIO_LABEL } from "../lib/producto-precio";

const TIPO_CONFIG: Record<TipoProducto, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  producto: { label: "Producto", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: Package },
  servicio: { label: "Servicio", color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: Wrench },
};

const MAX_NOMBRE = 80;
const MAX_DESCRIPCION = 500;
const MAX_CARACTERISTICAS = 500;
const MAX_PRECIO = 9_999_999.99;

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(MAX_NOMBRE, `Máximo ${MAX_NOMBRE} caracteres`),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(MAX_DESCRIPCION, `Máximo ${MAX_DESCRIPCION} caracteres`),
  caracteristicas: z.string().max(MAX_CARACTERISTICAS, `Máximo ${MAX_CARACTERISTICAS} caracteres`).optional(),
  precio: z.string().optional().refine(
    (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= MAX_PRECIO),
    `El precio debe estar entre 0 y ${MAX_PRECIO.toLocaleString("es-MX")}`
  ),
});

type FormValues = z.infer<typeof schema>;

const inputStyle = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#F2F0F7",
};

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="flex items-center gap-2.5 px-4 md:px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)" }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: "#9A62FA" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>{title}</span>
      </div>
      <div className="px-4 md:px-6 py-5">{children}</div>
    </div>
  );
}

function toFormValues(p: Producto): FormValues {
  return {
    nombre: p.nombre,
    descripcion: p.descripcion,
    caracteristicas: p.caracteristicas ?? "",
    precio: p.precio != null ? String(p.precio) : "",
  };
}

interface ProductoEditViewProps {
  basePath?: string;
  readOnly?: boolean;
  /** Cuando es true, permite dejar observaciones en este producto (uso exclusivo del mentor). */
  permitirComentarios?: boolean;
  autorNombre?: string;
}

export function ProductoEditView({
  basePath = "/emprendedor/empresas",
  readOnly = false,
  permitirComentarios = false,
  autorNombre,
}: ProductoEditViewProps = {}) {
  const { id, pid } = useParams<{ id: string; pid: string }>();
  const actualizarProducto = useEmpresasStore((s) => s.actualizarProducto);
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const producto = empresa?.productosList?.find((p) => p.id === pid);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [imagenes, setImagenes] = useState<string[]>(producto?.imagenes ?? []);
  const [precioServicio, setPrecioServicio] = useState<ServicioPrecioValue>(() =>
    storeToServicioPrecio(producto ?? {})
  );
  const [precioError, setPrecioError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const esServicio = producto?.tipo === "servicio";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: producto
      ? toFormValues(producto)
      : { nombre: "", descripcion: "", caracteristicas: "", precio: "" },
  });

  if (!empresa || !producto) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Link href={`${basePath}/${id}/productos`} className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "#7E7C86" }}>
          <ArrowLeft className="w-4 h-4" /> Productos
        </Link>
        <p className="text-sm" style={{ color: "#7E7C86" }}>Este producto no existe o fue eliminado.</p>
      </div>
    );
  }

  // El emprendedor solo puede editar mientras el proyecto está en captura o le toca atender observaciones.
  const puedeEditar = !readOnly && emprendedorPuedeEditar(empresa.estado);
  const mentorPuedeComentar = permitirComentarios && mentorPuedeComentarEnEstado(empresa.estado);
  const ocultarCorreccionesPendientes = false;
  const puedeVerObs = puedeVerObservaciones(empresa.estado, readOnly, permitirComentarios);

  const tipoCfg = TIPO_CONFIG[producto.tipo] ?? TIPO_CONFIG.producto;

  function entrarEdicion() {
    if (!producto) return;
    form.reset(toFormValues(producto));
    setImagenes(producto.imagenes ?? []);
    setPrecioServicio(storeToServicioPrecio(producto));
    setPrecioError(null);
    setEditando(true);
  }

  function cancelarEdicion() {
    if (producto) form.reset(toFormValues(producto));
    setEditando(false);
  }

  function onSubmit(values: FormValues) {
    if (esServicio) {
      const err = validarServicioPrecio(precioServicio);
      setPrecioError(err);
      if (err) {
        toast.error(err);
        return;
      }
    }
    setLoading(true);
    const base = {
      nombre: values.nombre,
      descripcion: values.descripcion,
      caracteristicas: values.caracteristicas || undefined,
    };
    if (esServicio) {
      actualizarProducto(id, pid, { ...base, ...servicioPrecioToStore(precioServicio) });
    } else {
      const precio = values.precio ? parseFloat(values.precio) : undefined;
      actualizarProducto(id, pid, {
        ...base,
        precio: precio != null && !isNaN(precio) ? precio : undefined,
        imagenes: imagenes.length > 0 ? imagenes : undefined,
      });
    }
    setLoading(false);
    toast.success(`"${values.nombre}" se actualizó correctamente.`);
    setEditando(false);
  }

  // ─────────────────────────── MODO LECTURA ───────────────────────────
  if (!editando || !puedeEditar) {
    const caracteristicas = producto.caracteristicas
      ? producto.caracteristicas.split("\n").map((c) => c.trim()).filter(Boolean)
      : [];
    const imgs = producto.imagenes ?? [];

    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
        <Link
          href={`${basePath}/${id}/productos`}
          className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
          style={{ color: "#7E7C86" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
        >
          <ArrowLeft className="w-4 h-4" /> Productos
        </Link>

        {/* Header */}
        <div
          className="rounded-2xl p-5 md:p-6"
          style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: tipoCfg.bg, border: `1px solid ${tipoCfg.color}33` }}
            >
              <tipoCfg.icon className="w-6 h-6" style={{ color: tipoCfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold break-words" style={{ color: "#F2F0F7" }}>{producto.nombre}</h1>
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full mt-2"
                    style={{ color: tipoCfg.color, backgroundColor: tipoCfg.bg }}
                  >
                    {tipoCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ObservacionesButton
                    empresaId={id}
                    tipoElemento="producto"
                    elementoId={pid}
                    puedeComentar={mentorPuedeComentar}
                    puedeMarcarEnRevision={!readOnly}
                    puedeVer={puedeVerObs}
                    ocultarCorreccionesPendientes={ocultarCorreccionesPendientes}
                    autorNombre={autorNombre}
                  />
                  {puedeEditar && (
                    <button
                      type="button"
                      onClick={entrarEdicion}
                      className="inline-flex items-center justify-center gap-2 text-sm px-4 h-9 rounded-lg transition-colors"
                      style={{ color: "#9A62FA", border: "1px solid rgba(154,98,250,0.3)", backgroundColor: "rgba(154,98,250,0.08)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.14)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(154,98,250,0.08)")}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
          {/* Columna principal */}
          <div className="sm:col-span-2 flex flex-col gap-5">
            {/* Galería (solo productos) */}
            {!esServicio && (
              <SectionCard title="Imágenes" icon={ImageIcon}>
                {imgs.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {imgs.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxSrc(src)}
                        className="relative aspect-square rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                        title="Ver imagen completa"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`${producto.nombre} ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "#4A4850" }}>Sin imágenes registradas.</p>
                )}
              </SectionCard>
            )}

            <SectionCard title="Descripción" icon={AlignLeft}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: "#C4C2CC", overflowWrap: "anywhere" }}>
                {producto.descripcion}
              </p>
            </SectionCard>

            <SectionCard title="Características" icon={ListChecks}>
              {caracteristicas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {caracteristicas.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-full break-words"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#C4C2CC", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#4A4850" }}>Sin características registradas.</p>
              )}
            </SectionCard>
          </div>

          {/* Columna lateral */}
          <div className="flex flex-col gap-5">
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: "rgba(154,98,250,0.06)", border: "1px solid rgba(154,98,250,0.2)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-3.5 h-3.5" style={{ color: "#9A62FA" }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#9A62FA" }}>Precio</span>
              </div>
              <p className="text-2xl font-bold break-words" style={{ color: "#F2F0F7" }}>{resumenPrecio(producto)}</p>
              {esServicio && producto.modalidadPrecio && (
                <p className="text-[11px] mt-1.5" style={{ color: "#7E7C86" }}>
                  {MODALIDAD_PRECIO_LABEL[producto.modalidadPrecio]}
                </p>
              )}
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-3.5 h-3.5" style={{ color: "#4A4850" }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Tipo</span>
              </div>
              <p className="text-sm font-medium" style={{ color: "#F2F0F7" }}>{tipoCfg.label}</p>
            </div>
          </div>
        </div>

        {/* Lightbox de imágenes */}
        <Dialog open={lightboxSrc !== null} onOpenChange={(open) => { if (!open) setLightboxSrc(null); }}>
          <DialogContent className="bg-transparent border-0 shadow-none p-0 max-w-[95vw] sm:max-w-[720px] ring-0">
            <DialogTitle className="sr-only">Imagen de {producto.nombre}</DialogTitle>
            <DialogDescription className="sr-only">Vista ampliada de la imagen del producto.</DialogDescription>
            {lightboxSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxSrc}
                alt={producto.nombre}
                className="block mx-auto w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─────────────────────────── MODO EDICIÓN ───────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <button
        type="button"
        onClick={cancelarEdicion}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" /> Productos
      </button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Header */}
          <div
            className="rounded-2xl p-5 md:p-6"
            style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: tipoCfg.bg, border: `1px solid ${tipoCfg.color}33` }}
              >
                <tipoCfg.icon className="w-6 h-6" style={{ color: tipoCfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                    <FormItem className="gap-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>
                          Nombre del {tipoCfg.label.toLowerCase()}
                        </FormLabel>
                        <span className="text-xs" style={{ color: "#4A4850" }}>
                          {field.value?.length ?? 0} / {MAX_NOMBRE}
                        </span>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="Ej. Botella inteligente 500ml"
                          className="h-9 text-sm focus-visible:ring-0"
                          style={inputStyle}
                          maxLength={MAX_NOMBRE}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
            {/* Columna principal */}
            <div className="sm:col-span-2 flex flex-col gap-5">
              {/* Imágenes (solo productos) */}
              {!esServicio && (
                <SectionCard title="Imágenes" icon={ImageIcon}>
                  <ProductoImagenesField value={imagenes} onChange={setImagenes} />
                </SectionCard>
              )}

              <SectionCard title="Descripción" icon={AlignLeft}>
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "descripcion"> }) => (
                    <FormItem className="gap-1.5">
                      <div className="flex items-center justify-end">
                        <span className="text-xs" style={{ color: (field.value?.length ?? 0) < 10 ? "#4A4850" : "#7E7C86" }}>
                          {field.value?.length ?? 0} / {MAX_DESCRIPCION} (mín. 10)
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Describe qué es, cómo funciona y qué problema resuelve."
                          className="min-h-28 resize-none text-sm focus-visible:ring-0"
                          style={inputStyle}
                          maxLength={MAX_DESCRIPCION}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </SectionCard>

              {/* Modalidad de precio (solo servicios) */}
              {esServicio && (
                <SectionCard title="Modalidad de precio" icon={DollarSign}>
                  <ServicioPrecioField
                    value={precioServicio}
                    onChange={(v) => { setPrecioServicio(v); if (precioError) setPrecioError(validarServicioPrecio(v)); }}
                    error={precioError ?? undefined}
                  />
                </SectionCard>
              )}

              <SectionCard title="Características" icon={ListChecks}>
                <FormField
                  control={form.control}
                  name="caracteristicas"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "caracteristicas"> }) => (
                    <FormItem className="gap-1.5">
                      <div className="flex items-center justify-end">
                        <span className="text-xs" style={{ color: "#4A4850" }}>
                          Opcional · {field.value?.length ?? 0} / {MAX_CARACTERISTICAS}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder={"Ej.\nMaterial resistente al agua\nCarga rápida"}
                          className="min-h-28 resize-none text-sm focus-visible:ring-0"
                          style={inputStyle}
                          maxLength={MAX_CARACTERISTICAS}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </SectionCard>
            </div>

            {/* Columna lateral */}
            <div className="flex flex-col gap-5">
              {/* Precio simple (solo productos) */}
              {!esServicio && (
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: "rgba(154,98,250,0.06)", border: "1px solid rgba(154,98,250,0.2)" }}
                >
                  <FormField
                    control={form.control}
                    name="precio"
                    render={({ field }: { field: ControllerRenderProps<FormValues, "precio"> }) => (
                      <FormItem className="gap-1.5">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-3.5 h-3.5" style={{ color: "#9A62FA" }} />
                          <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "#9A62FA" }}>
                            Precio
                          </FormLabel>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#4A4850" }}>$</span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max={MAX_PRECIO}
                              step="0.01"
                              placeholder="0.00"
                              className="h-9 pl-6 text-sm focus-visible:ring-0"
                              style={inputStyle}
                              {...field}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= MAX_PRECIO && v.length <= 12)) {
                                  field.onChange(v);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <span className="text-xs" style={{ color: "#7E7C86" }}>Opcional</span>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: "#4A4850" }} />
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#7E7C86" }}>Tipo</span>
                </div>
                <p className="text-sm font-medium" style={{ color: "#F2F0F7" }}>{tipoCfg.label}</p>
                <p className="text-[11px] mt-1" style={{ color: "#4A4850" }}>El tipo no se puede cambiar.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              type="button"
              onClick={cancelarEdicion}
              className="h-9 px-5 text-sm justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-6 text-sm font-semibold border-0 justify-center"
              style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

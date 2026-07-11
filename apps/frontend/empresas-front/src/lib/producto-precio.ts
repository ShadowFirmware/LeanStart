import type { UnidadTiempoServicio, ModalidadPrecioServicio } from "@leanstart/commons";
import type { Producto } from "../store/empresas";

export const UNIDAD_TIEMPO_LABEL: Record<UnidadTiempoServicio, string> = {
  dia: "día",
  semana: "semana",
  mes: "mes",
  anio: "año",
};

export const UNIDAD_TIEMPO_OPCIONES: { value: UnidadTiempoServicio; label: string }[] = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "anio", label: "Año" },
];

export const MODALIDAD_PRECIO_LABEL: Record<ModalidadPrecioServicio, string> = {
  rango: "Rango de precio",
  periodo: "Por periodo de tiempo",
  personalizado: "Personalizado",
};

function money(n: number): string {
  return `$${n.toLocaleString("es-MX")}`;
}

/** Texto corto del precio de un producto o servicio, listo para tarjetas y detalle. */
export function resumenPrecio(p: Producto): string {
  if (p.tipo === "servicio") {
    switch (p.modalidadPrecio) {
      case "rango":
        if (p.precioMin != null && p.precioMax != null) return `${money(p.precioMin)} – ${money(p.precioMax)}`;
        if (p.precioMin != null) return `Desde ${money(p.precioMin)}`;
        if (p.precioMax != null) return `Hasta ${money(p.precioMax)}`;
        return "Sin precio";
      case "periodo":
        if (p.precioPeriodo != null && p.unidadTiempo) return `${money(p.precioPeriodo)} / ${UNIDAD_TIEMPO_LABEL[p.unidadTiempo]}`;
        return "Sin precio";
      case "personalizado":
        return p.precioPersonalizado?.trim() ? p.precioPersonalizado.trim() : "Cotización personalizada";
      default:
        return "Sin precio";
    }
  }
  return p.precio != null ? money(p.precio) : "Sin precio";
}

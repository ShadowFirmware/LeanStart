"use client";

import { SlidersHorizontal, CalendarClock, Sparkles } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea,
} from "@leanstart/commons";
import type { ModalidadPrecioServicio, UnidadTiempoServicio } from "@leanstart/commons";
import { UNIDAD_TIEMPO_OPCIONES } from "../lib/producto-precio";

const MAX_PRECIO = 9_999_999.99;
const MAX_PERSONALIZADO = 300;

export interface ServicioPrecioValue {
  modalidad: ModalidadPrecioServicio | "";
  precioMin: string;
  precioMax: string;
  precioPeriodo: string;
  unidadTiempo: UnidadTiempoServicio | "";
  precioPersonalizado: string;
}

export const SERVICIO_PRECIO_VACIO: ServicioPrecioValue = {
  modalidad: "",
  precioMin: "",
  precioMax: "",
  precioPeriodo: "",
  unidadTiempo: "",
  precioPersonalizado: "",
};

const MODALIDADES: { value: ModalidadPrecioServicio; label: string; hint: string; icon: React.ElementType }[] = [
  { value: "rango", label: "Rango de precio", hint: "De un mínimo a un máximo", icon: SlidersHorizontal },
  { value: "periodo", label: "Por periodo de tiempo", hint: "Cobro por día, semana, mes o año", icon: CalendarClock },
  { value: "personalizado", label: "Personalizado", hint: "Esquema de cobro a la medida", icon: Sparkles },
];

const inputStyle = {
  backgroundColor: "var(--hover-surface)",
  border: "1px solid var(--border-hair)",
  color: "var(--text-strong)",
};

function sanitizePrecio(v: string): string | null {
  if (v === "") return "";
  const n = parseFloat(v);
  if (isNaN(n) || n < 0 || n > MAX_PRECIO || v.length > 12) return null;
  return v;
}

function MoneyInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-faint)" }}>$</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        max={MAX_PRECIO}
        step="0.01"
        placeholder={placeholder ?? "0.00"}
        value={value}
        onChange={(e) => {
          const s = sanitizePrecio(e.target.value);
          if (s !== null) onChange(s);
        }}
        className="w-full h-9 pl-6 pr-3 rounded-md text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={inputStyle}
      />
    </div>
  );
}

interface ServicioPrecioFieldProps {
  value: ServicioPrecioValue;
  onChange: (value: ServicioPrecioValue) => void;
  error?: string;
}

/** Selector de modalidad de precio para servicios + sus campos según la opción elegida. */
export function ServicioPrecioField({ value, onChange, error }: ServicioPrecioFieldProps) {
  const set = (patch: Partial<ServicioPrecioValue>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de modalidad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {MODALIDADES.map(({ value: v, label, hint, icon: Icon }) => {
          const activo = value.modalidad === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => set({ modalidad: v })}
              className="flex flex-col gap-1.5 rounded-xl p-3 text-left transition-colors"
              style={{
                backgroundColor: activo ? "var(--brand-tint)" : "var(--hover-surface-2)",
                border: `1px solid ${activo ? "rgba(154,98,250,0.5)" : "var(--border-hair)"}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: activo ? "var(--brand-tint-strong)" : "var(--border-subtle)" }}
              >
                <Icon className="w-4 h-4" style={{ color: activo ? "var(--brand)" : "var(--text-dim)" }} />
              </div>
              <span className="text-sm font-medium" style={{ color: activo ? "var(--text-strong)" : "var(--muted-foreground)" }}>{label}</span>
              <span className="text-[11px] leading-snug" style={{ color: "var(--text-dim)" }}>{hint}</span>
            </button>
          );
        })}
      </div>

      {/* Campos según la modalidad */}
      {value.modalidad === "rango" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Precio mínimo</label>
            <MoneyInput value={value.precioMin} onChange={(v) => set({ precioMin: v })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Precio máximo</label>
            <MoneyInput value={value.precioMax} onChange={(v) => set({ precioMax: v })} />
          </div>
        </div>
      )}

      {value.modalidad === "periodo" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Precio</label>
            <MoneyInput value={value.precioPeriodo} onChange={(v) => set({ precioPeriodo: v })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Por</label>
            <Select
              value={value.unidadTiempo || undefined}
              onValueChange={(v) => set({ unidadTiempo: (v as UnidadTiempoServicio) ?? "" })}
              items={UNIDAD_TIEMPO_OPCIONES}
            >
              <SelectTrigger className="w-full h-9 text-sm focus-visible:ring-0" style={inputStyle}>
                <SelectValue placeholder="Selecciona la unidad" />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={4}>
                {UNIDAD_TIEMPO_OPCIONES.map(({ value: u, label }) => (
                  <SelectItem key={u} value={u}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {value.modalidad === "personalizado" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Esquema de cobro</label>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>{value.precioPersonalizado.length} / {MAX_PERSONALIZADO}</span>
          </div>
          <Textarea
            value={value.precioPersonalizado}
            maxLength={MAX_PERSONALIZADO}
            onChange={(e) => set({ precioPersonalizado: e.target.value })}
            placeholder="Ej. Cotización por proyecto según alcance, o paquetes desde $X con extras opcionales."
            className="min-h-20 resize-none text-sm focus-visible:ring-0"
            style={inputStyle}
          />
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Valida el valor y devuelve un mensaje de error, o null si es válido. */
export function validarServicioPrecio(v: ServicioPrecioValue): string | null {
  if (!v.modalidad) return "Selecciona una modalidad de precio.";
  if (v.modalidad === "rango") {
    if (!v.precioMin && !v.precioMax) return "Indica al menos un precio (mínimo o máximo).";
    const min = parseFloat(v.precioMin);
    const max = parseFloat(v.precioMax);
    if (v.precioMin && v.precioMax && !isNaN(min) && !isNaN(max) && min > max) {
      return "El precio mínimo no puede ser mayor que el máximo.";
    }
  }
  if (v.modalidad === "periodo") {
    if (!v.precioPeriodo) return "Indica el precio del servicio.";
    if (!v.unidadTiempo) return "Selecciona la unidad de tiempo.";
  }
  if (v.modalidad === "personalizado" && !v.precioPersonalizado.trim()) {
    return "Describe el esquema de cobro personalizado.";
  }
  return null;
}

/** Convierte el valor del formulario a los campos que persiste el store. */
export function servicioPrecioToStore(v: ServicioPrecioValue) {
  const num = (s: string) => (s !== "" && !isNaN(parseFloat(s)) ? parseFloat(s) : undefined);
  return {
    modalidadPrecio: (v.modalidad || undefined) as ModalidadPrecioServicio | undefined,
    precioMin: v.modalidad === "rango" ? num(v.precioMin) : undefined,
    precioMax: v.modalidad === "rango" ? num(v.precioMax) : undefined,
    precioPeriodo: v.modalidad === "periodo" ? num(v.precioPeriodo) : undefined,
    unidadTiempo: v.modalidad === "periodo" ? (v.unidadTiempo || undefined) as UnidadTiempoServicio | undefined : undefined,
    precioPersonalizado: v.modalidad === "personalizado" ? v.precioPersonalizado.trim() || undefined : undefined,
  };
}

/** Convierte un producto/servicio del store al valor del formulario. */
export function storeToServicioPrecio(p: {
  modalidadPrecio?: ModalidadPrecioServicio;
  precioMin?: number;
  precioMax?: number;
  precioPeriodo?: number;
  unidadTiempo?: UnidadTiempoServicio;
  precioPersonalizado?: string;
}): ServicioPrecioValue {
  return {
    modalidad: p.modalidadPrecio ?? "",
    precioMin: p.precioMin != null ? String(p.precioMin) : "",
    precioMax: p.precioMax != null ? String(p.precioMax) : "",
    precioPeriodo: p.precioPeriodo != null ? String(p.precioPeriodo) : "",
    unidadTiempo: p.unidadTiempo ?? "",
    precioPersonalizado: p.precioPersonalizado ?? "",
  };
}

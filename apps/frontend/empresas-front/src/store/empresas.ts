import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EstadoEmpresa, GiroEmpresa, EstadoHipotesis, TipoProducto, TipoExperimento } from "@leanstart/commons";

export interface Progreso {
  tieneProducto: boolean;
  tieneCanvas: boolean;
  tieneHipotesis: boolean;
}

export interface CanvasData {
  problema: string[];
  solucion: string;
  pvp: string;
  ventajaInjusta: string;
  segmentosClientes: string[];
  metricasClave: string[];
  canales: string[];
  estructuraCostos: string[];
  fuentesIngresos: string[];
}

export const DEFAULT_CANVAS: CanvasData = {
  problema: [], solucion: "", pvp: "", ventajaInjusta: "",
  segmentosClientes: [], metricasClave: [], canales: [],
  estructuraCostos: [], fuentesIngresos: [],
};

export interface ExperimentoDiseno {
  tipo: TipoExperimento;
  descripcion: string;
  objetivo: string;
  criterioExito: string;
  fechaObjetivo?: string;
}

export type TipoEvidencia = "pdf" | "imagen" | "documento" | "url";

export interface ResultadosHipotesis {
  resultado: string;
  /** Para archivos: data URL base64. Para tipo "url": la URL ingresada. */
  evidencia?: string;
  /** Nombre original del archivo (solo cuando tipoEvidencia !== "url"). */
  evidenciaNombre?: string;
  tipoEvidencia?: TipoEvidencia;
  conclusion: string;
}

export interface Hipotesis {
  id: string;
  // Fase 1
  titulo: string;
  descripcion: string;
  // Fase 2
  experimento?: ExperimentoDiseno;
  // Fase 3
  resultados?: ResultadosHipotesis;
  estado: EstadoHipotesis;
  fase: 1 | 2 | 3;
}

export interface Producto {
  id: string;
  nombre: string;
  tipo: TipoProducto;
  descripcion: string;
  caracteristicas?: string;
  precio?: number;
  creadoEn: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  giro: GiroEmpresa;
  descripcion: string;
  mercadoObjetivo: string;
  estado: EstadoEmpresa;
  logoUrl?: string;
  productosList: Producto[];
  canvasBloques: number;
  canvas: CanvasData;
  hipotesisList: Hipotesis[];
  creadaEn: string;
  updatedAt: string;
  progreso: Progreso;
  mentorId?: string;
  evaluadorId?: string;
}

interface EmpresasStore {
  empresas: Empresa[];
  agregarEmpresa: (data: {
    nombre: string;
    giro: GiroEmpresa;
    descripcion: string;
    mercadoObjetivo: string;
    logoUrl?: string;
  }) => string;
  actualizarEmpresa: (id: string, data: Partial<Empresa>) => void;
  eliminarEmpresa: (id: string) => void;
  actualizarCanvas: (empresaId: string, canvas: Partial<CanvasData>) => void;
  agregarProducto: (empresaId: string, producto: Omit<Producto, "id" | "creadoEn">) => void;
  actualizarProducto: (empresaId: string, productoId: string, data: Partial<Omit<Producto, "id" | "creadoEn">>) => void;
  eliminarProducto: (empresaId: string, productoId: string) => void;
  agregarHipotesis: (empresaId: string, hipotesis: Omit<Hipotesis, "id">) => string;
  actualizarHipotesis: (empresaId: string, hipotesisId: string, data: Partial<Hipotesis>) => void;
  eliminarHipotesis: (empresaId: string, hipotesisId: string) => void;
  asignarMentor: (empresaId: string, mentorId: string) => void;
  asignarEvaluador: (empresaId: string, evaluadorId: string) => void;
}

export const useEmpresasStore = create<EmpresasStore>()(
  persist(
    (set, get) => ({
      empresas: [],

      agregarEmpresa(data) {
        const id = crypto.randomUUID();
        const ahora = new Date().toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const nueva: Empresa = {
          id,
          nombre: data.nombre,
          giro: data.giro,
          descripcion: data.descripcion,
          mercadoObjetivo: data.mercadoObjetivo,
          logoUrl: data.logoUrl,
          estado: "borrador",
          productosList: [],
          canvasBloques: 0,
          canvas: { ...DEFAULT_CANVAS },
          hipotesisList: [],
          creadaEn: ahora,
          updatedAt: "Justo ahora",
          progreso: { tieneProducto: false, tieneCanvas: false, tieneHipotesis: false },
        };
        set({ empresas: [nueva, ...get().empresas] });
        return id;
      },

      actualizarEmpresa(id, data) {
        set({
          empresas: get().empresas.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: "Justo ahora" } : e
          ),
        });
      },

      eliminarEmpresa(id) {
        set({ empresas: get().empresas.filter((e) => e.id !== id) });
      },

      actualizarCanvas(empresaId, canvasUpdate) {
        set({
          empresas: get().empresas.map((e) => {
            if (e.id !== empresaId) return e;
            const newCanvas = { ...(e.canvas ?? DEFAULT_CANVAS), ...canvasUpdate };
            const completados = [
              newCanvas.problema.some((v) => v.trim()),
              !!newCanvas.solucion.trim(),
              !!newCanvas.pvp.trim(),
              !!newCanvas.ventajaInjusta.trim(),
              newCanvas.segmentosClientes.some((v) => v.trim()),
              newCanvas.metricasClave.some((v) => v.trim()),
              newCanvas.canales.some((v) => v.trim()),
              newCanvas.estructuraCostos.some((v) => v.trim()),
              newCanvas.fuentesIngresos.some((v) => v.trim()),
            ].filter(Boolean).length;
            return {
              ...e,
              canvas: newCanvas,
              canvasBloques: completados,
              progreso: { ...e.progreso, tieneCanvas: completados > 0 },
              updatedAt: "Justo ahora",
            };
          }),
        });
      },

      agregarProducto(empresaId, producto) {
        const id = crypto.randomUUID();
        const ahora = new Date().toLocaleDateString("es-MX", {
          day: "numeric", month: "short", year: "numeric",
        });
        set({
          empresas: get().empresas.map((e) => {
            if (e.id !== empresaId) return e;
            const lista = [...(e.productosList ?? []), { ...producto, id, creadoEn: ahora }];
            return {
              ...e,
              productosList: lista,
              progreso: { ...e.progreso, tieneProducto: true },
              updatedAt: "Justo ahora",
            };
          }),
        });
      },

      actualizarProducto(empresaId, productoId, data) {
        set({
          empresas: get().empresas.map((e) => {
            if (e.id !== empresaId) return e;
            const lista = (e.productosList ?? []).map((p) =>
              p.id === productoId ? { ...p, ...data } : p
            );
            return { ...e, productosList: lista, updatedAt: "Justo ahora" };
          }),
        });
      },

      eliminarProducto(empresaId, productoId) {
        set({
          empresas: get().empresas.map((e) => {
            if (e.id !== empresaId) return e;
            const lista = e.productosList.filter((p) => p.id !== productoId);
            return {
              ...e,
              productosList: lista,
              progreso: { ...e.progreso, tieneProducto: lista.length > 0 },
              updatedAt: "Justo ahora",
            };
          }),
        });
      },

      agregarHipotesis(empresaId, hipotesis) {
        const nuevoId = crypto.randomUUID();
        set({
          empresas: get().empresas.map((e) => {
            const lista = e.hipotesisList ?? [];
            if (e.id !== empresaId || lista.length >= 3) return e;
            const nuevaLista = [...lista, { ...hipotesis, id: nuevoId }];
            return {
              ...e,
              hipotesisList: nuevaLista,
              progreso: { ...e.progreso, tieneHipotesis: nuevaLista.length > 0 },
              updatedAt: "Justo ahora",
            };
          }),
        });
        return nuevoId;
      },

      eliminarHipotesis(empresaId, hipotesisId) {
        set({
          empresas: get().empresas.map((e) => {
            if (e.id !== empresaId) return e;
            const lista = (e.hipotesisList ?? []).filter((h) => h.id !== hipotesisId);
            return {
              ...e,
              hipotesisList: lista,
              progreso: { ...e.progreso, tieneHipotesis: lista.length > 0 },
              updatedAt: "Justo ahora",
            };
          }),
        });
      },

      actualizarHipotesis(empresaId, hipotesisId, data) {
        set({
          empresas: get().empresas.map((e) => {
            if (e.id !== empresaId) return e;
            return {
              ...e,
              hipotesisList: (e.hipotesisList ?? []).map((h) =>
                h.id === hipotesisId ? { ...h, ...data } : h
              ),
              updatedAt: "Justo ahora",
            };
          }),
        });
      },

      asignarMentor(empresaId, mentorId) {
        set({
          empresas: get().empresas.map((e) =>
            e.id === empresaId
              ? { ...e, mentorId, estado: "en_mentoria", updatedAt: "Justo ahora" }
              : e
          ),
        });
      },

      asignarEvaluador(empresaId, evaluadorId) {
        set({
          empresas: get().empresas.map((e) =>
            e.id === empresaId
              ? { ...e, evaluadorId, estado: "en_evaluacion", updatedAt: "Justo ahora" }
              : e
          ),
        });
      },
    }),
    { name: "leanstart-empresas" }
  )
);

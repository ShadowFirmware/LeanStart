import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { createSafeLocalStorage } from "@leanstart/commons";
import type {
  EstadoEmpresa, GiroEmpresa, EstadoHipotesis, TipoProducto, TipoExperimento,
  ModalidadPrecioServicio, UnidadTiempoServicio,
} from "@leanstart/commons";

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
  /** Precio simple (solo aplica a tipo "producto"). */
  precio?: number;
  /** Imágenes del producto en data URL base64 (solo aplica a tipo "producto"). */
  imagenes?: string[];
  // ─── Campos exclusivos de servicios ───
  /** Modalidad de cobro cuando tipo === "servicio". */
  modalidadPrecio?: ModalidadPrecioServicio;
  /** Modalidad "rango": límites inferior y superior. */
  precioMin?: number;
  precioMax?: number;
  /** Modalidad "periodo": precio y unidad de tiempo. */
  precioPeriodo?: number;
  unidadTiempo?: UnidadTiempoServicio;
  /** Modalidad "personalizado": descripción libre del esquema de cobro. */
  precioPersonalizado?: string;
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
  /** Id del emprendedor dueño. Se usa para aislar los datos entre usuarios. */
  ownerId?: string;
  mentorId?: string;
  evaluadorId?: string;
}

// Empresas de ejemplo para la cuenta demo "daniel@example.com" (ver
// DEMO_ACCOUNTS en commons/src/lib/demo.ts): ya tienen la fase 1 lista
// (datos generales) para poder probar directo desde la fase 2 (productos).
const SEED_EMPRESAS_DANIEL: Empresa[] = [
  {
    id: "seed-daniel-1",
    nombre: "SnackEco",
    giro: "sustentabilidad",
    descripcion: "Snacks saludables a base de insectos, en empaques biodegradables.",
    mercadoObjetivo: "Jóvenes universitarios conscientes del medio ambiente.",
    ownerId: "demo-daniel",
    estado: "borrador",
    productosList: [],
    canvasBloques: 0,
    canvas: { ...DEFAULT_CANVAS },
    hipotesisList: [],
    creadaEn: "7 ago 2026",
    updatedAt: "7 ago 2026",
    progreso: { tieneProducto: false, tieneCanvas: false, tieneHipotesis: false },
  },
  {
    id: "seed-daniel-2",
    nombre: "TutorIA",
    giro: "educacion",
    descripcion: "Plataforma de tutorías personalizadas en línea para estudiantes de bachillerato.",
    mercadoObjetivo: "Estudiantes de bachillerato que buscan reforzar materias difíciles.",
    ownerId: "demo-daniel",
    estado: "borrador",
    productosList: [],
    canvasBloques: 0,
    canvas: { ...DEFAULT_CANVAS },
    hipotesisList: [],
    creadaEn: "7 ago 2026",
    updatedAt: "7 ago 2026",
    progreso: { tieneProducto: false, tieneCanvas: false, tieneHipotesis: false },
  },
];

interface EmpresasStore {
  empresas: Empresa[];
  agregarEmpresa: (data: {
    nombre: string;
    giro: GiroEmpresa;
    descripcion: string;
    mercadoObjetivo: string;
    logoUrl?: string;
    ownerId?: string;
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
      empresas: SEED_EMPRESAS_DANIEL,

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
          ownerId: data.ownerId,
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
    // skipHydration: la rehidratación inicial la dispara <LiveSync/> tras montar,
    // para que servidor y primer render de cliente coincidan (sin mismatch).
    // storage segura: si se llena la cuota de localStorage no se tumba la app,
    // solo se avisa (las imágenes ya van comprimidas, así que es un último seguro).
    {
      name: "leanstart-empresas",
      skipHydration: true,
      // v1: el estado "evaluado" se eliminó — el evaluador ahora resuelve directo a
      // "publicado" o "devuelto" según el umbral de viabilidad. Los proyectos que ya
      // estaban en "evaluado" pasan a "publicado" una sola vez, al rehidratar.
      // v2: se agregan las 2 empresas de ejemplo de la cuenta demo "daniel" (ver
      // SEED_EMPRESAS_DANIEL) para navegadores que ya tenían datos guardados antes
      // de que existiera esa cuenta.
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as { empresas?: Array<Record<string, unknown>> } | undefined;
        if (state?.empresas) {
          state.empresas = state.empresas.map((e) =>
            e.estado === "evaluado" ? { ...e, estado: "publicado" } : e
          );

          if (!state.empresas.some((e) => e.ownerId === "demo-daniel")) {
            state.empresas.push(
              ...(SEED_EMPRESAS_DANIEL as unknown as Array<Record<string, unknown>>)
            );
          }
        }
        return state;
      },
      storage: createJSONStorage(() =>
        createSafeLocalStorage(() =>
          toast.error(
            "Se alcanzó el límite de almacenamiento local. Elimina algún producto, imagen o empresa para poder guardar más."
          )
        )
      ),
    }
  )
);

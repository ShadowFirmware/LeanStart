import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { apiFetch, createIndexedDbStorage, modoDemo } from "@leanstart/commons";
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
  scoreFinal?: number;
  /** Nivel de viabilidad obtenido al finalizar la evaluación, congelado (no se recalcula si cambian los rangos). */
  nivelNombre?: string;
  nivelColor?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Backend (empresas-service) — mapeo de la forma de la API a la del store.
// ─────────────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function calcularProgreso(productosList: Producto[], canvasBloques: number, hipotesisList: Hipotesis[]): Progreso {
  return {
    tieneProducto: productosList.length > 0,
    tieneCanvas: canvasBloques > 0,
    tieneHipotesis: hipotesisList.length > 0,
  };
}

function mapProducto(p: Record<string, unknown>): Producto {
  return {
    id: p.id as string,
    nombre: p.nombre as string,
    tipo: p.tipo as TipoProducto,
    descripcion: p.descripcion as string,
    caracteristicas: (p.caracteristicas as string) ?? undefined,
    precio: (p.precio as number) ?? undefined,
    imagenes: (p.imagenes as string[]) ?? undefined,
    modalidadPrecio: (p.modalidadPrecio as ModalidadPrecioServicio) ?? undefined,
    precioMin: (p.precioMin as number) ?? undefined,
    precioMax: (p.precioMax as number) ?? undefined,
    precioPeriodo: (p.precioPeriodo as number) ?? undefined,
    unidadTiempo: (p.unidadTiempo as UnidadTiempoServicio) ?? undefined,
    precioPersonalizado: (p.precioPersonalizado as string) ?? undefined,
    creadoEn: formatFecha(p.createdAt as string),
  };
}

function mapHipotesis(h: Record<string, unknown>): Hipotesis {
  return {
    id: h.id as string,
    titulo: h.titulo as string,
    descripcion: h.descripcion as string,
    experimento: (h.experimento as ExperimentoDiseno) ?? undefined,
    resultados: (h.resultados as ResultadosHipotesis) ?? undefined,
    estado: h.estado as EstadoHipotesis,
    fase: h.fase as 1 | 2 | 3,
  };
}

function mapCanvas(c: Record<string, unknown> | null | undefined): CanvasData {
  if (!c) return { ...DEFAULT_CANVAS };
  return {
    problema: (c.problema as string[]) ?? [],
    solucion: (c.solucion as string) ?? "",
    pvp: (c.pvp as string) ?? "",
    ventajaInjusta: (c.ventajaInjusta as string) ?? "",
    segmentosClientes: (c.segmentosClientes as string[]) ?? [],
    metricasClave: (c.metricasClave as string[]) ?? [],
    canales: (c.canales as string[]) ?? [],
    estructuraCostos: (c.estructuraCostos as string[]) ?? [],
    fuentesIngresos: (c.fuentesIngresos as string[]) ?? [],
  };
}

/** Mapea una empresa completa (con canvas/productos/hipotesis anidados) tal como la devuelve el gateway. */
function mapEmpresaCompleta(e: Record<string, unknown>): Empresa {
  const productosList = ((e.productos as Record<string, unknown>[]) ?? []).map(mapProducto);
  const hipotesisList = ((e.hipotesis as Record<string, unknown>[]) ?? []).map(mapHipotesis);
  const canvasBloques = (e.canvasBloques as number) ?? 0;
  return {
    id: e.id as string,
    nombre: e.nombre as string,
    giro: e.giro as GiroEmpresa,
    descripcion: e.descripcion as string,
    mercadoObjetivo: e.mercadoObjetivo as string,
    estado: e.estado as EstadoEmpresa,
    logoUrl: (e.logoUrl as string) ?? undefined,
    ownerId: (e.ownerId as string) ?? undefined,
    mentorId: (e.mentorId as string) ?? undefined,
    evaluadorId: (e.evaluadorId as string) ?? undefined,
    scoreFinal: (e.scoreFinal as number) ?? undefined,
    nivelNombre: (e.nivelNombre as string) ?? undefined,
    nivelColor: (e.nivelColor as string) ?? undefined,
    canvasBloques,
    canvas: mapCanvas(e.canvas as Record<string, unknown>),
    productosList,
    hipotesisList,
    creadaEn: formatFecha(e.createdAt as string),
    updatedAt: formatFecha(e.updatedAt as string),
    progreso: calcularProgreso(productosList, canvasBloques, hipotesisList),
  };
}

/**
 * Algunos endpoints (cambiar estado, asignar mentor/evaluador) devuelven la fila
 * de empresa "plana", sin canvas/productos/hipotesis. Ahí solo mezclamos los
 * campos que sí vienen, preservando lo que ya había en memoria.
 */
function mergeEmpresaParcial(actual: Empresa, e: Record<string, unknown>): Empresa {
  return {
    ...actual,
    nombre: (e.nombre as string) ?? actual.nombre,
    giro: (e.giro as GiroEmpresa) ?? actual.giro,
    descripcion: (e.descripcion as string) ?? actual.descripcion,
    mercadoObjetivo: (e.mercadoObjetivo as string) ?? actual.mercadoObjetivo,
    estado: (e.estado as EstadoEmpresa) ?? actual.estado,
    logoUrl: (e.logoUrl as string) ?? actual.logoUrl,
    mentorId: (e.mentorId as string) ?? actual.mentorId,
    evaluadorId: (e.evaluadorId as string) ?? actual.evaluadorId,
    scoreFinal: (e.scoreFinal as number) ?? actual.scoreFinal,
    nivelNombre: (e.nivelNombre as string) ?? actual.nivelNombre,
    nivelColor: (e.nivelColor as string) ?? actual.nivelColor,
    updatedAt: e.updatedAt ? formatFecha(e.updatedAt as string) : actual.updatedAt,
  };
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
  /** Carga las empresas desde el backend real (no-op en modo demo). */
  cargarEmpresas: () => Promise<void>;
  agregarEmpresa: (data: {
    nombre: string;
    giro: GiroEmpresa;
    descripcion: string;
    mercadoObjetivo: string;
    logoUrl?: string;
    ownerId?: string;
  }) => Promise<string>;
  actualizarEmpresa: (id: string, data: Partial<Empresa>) => Promise<void>;
  eliminarEmpresa: (id: string) => Promise<void>;
  actualizarCanvas: (empresaId: string, canvas: Partial<CanvasData>) => Promise<void>;
  agregarProducto: (empresaId: string, producto: Omit<Producto, "id" | "creadoEn">) => Promise<void>;
  actualizarProducto: (empresaId: string, productoId: string, data: Partial<Omit<Producto, "id" | "creadoEn">>) => Promise<void>;
  eliminarProducto: (empresaId: string, productoId: string) => Promise<void>;
  agregarHipotesis: (empresaId: string, hipotesis: Omit<Hipotesis, "id">) => Promise<string>;
  actualizarHipotesis: (empresaId: string, hipotesisId: string, data: Partial<Hipotesis>) => Promise<void>;
  eliminarHipotesis: (empresaId: string, hipotesisId: string) => Promise<void>;
  asignarMentor: (empresaId: string, mentorId: string) => Promise<void>;
  asignarEvaluador: (empresaId: string, evaluadorId: string) => Promise<void>;
  /**
   * Aplica campos en memoria SIN llamar a la API — para cuando otro store/servicio
   * (observaciones, evaluaciones) ya hizo el cambio real en el backend y solo falta
   * que este store se entere, sin un round-trip extra. Sin esto, el estado/score/nivel
   * se quedan viejos en memoria hasta recargar (ej. al enviar retroalimentación, al
   * marcar observaciones atendidas, al finalizar una evaluación).
   */
  sincronizarLocal: (empresaId: string, data: Partial<Empresa>) => void;
  /**
   * Igual que `sincronizarLocal`, pero recibe la forma CRUDA que devuelve el
   * backend (con canvas/productos/hipotesis anidados, tal como la manda p. ej.
   * el asistente conversacional tras crear o editar una empresa) y la mapea
   * antes de guardarla. Si la empresa todavía no estaba en la lista (se acaba
   * de crear), la agrega en vez de intentar un merge que no encontraría nada.
   */
  sincronizarDesdeApi: (empresaCruda: Record<string, unknown>) => void;
}

export const useEmpresasStore = create<EmpresasStore>()(
  persist(
    (set, get) => ({
      empresas: SEED_EMPRESAS_DANIEL,

      async cargarEmpresas() {
        if (modoDemo()) return;
        const empresas = await apiFetch<Record<string, unknown>[]>("/empresas");
        set({ empresas: empresas.map(mapEmpresaCompleta) });
      },

      async agregarEmpresa(data) {
        if (!modoDemo()) {
          const empresa = await apiFetch<Record<string, unknown>>("/empresas", {
            method: "POST",
            body: JSON.stringify({
              nombre: data.nombre,
              giro: data.giro,
              descripcion: data.descripcion,
              mercadoObjetivo: data.mercadoObjetivo,
              logoUrl: data.logoUrl,
            }),
          });
          const nueva = mapEmpresaCompleta(empresa);
          set({ empresas: [nueva, ...get().empresas] });
          return nueva.id;
        }

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

      async actualizarEmpresa(id, data) {
        if (!modoDemo()) {
          const soloEstado = Object.keys(data).length === 1 && "estado" in data;
          const empresa = soloEstado
            ? await apiFetch<Record<string, unknown>>(`/empresas/${id}/estado`, {
                method: "PATCH",
                body: JSON.stringify({ estado: data.estado }),
              })
            : await apiFetch<Record<string, unknown>>(`/empresas/${id}`, {
                method: "PATCH",
                body: JSON.stringify(data),
              });
          set({
            empresas: get().empresas.map((e) => (e.id === id ? mergeEmpresaParcial(e, empresa) : e)),
          });
          return;
        }

        set({
          empresas: get().empresas.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: "Justo ahora" } : e
          ),
        });
      },

      async eliminarEmpresa(id) {
        if (!modoDemo()) {
          await apiFetch(`/empresas/${id}`, { method: "DELETE" });
        }
        set({ empresas: get().empresas.filter((e) => e.id !== id) });
      },

      async actualizarCanvas(empresaId, canvasUpdate) {
        if (!modoDemo()) {
          const canvas = await apiFetch<Record<string, unknown>>(`/empresas/${empresaId}/canvas`, {
            method: "PATCH",
            body: JSON.stringify(canvasUpdate),
          });
          set({
            empresas: get().empresas.map((e) => {
              if (e.id !== empresaId) return e;
              const newCanvas = mapCanvas(canvas);
              const canvasBloques = contarBloques(newCanvas);
              return {
                ...e,
                canvas: newCanvas,
                canvasBloques,
                progreso: { ...e.progreso, tieneCanvas: canvasBloques > 0 },
              };
            }),
          });
          return;
        }

        set({
          empresas: get().empresas.map((e) => {
            if (e.id !== empresaId) return e;
            const newCanvas = { ...(e.canvas ?? DEFAULT_CANVAS), ...canvasUpdate };
            const completados = contarBloques(newCanvas);
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

      async agregarProducto(empresaId, producto) {
        if (!modoDemo()) {
          const creado = await apiFetch<Record<string, unknown>>(`/empresas/${empresaId}/productos`, {
            method: "POST",
            body: JSON.stringify(producto),
          });
          const nuevo = mapProducto(creado);
          set({
            empresas: get().empresas.map((e) => {
              if (e.id !== empresaId) return e;
              const lista = [...(e.productosList ?? []), nuevo];
              return { ...e, productosList: lista, progreso: { ...e.progreso, tieneProducto: true } };
            }),
          });
          return;
        }

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

      async actualizarProducto(empresaId, productoId, data) {
        if (!modoDemo()) {
          const actualizado = await apiFetch<Record<string, unknown>>(
            `/empresas/${empresaId}/productos/${productoId}`,
            { method: "PATCH", body: JSON.stringify(data) }
          );
          const mapeado = mapProducto(actualizado);
          set({
            empresas: get().empresas.map((e) => {
              if (e.id !== empresaId) return e;
              return {
                ...e,
                productosList: (e.productosList ?? []).map((p) => (p.id === productoId ? mapeado : p)),
              };
            }),
          });
          return;
        }

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

      async eliminarProducto(empresaId, productoId) {
        if (!modoDemo()) {
          await apiFetch(`/empresas/${empresaId}/productos/${productoId}`, { method: "DELETE" });
        }
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

      async agregarHipotesis(empresaId, hipotesis) {
        if (!modoDemo()) {
          const empresaActual = get().empresas.find((e) => e.id === empresaId);
          if ((empresaActual?.hipotesisList ?? []).length >= 3) return "";

          let creada = await apiFetch<Record<string, unknown>>(`/empresas/${empresaId}/hipotesis`, {
            method: "POST",
            body: JSON.stringify({ titulo: hipotesis.titulo, descripcion: hipotesis.descripcion }),
          });
          const id = creada.id as string;

          // El wizard siempre manda `experimento` (a veces con campos vacíos) y solo
          // manda `resultados` en fase 3 — nos guiamos por `fase`, no por la sola
          // presencia del objeto, para no avanzar de fase antes de tiempo.
          if (hipotesis.fase >= 2 && hipotesis.experimento) {
            creada = await apiFetch<Record<string, unknown>>(
              `/empresas/${empresaId}/hipotesis/${id}/experimento`,
              { method: "PATCH", body: JSON.stringify(hipotesis.experimento) }
            );
          }
          if (hipotesis.fase >= 3 && hipotesis.resultados) {
            creada = await apiFetch<Record<string, unknown>>(
              `/empresas/${empresaId}/hipotesis/${id}/resultados`,
              { method: "PATCH", body: JSON.stringify(hipotesis.resultados) }
            );
          }

          const nueva = mapHipotesis(creada);
          set({
            empresas: get().empresas.map((e) => {
              if (e.id !== empresaId) return e;
              const nuevaLista = [...(e.hipotesisList ?? []), nueva];
              return { ...e, hipotesisList: nuevaLista, progreso: { ...e.progreso, tieneHipotesis: true } };
            }),
          });
          return id;
        }

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

      async actualizarHipotesis(empresaId, hipotesisId, data) {
        if (!modoDemo()) {
          let actualizada: Record<string, unknown> | undefined;
          const { experimento, resultados, fase, titulo, descripcion, estado } = data;

          // El mentor valida/invalida mandando solo `{estado}` — tiene su propio endpoint,
          // distinto del PATCH general (que no acepta `estado`).
          const soloEstado = Object.keys(data).length === 1 && estado !== undefined;
          if (soloEstado) {
            actualizada = await apiFetch<Record<string, unknown>>(
              `/empresas/${empresaId}/hipotesis/${hipotesisId}/validar`,
              { method: "PATCH", body: JSON.stringify({ estado }) }
            );
          } else {
            if (titulo !== undefined || descripcion !== undefined) {
              actualizada = await apiFetch<Record<string, unknown>>(
                `/empresas/${empresaId}/hipotesis/${hipotesisId}`,
                { method: "PATCH", body: JSON.stringify({ titulo, descripcion }) }
              );
            }
            // Igual que en `agregarHipotesis`: solo avanzamos de fase si el formulario
            // realmente llegó a esa fase, no por la sola presencia del objeto.
            if ((fase ?? 1) >= 2 && experimento) {
              actualizada = await apiFetch<Record<string, unknown>>(
                `/empresas/${empresaId}/hipotesis/${hipotesisId}/experimento`,
                { method: "PATCH", body: JSON.stringify(experimento) }
              );
            }
            if ((fase ?? 1) >= 3 && resultados) {
              actualizada = await apiFetch<Record<string, unknown>>(
                `/empresas/${empresaId}/hipotesis/${hipotesisId}/resultados`,
                { method: "PATCH", body: JSON.stringify(resultados) }
              );
            }
          }
          if (!actualizada) return;

          const mapeada = mapHipotesis(actualizada);
          set({
            empresas: get().empresas.map((e) => {
              if (e.id !== empresaId) return e;
              return {
                ...e,
                hipotesisList: (e.hipotesisList ?? []).map((h) => (h.id === hipotesisId ? mapeada : h)),
              };
            }),
          });
          return;
        }

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

      async eliminarHipotesis(empresaId, hipotesisId) {
        if (!modoDemo()) {
          await apiFetch(`/empresas/${empresaId}/hipotesis/${hipotesisId}`, { method: "DELETE" });
        }
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

      async asignarMentor(empresaId, mentorId) {
        if (!modoDemo()) {
          const empresa = await apiFetch<Record<string, unknown>>(`/empresas/${empresaId}/asignar-mentor`, {
            method: "PATCH",
            body: JSON.stringify({ userId: mentorId }),
          });
          set({
            empresas: get().empresas.map((e) => (e.id === empresaId ? mergeEmpresaParcial(e, empresa) : e)),
          });
          return;
        }

        set({
          empresas: get().empresas.map((e) =>
            e.id === empresaId
              ? { ...e, mentorId, estado: "en_mentoria", updatedAt: "Justo ahora" }
              : e
          ),
        });
      },

      async asignarEvaluador(empresaId, evaluadorId) {
        if (!modoDemo()) {
          const empresa = await apiFetch<Record<string, unknown>>(`/empresas/${empresaId}/asignar-evaluador`, {
            method: "PATCH",
            body: JSON.stringify({ userId: evaluadorId }),
          });
          set({
            empresas: get().empresas.map((e) => (e.id === empresaId ? mergeEmpresaParcial(e, empresa) : e)),
          });
          return;
        }

        set({
          empresas: get().empresas.map((e) =>
            e.id === empresaId
              ? { ...e, evaluadorId, estado: "en_evaluacion", updatedAt: "Justo ahora" }
              : e
          ),
        });
      },

      sincronizarLocal(empresaId, data) {
        set({
          empresas: get().empresas.map((e) => (e.id === empresaId ? { ...e, ...data } : e)),
        });
      },

      sincronizarDesdeApi(empresaCruda) {
        const mapeada = mapEmpresaCompleta(empresaCruda);
        set((state) => {
          const yaExiste = state.empresas.some((e) => e.id === mapeada.id);
          return {
            empresas: yaExiste
              ? state.empresas.map((e) => (e.id === mapeada.id ? mapeada : e))
              : [mapeada, ...state.empresas],
          };
        });
      },
    }),
    // skipHydration: la rehidratación inicial la dispara <LiveSync/> tras montar,
    // para que servidor y primer render de cliente coincidan (sin mismatch).
    // storage en IndexedDB (no localStorage): las evidencias/imágenes van embebidas
    // en base64 y superan fácil el tope de ~5-10MB de localStorage. Sigue sin tumbar
    // la app si por lo que sea se llega a topar una cuota — solo se avisa.
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
        createIndexedDbStorage(() =>
          toast.error(
            "Se alcanzó el límite de almacenamiento del navegador. Elimina algún producto, imagen o empresa para poder guardar más."
          )
        )
      ),
    }
  )
);

function contarBloques(canvas: CanvasData): number {
  return [
    canvas.problema.some((v) => v.trim()),
    !!canvas.solucion.trim(),
    !!canvas.pvp.trim(),
    !!canvas.ventajaInjusta.trim(),
    canvas.segmentosClientes.some((v) => v.trim()),
    canvas.metricasClave.some((v) => v.trim()),
    canvas.canales.some((v) => v.trim()),
    canvas.estructuraCostos.some((v) => v.trim()),
    canvas.fuentesIngresos.some((v) => v.trim()),
  ].filter(Boolean).length;
}

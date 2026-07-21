import { create } from "zustand";

interface CargaInicialStore {
  /** true mientras la pantalla de carga inicial debe mostrarse. */
  activa: boolean;
  total: number;
  completadas: number;
  /** Arranca (o reinicia) el conteo para una nueva sesión con `total` tareas. */
  iniciar: (total: number) => void;
  marcarCompletada: () => void;
  finalizar: () => void;
}

/**
 * Progreso de la carga inicial de datos reales (empresas, notificaciones,
 * perfil, y según el rol también usuarios/criterios/viabilidad/reportes).
 * `LiveSync` reporta aquí conforme cada `cargarX()` resuelve, para que
 * `InitialLoadOverlay` pueda mostrar un checklist con el avance real en vez
 * de una animación decorativa desconectada de lo que en verdad está pasando.
 */
export const useCargaInicialStore = create<CargaInicialStore>()((set, get) => ({
  activa: false,
  total: 0,
  completadas: 0,
  iniciar(total) {
    if (total === 0) return;
    set({ activa: true, total, completadas: 0 });
  },
  marcarCompletada() {
    set({ completadas: Math.min(get().completadas + 1, get().total) });
  },
  finalizar() {
    set({ activa: false });
  },
}));

import { create } from "zustand";

/** Tiempo mínimo que el indicador permanece visible: sin esto, un guardado instantáneo sería un parpadeo. */
const MIN_VISIBLE_MS = 500;

/**
 * Registro global de operaciones en vuelo ("se están registrando cambios").
 *
 * Cualquier punto de la app que dispare una escritura —una llamada a la API,
 * una acción de store en modo demo, un submit de formulario— la anuncia aquí.
 * El indicador flotante del shell (<IndicadorCarga/>) es el único que lo lee,
 * de modo que TODAS las vistas y módulos muestran retroalimentación de carga
 * sin que cada una tenga que pintarla por su cuenta.
 *
 * `pendientes` es un contador, no un booleano: varias escrituras simultáneas
 * (p. ej. el stepper de un nivel mientras se arrastra otro) no se pisan entre
 * sí — el indicador se apaga cuando termina la última.
 *
 * `visible` va aparte del contador porque el apagado se retrasa hasta cumplir
 * el mínimo visible. Manteniendo esa espera aquí, el componente que lo pinta es
 * una función pura del estado y no necesita temporizadores propios.
 */
interface CargaStore {
  pendientes: number;
  visible: boolean;
  etiqueta: string | null;
  iniciar: (etiqueta?: string) => void;
  terminar: () => void;
}

let mostradoDesde = 0;
let apagadoProgramado: ReturnType<typeof setTimeout> | null = null;

function cancelarApagado() {
  if (apagadoProgramado === null) return;
  clearTimeout(apagadoProgramado);
  apagadoProgramado = null;
}

export const useCargaStore = create<CargaStore>((set, get) => ({
  pendientes: 0,
  visible: false,
  etiqueta: null,

  iniciar(etiqueta) {
    // Una operación nueva durante la cola de apagado la cancela: el indicador
    // sigue encendido en vez de parpadear entre una escritura y la siguiente.
    cancelarApagado();
    const { pendientes, visible } = get();
    if (!visible) mostradoDesde = Date.now();
    set({
      pendientes: pendientes + 1,
      visible: true,
      etiqueta: etiqueta ?? get().etiqueta ?? "Guardando cambios",
    });
  },

  terminar() {
    const pendientes = Math.max(0, get().pendientes - 1);
    set({ pendientes });
    if (pendientes > 0) return;

    const restante = Math.max(0, MIN_VISIBLE_MS - (Date.now() - mostradoDesde));
    if (restante === 0) {
      set({ visible: false, etiqueta: null });
      return;
    }
    cancelarApagado();
    apagadoProgramado = setTimeout(() => {
      apagadoProgramado = null;
      // Otra escritura pudo empezar mientras esperábamos: entonces no se apaga.
      if (get().pendientes === 0) set({ visible: false, etiqueta: null });
    }, restante);
  },
}));

/**
 * Envuelve una operación asíncrona anunciándola en el registro global.
 * Propaga el resultado y el error tal cual: quien llama sigue decidiendo qué
 * toast mostrar.
 */
export async function conCarga<T>(
  operacion: () => Promise<T> | T,
  etiqueta?: string
): Promise<T> {
  const { iniciar, terminar } = useCargaStore.getState();
  iniciar(etiqueta);
  try {
    return await operacion();
  } finally {
    terminar();
  }
}

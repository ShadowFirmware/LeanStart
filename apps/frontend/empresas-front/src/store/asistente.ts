import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";
import { useEmpresasStore } from "./empresas";

export interface MensajeChat {
  rol: "user" | "assistant";
  contenido: string;
}

interface RespuestaAsistente {
  respuesta: string;
  empresaId: string | null;
  empresa: Record<string, unknown> | null;
  camposActualizados: string[];
}

/** Clave de conversación mientras la empresa todavía no existe. */
export const CLAVE_NUEVA_CONVERSACION = "__nueva__";

interface AsistenteStore {
  /** Historial de mensajes por conversación, clave = empresaId o `CLAVE_NUEVA_CONVERSACION`. */
  conversaciones: Record<string, MensajeChat[]>;
  enviarMensaje: (empresaId: string | null, texto: string) => Promise<{ empresaId: string | null }>;
}

export const useAsistenteStore = create<AsistenteStore>()(
  persist(
    (set, get) => ({
      conversaciones: {},

      async enviarMensaje(empresaId, texto) {
        const clave = empresaId ?? CLAVE_NUEVA_CONVERSACION;
        const historialPrevio = get().conversaciones[clave] ?? [];
        const mensajeUsuario: MensajeChat = { rol: "user", contenido: texto };
        set((state) => ({
          conversaciones: { ...state.conversaciones, [clave]: [...historialPrevio, mensajeUsuario] },
        }));

        if (modoDemo()) {
          const aviso: MensajeChat = {
            rol: "assistant",
            contenido: "El asistente necesita una cuenta real conectada al backend — no está disponible en modo demo.",
          };
          set((state) => ({
            conversaciones: { ...state.conversaciones, [clave]: [...(state.conversaciones[clave] ?? []), aviso] },
          }));
          return { empresaId };
        }

        const historialParaEnviar = [...historialPrevio, mensajeUsuario];
        const respuesta = await apiFetch<RespuestaAsistente>("/asistente/mensaje", {
          method: "POST",
          body: JSON.stringify({ empresaId, historial: historialParaEnviar }),
          etiquetaCarga: null,
        });

        const mensajeAsistente: MensajeChat = { rol: "assistant", contenido: respuesta.respuesta };

        set((state) => {
          const conversaciones = { ...state.conversaciones };
          const historialActualizado = [...(conversaciones[clave] ?? []), mensajeAsistente];
          if (respuesta.empresaId && respuesta.empresaId !== clave) {
            // La empresa se acaba de crear en este turno: migra el historial de
            // CLAVE_NUEVA_CONVERSACION a su id real para que la conversación siga.
            delete conversaciones[clave];
            conversaciones[respuesta.empresaId] = historialActualizado;
          } else {
            conversaciones[clave] = historialActualizado;
          }
          return { conversaciones };
        });

        if (respuesta.empresa) {
          useEmpresasStore.getState().sincronizarDesdeApi(respuesta.empresa);
        }

        return { empresaId: respuesta.empresaId };
      },
    }),
    { name: "leanstart-asistente", skipHydration: true }
  )
);

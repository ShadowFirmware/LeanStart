import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";

export type TipoNotificacion =
  | "comentario_mentor"
  | "cambio_emprendedor"
  | "enviado_evaluacion"
  | "proyecto_publicado"
  | "proyecto_devuelto"
  | "proyecto_asignado";

/** Rol al que va dirigida la notificación. */
export type DestinatarioNotificacion = "emprendedor" | "mentor";

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  /** Rol que debe verla. */
  destinatario: DestinatarioNotificacion;
  titulo: string;
  mensaje: string;
  empresaNombre?: string;
  leida: boolean;
  creadaEn: string;
  ts: number;
}

interface NotificacionesStore {
  notificaciones: Notificacion[];
  /** Trae mis notificaciones reales (no-op en modo demo). */
  cargarNotificaciones: () => Promise<void>;
  /** Solo existe en modo demo — no hay endpoint público para crear notificaciones (ver docs/backend-architecture.md). */
  agregarNotificacion: (notif: Omit<Notificacion, "id" | "leida" | "ts">) => void;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
}

const DEMO: Notificacion[] = [
  {
    id: "notif-1",
    tipo: "comentario_mentor",
    destinatario: "emprendedor",
    titulo: "Nuevo comentario de tu mentor",
    mensaje: "Tu mentor dejó 3 comentarios en el Lean Canvas de \"LeanStart\". Revísalos para continuar con el proceso.",
    empresaNombre: "LeanStart",
    leida: false,
    creadaEn: "Hace 2 horas",
    ts: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "notif-2",
    tipo: "enviado_evaluacion",
    destinatario: "emprendedor",
    titulo: "Proyecto enviado a evaluación",
    mensaje: "\"EcoBottle\" fue enviado al panel de evaluación tras completar satisfactoriamente el proceso de mentoría.",
    empresaNombre: "EcoBottle",
    leida: false,
    creadaEn: "Ayer",
    ts: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "notif-3",
    tipo: "proyecto_publicado",
    destinatario: "emprendedor",
    titulo: "¡Tu proyecto fue publicado!",
    mensaje: "\"StudyFlow Premium\" fue aprobado por el equipo evaluador y ya es visible en el directorio público de LeanStart.",
    empresaNombre: "StudyFlow Premium",
    leida: true,
    creadaEn: "Hace 3 días",
    ts: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: "notif-4",
    tipo: "proyecto_devuelto",
    destinatario: "emprendedor",
    titulo: "Proyecto devuelto con observaciones",
    mensaje: "\"AgroTech\" fue devuelto. El evaluador dejó comentarios que debes atender antes de reenviar el proyecto.",
    empresaNombre: "AgroTech",
    leida: true,
    creadaEn: "Hace 5 días",
    ts: Date.now() - 1000 * 60 * 60 * 120,
  },
];

/** El backend guarda `destinatarioUserId` (ya scoped a "mis" notificaciones); reconstruimos
 *  el rol solo para que el filtro por `destinatario` que ya usan las vistas siga funcionando. */
const ROL_POR_TIPO: Record<TipoNotificacion, DestinatarioNotificacion> = {
  comentario_mentor: "emprendedor",
  enviado_evaluacion: "emprendedor",
  proyecto_publicado: "emprendedor",
  proyecto_devuelto: "emprendedor",
  cambio_emprendedor: "mentor",
  proyecto_asignado: "mentor",
};

function mapNotificacion(n: Record<string, unknown>): Notificacion {
  const tipo = n.tipo as TipoNotificacion;
  return {
    id: n.id as string,
    tipo,
    destinatario: ROL_POR_TIPO[tipo] ?? "emprendedor",
    titulo: n.titulo as string,
    mensaje: n.mensaje as string,
    empresaNombre: (n.empresaNombre as string) ?? undefined,
    leida: n.leida as boolean,
    creadaEn: new Date(n.createdAt as string).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    ts: new Date(n.createdAt as string).getTime(),
  };
}

export const useNotificacionesStore = create<NotificacionesStore>()(
  persist(
    (set, get) => ({
      notificaciones: DEMO,

      async cargarNotificaciones() {
        if (modoDemo()) return;
        const notificaciones = await apiFetch<Record<string, unknown>[]>("/notificaciones");
        set({ notificaciones: notificaciones.map(mapNotificacion) });
      },

      agregarNotificacion(notif) {
        const nueva: Notificacion = {
          ...notif,
          id: crypto.randomUUID(),
          leida: false,
          ts: Date.now(),
        };
        set({ notificaciones: [nueva, ...get().notificaciones] });
      },

      async marcarLeida(id) {
        if (!modoDemo()) {
          await apiFetch(`/notificaciones/${id}/leida`, { method: "PATCH" });
        }
        set({
          notificaciones: get().notificaciones.map((n) =>
            n.id === id ? { ...n, leida: true } : n
          ),
        });
      },

      async marcarTodasLeidas() {
        if (!modoDemo()) {
          await apiFetch(`/notificaciones/leidas`, { method: "PATCH" });
        }
        set({
          notificaciones: get().notificaciones.map((n) => ({ ...n, leida: true })),
        });
      },
    }),
    // Rehidratación inicial disparada por <LiveSync/> tras montar (evita mismatch SSR).
    { name: "leanstart-notificaciones", skipHydration: true }
  )
);

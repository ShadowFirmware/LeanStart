import { getSession, signOut } from "next-auth/react";

/**
 * Interruptor de modo demo (mismo flag que `DEMO_MODE` en `./demo.ts`, expuesto
 * aquí como función para que los stores lo evalúen en cada llamada, no solo al
 * cargar el módulo).
 */
export function modoDemo(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

interface ApiError {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

// Si la sesión ya murió (expiró, o el logout por inactividad no alcanzó a redirigir),
// cada store que tenía una llamada pendiente recibía su propio 401 y lo tragaba en
// silencio (a propósito, ver LiveSync) — el resultado era un dashboard con datos viejos
// de localStorage, sin ningún aviso de que ya no hay sesión real. Un solo 401, sin
// importar qué llamada lo dispare, ahora manda a /login. El flag evita que la ráfaga
// de llamadas concurrentes (LiveSync dispara varias a la vez) llame a signOut() N veces.
let sesionExpirada = false;

interface ApiFetchOptions extends RequestInit {
  /**
   * Salta la llamada a getSession() — para endpoints públicos (@Public() en el
   * gateway) que no necesitan el token. Sin esto, hasta un visitante anónimo (que
   * nunca ha iniciado sesión) esperaba una ida-vuelta completa a next-auth antes de
   * poder pedir algo tan básico como la galería pública.
   */
  skipAuth?: boolean;
}

/**
 * Llama al api-gateway adjuntando el Bearer token de la sesión activa (si existe).
 * Lanza un Error con el mensaje real del backend cuando la respuesta no es ok,
 * en vez de un "Failed to fetch" genérico.
 */
export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const token = options?.skipAuth
    ? undefined
    : (await getSession() as { accessToken?: string } | null)?.accessToken;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401 && !sesionExpirada) {
    sesionExpirada = true;
    void signOut({ callbackUrl: "/login" });
  }

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({}));
    const mensaje = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new Error(mensaje ?? `Error ${res.status} al llamar a ${path}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Revoca el token actual en el backend (best-effort) antes de cerrar la sesión
 * local. Sin esto, un JWT robado o copiado seguiría siendo válido hasta que
 * expira por sí solo, aunque el usuario ya haya cerrado sesión.
 */
export async function cerrarSesionBackend(): Promise<void> {
  if (modoDemo()) return;
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
}

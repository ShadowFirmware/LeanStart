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

// Punto único de cierre de sesión: además del 401 de aquí abajo, el botón "Cerrar
// sesión" de cada sidebar y el logout por inactividad TAMBIÉN llaman a esta función
// en vez de invocar signOut() por su cuenta. Sin este guard compartido, dos de esos
// caminos disparándose casi al mismo tiempo (p. ej. el temporizador de inactividad
// justo cuando una llamada de fondo recibe 401) volvían a llamar a signOut() dos
// veces en paralelo — el mismo tipo de carrera que causó el incidente de sesión
// anterior. Con el guard, sin importar quién lo dispare primero, solo se ejecuta una vez.
let sesionCerrandose = false;

export function cerrarSesionUnaVez(): void {
  if (sesionCerrandose) return;
  sesionCerrandose = true;
  void signOut({ callbackUrl: "/login" });
}

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

  if (res.status === 401) {
    cerrarSesionUnaVez();
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

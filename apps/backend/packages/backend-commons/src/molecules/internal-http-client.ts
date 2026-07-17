import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { INTERNAL_KEY_HEADER, USER_ID_HEADER, USER_PRIVILEGIOS_HEADER, USER_ROL_HEADER } from "../atoms/auth-user";
import type { AuthUser } from "../atoms/auth-user";

/**
 * Cliente mínimo (fetch nativo de Node) para llamadas servicio-a-servicio,
 * p. ej. evaluaciones-service pidiendo una empresa a empresas-service, o
 * cualquier servicio notificando a notificaciones-service. Siempre adjunta
 * la llave interna; opcionalmente propaga la identidad del usuario final
 * cuando la operación es "en representación de" alguien (p. ej. el saga de
 * finalizar evaluación actúa como el evaluador que la disparó).
 */
@Injectable()
export class InternalHttpClient {
  private readonly internalKey = process.env.INTERNAL_KEY ?? "";

  private headers(actingAs?: AuthUser): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [INTERNAL_KEY_HEADER]: this.internalKey,
    };
    if (actingAs) {
      headers[USER_ID_HEADER] = actingAs.id;
      headers[USER_ROL_HEADER] = actingAs.rol;
      headers[USER_PRIVILEGIOS_HEADER] = JSON.stringify(actingAs.privilegios ?? []);
    }
    return headers;
  }

  async get<T>(url: string, actingAs?: AuthUser): Promise<T> {
    const res = await fetch(url, { method: "GET", headers: this.headers(actingAs) });
    return this.parse<T>(res);
  }

  async post<T>(url: string, body: unknown, actingAs?: AuthUser): Promise<T> {
    const res = await fetch(url, { method: "POST", headers: this.headers(actingAs), body: JSON.stringify(body) });
    return this.parse<T>(res);
  }

  async patch<T>(url: string, body: unknown, actingAs?: AuthUser): Promise<T> {
    const res = await fetch(url, { method: "PATCH", headers: this.headers(actingAs), body: JSON.stringify(body) });
    return this.parse<T>(res);
  }

  async delete<T>(url: string, actingAs?: AuthUser): Promise<T> {
    const res = await fetch(url, { method: "DELETE", headers: this.headers(actingAs) });
    return this.parse<T>(res);
  }

  /**
   * Si el servicio interno respondió con un error "de negocio" (401/403/404/409/400...),
   * lo reenviamos tal cual (mismo status y body) en vez de convertirlo en un 500 genérico —
   * de lo contrario un login inválido o una transición de estado inválida se verían como
   * "Error interno del servidor" en vez del mensaje real.
   */
  private async parse<T>(res: Response): Promise<T> {
    const body = await res.json().catch(() => undefined);
    if (!res.ok) {
      throw new HttpException(body ?? `Llamada interna falló (${res.status} ${res.url})`, res.status || HttpStatus.BAD_GATEWAY);
    }
    return body as T;
  }
}

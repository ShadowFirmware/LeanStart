import { Injectable } from "@nestjs/common";
import { InternalHttpClient, type AuthUser } from "@leanstart/backend-commons";

/**
 * Reenvía peticiones ya autenticadas a un microservicio interno, propagando
 * la identidad validada (headers de confianza) y la llave interna. Los
 * controllers del gateway son explícitos por dominio (no hay un wildcard
 * ciego) para que Scalar documente cada ruta pública real.
 */
@Injectable()
export class ProxyService {
  constructor(private readonly http: InternalHttpClient) {}

  get<T>(baseUrl: string, path: string, actingAs?: AuthUser) {
    return this.http.get<T>(`${baseUrl}${path}`, actingAs);
  }

  post<T>(baseUrl: string, path: string, body: unknown, actingAs?: AuthUser) {
    return this.http.post<T>(`${baseUrl}${path}`, body, actingAs);
  }

  patch<T>(baseUrl: string, path: string, body: unknown, actingAs?: AuthUser) {
    return this.http.patch<T>(`${baseUrl}${path}`, body, actingAs);
  }

  delete<T>(baseUrl: string, path: string, actingAs?: AuthUser) {
    return this.http.delete<T>(`${baseUrl}${path}`, actingAs);
  }

  postFile<T>(
    baseUrl: string,
    path: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    actingAs?: AuthUser
  ) {
    return this.http.postFile<T>(`${baseUrl}${path}`, file, actingAs);
  }
}

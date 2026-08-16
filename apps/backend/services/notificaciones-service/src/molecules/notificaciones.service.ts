import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "./email.service";
import type { CreateNotificacionDto } from "../atoms/notificacion.dto";

interface UsuarioInterno {
  id: string;
  nombre: string;
  correo: string;
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: InternalHttpClient,
    private readonly email: EmailService
  ) {}

  async listarDeUsuario(userId: string) {
    return this.prisma.notificacion.findMany({
      where: { destinatarioUserId: userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Si ya hay una notificación sin leer del mismo tipo+empresa+destinatario, no crea
   * otra — evita el spam de "el emprendedor atendió un comentario" repetida una vez
   * por cada observación que marque, cuando en realidad es un solo aviso: "hay
   * cambios pendientes de revisar en esta empresa".
   */
  async crear(dto: CreateNotificacionDto) {
    if (dto.empresaId) {
      const existente = await this.prisma.notificacion.findFirst({
        where: {
          destinatarioUserId: dto.destinatarioUserId,
          empresaId: dto.empresaId,
          tipo: dto.tipo,
          leida: false,
        },
      });
      if (existente) return existente;
    }
    const notificacion = await this.prisma.notificacion.create({ data: dto });
    void this.enviarCorreo(dto);
    return notificacion;
  }

  // Todo el cuerpo va en el try (no solo la llamada HTTP): un error leyendo la config
  // (p. ej. AUTH_SERVICE_URL sin definir) es síncrono y ocurre ANTES del await, así
  // que un .catch() encadenado solo a la promesa no lo alcanza a cubrir. El correo es
  // best-effort — nunca debe tumbar la creación de la notificación, y se llama sin
  // await para no demorar la respuesta al servicio que la disparó.
  private async enviarCorreo(dto: CreateNotificacionDto) {
    try {
      const authUrl = this.config.getOrThrow<string>("AUTH_SERVICE_URL");
      const usuario = await this.http.get<UsuarioInterno | null>(`${authUrl}/usuarios/${dto.destinatarioUserId}/interno`);
      if (!usuario?.correo) return;
      await this.email.enviarNotificacion(usuario.correo, dto);
    } catch (err) {
      this.logger.warn(`No se pudo mandar el correo de la notificación a ${dto.destinatarioUserId} (tipo=${dto.tipo}): ${err instanceof Error ? err.message : err}`);
    }
  }

  async marcarLeida(userId: string, id: string) {
    const notif = await this.prisma.notificacion.findUnique({ where: { id } });
    if (!notif || notif.destinatarioUserId !== userId) {
      throw new NotFoundException("Notificación no encontrada.");
    }
    return this.prisma.notificacion.update({ where: { id }, data: { leida: true } });
  }

  async marcarTodasLeidas(userId: string) {
    await this.prisma.notificacion.updateMany({
      where: { destinatarioUserId: userId, leida: false },
      data: { leida: true },
    });
    return { ok: true };
  }
}

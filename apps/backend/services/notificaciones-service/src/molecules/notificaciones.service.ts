import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateNotificacionDto } from "../atoms/notificacion.dto";

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.notificacion.create({ data: dto });
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

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

  async crear(dto: CreateNotificacionDto) {
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

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { RegistrarBitacoraDto } from "../atoms/bitacora.dto";

export interface FiltrosBitacora {
  servicio?: string;
  accion?: string;
  actorUserId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class BitacoraService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(actorUserId: string, dto: RegistrarBitacoraDto) {
    return this.prisma.bitacora.create({ data: { actorUserId, ...dto } });
  }

  async listar(filtros: FiltrosBitacora) {
    const page = Math.max(1, filtros.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filtros.pageSize ?? 25));

    const where = {
      ...(filtros.servicio ? { servicio: filtros.servicio } : {}),
      ...(filtros.accion ? { accion: filtros.accion } : {}),
      ...(filtros.actorUserId ? { actorUserId: filtros.actorUserId } : {}),
      ...(filtros.desde || filtros.hasta
        ? {
            createdAt: {
              ...(filtros.desde ? { gte: new Date(filtros.desde) } : {}),
              ...(filtros.hasta ? { lte: new Date(filtros.hasta) } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.bitacora.count({ where }),
      this.prisma.bitacora.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { nombre: true, correo: true } } },
      }),
    ]);

    return { items, total, page, pageSize };
  }
}

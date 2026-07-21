import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthUser } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EmpresasService } from "./empresas.service";

@Injectable()
export class ReportesEmpresaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresas: EmpresasService
  ) {}

  /** Cualquiera con acceso a la empresa puede reportarla, salvo su propio dueño. */
  async crear(user: AuthUser, empresaId: string, autorNombre: string, motivo: string) {
    const empresa = await this.empresas.obtener(user, empresaId);
    if (empresa.ownerId === user.id) {
      throw new ForbiddenException("No puedes reportar tu propia empresa.");
    }
    return this.prisma.reporteEmpresa.create({
      data: { empresaId, autorId: user.id, autorNombre, motivo },
    });
  }

  /** Historial de reportes de una empresa puntual (uso administrativo). */
  async listarDeEmpresa(user: AuthUser, empresaId: string) {
    await this.empresas.obtener(user, empresaId);
    return this.prisma.reporteEmpresa.findMany({ where: { empresaId }, orderBy: { createdAt: "desc" } });
  }

  /** Todos los reportes pendientes de todas las empresas (uso exclusivo del administrador). */
  async listarTodos(user: AuthUser) {
    if (user.rol !== "administrador") {
      throw new ForbiddenException("Solo el administrador puede ver todos los reportes.");
    }
    return this.prisma.reporteEmpresa.findMany({
      orderBy: { createdAt: "desc" },
      include: { empresa: { select: { nombre: true, ownerId: true } } },
    });
  }
}

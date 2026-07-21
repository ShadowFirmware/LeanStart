import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser, EstadoHipotesis } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EmpresasService } from "./empresas.service";
import type { CreateHipotesisDto, ExperimentoDisenoDto, ResultadosHipotesisDto, UpdateHipotesisDto } from "../atoms/hipotesis.dto";

const MAX_HIPOTESIS_POR_EMPRESA = 3;

@Injectable()
export class HipotesisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresas: EmpresasService
  ) {}

  async crear(user: AuthUser, empresaId: string, dto: CreateHipotesisDto) {
    await this.empresas.obtener(user, empresaId);
    const total = await this.prisma.hipotesis.count({ where: { empresaId } });
    if (total >= MAX_HIPOTESIS_POR_EMPRESA) {
      throw new BadRequestException(`Cada empresa admite máximo ${MAX_HIPOTESIS_POR_EMPRESA} hipótesis.`);
    }
    return this.prisma.hipotesis.create({
      data: { ...dto, empresaId, fase: 1, estado: "pendiente_validacion" },
    });
  }

  async actualizar(user: AuthUser, empresaId: string, id: string, dto: UpdateHipotesisDto) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, id);
    return this.prisma.hipotesis.update({ where: { id }, data: dto });
  }

  async actualizarExperimento(user: AuthUser, empresaId: string, id: string, dto: ExperimentoDisenoDto) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, id);
    return this.prisma.hipotesis.update({ where: { id }, data: { experimento: dto as object, fase: 2 } });
  }

  async actualizarResultados(user: AuthUser, empresaId: string, id: string, dto: ResultadosHipotesisDto) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, id);
    return this.prisma.hipotesis.update({ where: { id }, data: { resultados: dto as object, fase: 3 } });
  }

  async validar(user: AuthUser, empresaId: string, id: string, estado: EstadoHipotesis) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, id);
    return this.prisma.hipotesis.update({ where: { id }, data: { estado } });
  }

  async eliminar(user: AuthUser, empresaId: string, id: string) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, id);
    await this.prisma.hipotesis.delete({ where: { id } });

    // Misma razón que en productos: sin esto, una observación sobre una hipótesis
    // eliminada queda huérfana e imposible de marcar como atendida.
    await this.prisma.observacion.updateMany({
      where: { empresaId, tipoElemento: "hipotesis", elementoId: id, estado: { not: "cerrada" } },
      data: { estado: "cerrada" },
    });

    return { ok: true };
  }

  private async assertPertenece(empresaId: string, id: string) {
    const hipotesis = await this.prisma.hipotesis.findUnique({ where: { id } });
    if (!hipotesis || hipotesis.empresaId !== empresaId) {
      throw new NotFoundException("Hipótesis no encontrada en esta empresa.");
    }
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateCriterioDto, EditarCriterioDto } from "../atoms/criterio.dto";

@Injectable()
export class CriteriosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.criterio.findMany();
  }

  crear(dto: CreateCriterioDto) {
    return this.prisma.criterio.create({ data: dto });
  }

  editar(id: string, dto: EditarCriterioDto) {
    return this.prisma.criterio.update({ where: { id }, data: dto });
  }

  actualizarPeso(id: string, peso: number) {
    return this.prisma.criterio.update({ where: { id }, data: { peso } });
  }

  async eliminar(id: string) {
    await this.prisma.criterio.delete({ where: { id } });
    return { ok: true };
  }
}

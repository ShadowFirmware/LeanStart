import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { RegistrarReporteDto } from "../atoms/reporte-generado.dto";

@Injectable()
export class ReportesGeneradosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.reporteGenerado.findMany({ orderBy: { generadoEn: "desc" } });
  }

  registrar(dto: RegistrarReporteDto) {
    return this.prisma.reporteGenerado.create({ data: dto });
  }
}

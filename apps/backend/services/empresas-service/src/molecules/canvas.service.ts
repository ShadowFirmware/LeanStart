import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmpresasService } from "./empresas.service";
import type { UpdateCanvasDto } from "../atoms/canvas.dto";
import type { AuthUser } from "@leanstart/backend-commons";

/** Cuenta bloques con contenido — idéntico a `actualizarCanvas` en el store del front. */
function contarBloquesCompletados(canvas: {
  problema: string[];
  solucion: string;
  pvp: string;
  ventajaInjusta: string;
  segmentosClientes: string[];
  metricasClave: string[];
  canales: string[];
  estructuraCostos: string[];
  fuentesIngresos: string[];
}): number {
  const tieneTexto = (v: string) => !!v.trim();
  const tieneAlguno = (arr: string[]) => arr.some((v) => v.trim());
  return [
    tieneAlguno(canvas.problema),
    tieneTexto(canvas.solucion),
    tieneTexto(canvas.pvp),
    tieneTexto(canvas.ventajaInjusta),
    tieneAlguno(canvas.segmentosClientes),
    tieneAlguno(canvas.metricasClave),
    tieneAlguno(canvas.canales),
    tieneAlguno(canvas.estructuraCostos),
    tieneAlguno(canvas.fuentesIngresos),
  ].filter(Boolean).length;
}

@Injectable()
export class CanvasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresas: EmpresasService
  ) {}

  async actualizar(user: AuthUser, empresaId: string, dto: UpdateCanvasDto) {
    const empresa = await this.empresas.obtener(user, empresaId);
    const actual = empresa.canvas;

    const nuevo = {
      problema: dto.problema ?? actual?.problema ?? [],
      solucion: dto.solucion ?? actual?.solucion ?? "",
      pvp: dto.pvp ?? actual?.pvp ?? "",
      ventajaInjusta: dto.ventajaInjusta ?? actual?.ventajaInjusta ?? "",
      segmentosClientes: dto.segmentosClientes ?? actual?.segmentosClientes ?? [],
      metricasClave: dto.metricasClave ?? actual?.metricasClave ?? [],
      canales: dto.canales ?? actual?.canales ?? [],
      estructuraCostos: dto.estructuraCostos ?? actual?.estructuraCostos ?? [],
      fuentesIngresos: dto.fuentesIngresos ?? actual?.fuentesIngresos ?? [],
    };

    const canvasBloques = contarBloquesCompletados(nuevo);

    const [canvas] = await this.prisma.$transaction([
      this.prisma.canvas.upsert({
        where: { empresaId },
        create: { empresaId, ...nuevo },
        update: nuevo,
      }),
      this.prisma.empresa.update({ where: { id: empresaId }, data: { canvasBloques } }),
    ]);

    return canvas;
  }
}

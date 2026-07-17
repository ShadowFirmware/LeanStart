import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser, EstadoEmpresa } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EstadoEmpresaService } from "./estado-empresa.service";
import { puedeVerEmpresa, whereScope } from "./scope";
import type { CreateEmpresaDto, UpdateEmpresaDto } from "../atoms/empresa.dto";

const DEFAULT_CANVAS = {
  problema: [] as string[],
  solucion: "",
  pvp: "",
  ventajaInjusta: "",
  segmentosClientes: [] as string[],
  metricasClave: [] as string[],
  canales: [] as string[],
  estructuraCostos: [] as string[],
  fuentesIngresos: [] as string[],
};

const INCLUDE_DETALLE = {
  canvas: true,
  productos: true,
  hipotesis: true,
} as const;

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadoService: EstadoEmpresaService
  ) {}

  async listar(user: AuthUser) {
    return this.prisma.empresa.findMany({
      where: whereScope(user),
      include: INCLUDE_DETALLE,
      orderBy: { createdAt: "desc" },
    });
  }

  async listarPublicas() {
    return this.prisma.empresa.findMany({
      where: { estado: "publicado" },
      orderBy: { updatedAt: "desc" },
    });
  }

  async obtener(user: AuthUser, id: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id }, include: INCLUDE_DETALLE });
    if (!empresa) throw new NotFoundException("Empresa no encontrada.");
    if (!puedeVerEmpresa(user, empresa)) {
      throw new ForbiddenException("No tienes acceso a esta empresa.");
    }
    return empresa;
  }

  /** Variante sin scoping de usuario, para llamadas internas de otros servicios (p. ej. evaluaciones-service). */
  async obtenerInterno(id: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id }, include: INCLUDE_DETALLE });
    if (!empresa) throw new NotFoundException("Empresa no encontrada.");
    return empresa;
  }

  async crear(user: AuthUser, dto: CreateEmpresaDto) {
    return this.prisma.empresa.create({
      data: {
        ...dto,
        ownerId: user.id,
        canvas: { create: DEFAULT_CANVAS },
      },
      include: INCLUDE_DETALLE,
    });
  }

  async actualizar(user: AuthUser, id: string, dto: UpdateEmpresaDto) {
    await this.obtener(user, id);
    return this.prisma.empresa.update({ where: { id }, data: dto, include: INCLUDE_DETALLE });
  }

  async eliminar(user: AuthUser, id: string) {
    await this.obtener(user, id);
    await this.prisma.empresa.delete({ where: { id } });
    return { ok: true };
  }

  async cambiarEstado(user: AuthUser, id: string, estado: EstadoEmpresa) {
    const empresa = await this.obtener(user, id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, estado);
    return this.prisma.empresa.update({ where: { id }, data: { estado } });
  }

  /** Usado por el saga de finalizar evaluación (evaluaciones-service), sin scoping de usuario. */
  async cambiarEstadoInterno(id: string, estado: EstadoEmpresa, scoreFinal?: number) {
    const empresa = await this.obtenerInterno(id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, estado);
    return this.prisma.empresa.update({
      where: { id },
      data: { estado, ...(scoreFinal !== undefined ? { scoreFinal } : {}) },
    });
  }

  async asignarMentor(user: AuthUser, id: string, mentorId: string) {
    const empresa = await this.obtener(user, id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "en_mentoria");
    return this.prisma.empresa.update({ where: { id }, data: { mentorId, estado: "en_mentoria" } });
  }

  async asignarEvaluador(user: AuthUser, id: string, evaluadorId: string) {
    const empresa = await this.obtener(user, id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "en_evaluacion");
    return this.prisma.empresa.update({ where: { id }, data: { evaluadorId, estado: "en_evaluacion" } });
  }
}

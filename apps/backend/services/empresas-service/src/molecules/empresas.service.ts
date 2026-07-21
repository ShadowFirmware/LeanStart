import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalHttpClient, type AuthUser, type EstadoEmpresa } from "@leanstart/backend-commons";
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
  private readonly logger = new Logger(EmpresasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly estadoService: EstadoEmpresaService,
    private readonly http: InternalHttpClient,
    private readonly config: ConfigService
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
    const actualizada = await this.prisma.empresa.update({ where: { id }, data: { mentorId, estado: "en_mentoria" } });

    await this.notificar(mentorId, {
      tipo: "proyecto_asignado",
      titulo: "Te asignaron un nuevo proyecto",
      mensaje: `"${empresa.nombre}" ahora está bajo tu mentoría.`,
      empresaNombre: empresa.nombre,
    });

    return actualizada;
  }

  async asignarEvaluador(user: AuthUser, id: string, evaluadorId: string) {
    const empresa = await this.obtener(user, id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "en_evaluacion");
    return this.prisma.empresa.update({ where: { id }, data: { evaluadorId, estado: "en_evaluacion" } });
  }

  private async notificar(destinatarioUserId: string, data: { tipo: string; titulo: string; mensaje: string; empresaNombre: string }) {
    const baseUrl = this.config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");
    await this.http.post(`${baseUrl}/notificaciones`, { destinatarioUserId, ...data }).catch((err) => {
      this.logger.warn(`No se pudo notificar a ${destinatarioUserId} (tipo=${data.tipo}): ${err instanceof Error ? err.message : err}`);
    });
  }
}

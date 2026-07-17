import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalHttpClient, type AuthUser, type EstadoEmpresa, type EstadoObservacion } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EmpresasService } from "./empresas.service";
import { EstadoEmpresaService } from "./estado-empresa.service";
import type { CreateObservacionDto } from "../atoms/observacion.dto";

const ESTADOS_MENTORIA = ["en_mentoria", "observaciones_pendientes", "observaciones_atendidas"];

@Injectable()
export class ObservacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresas: EmpresasService,
    private readonly estadoService: EstadoEmpresaService,
    private readonly http: InternalHttpClient,
    private readonly config: ConfigService
  ) {}

  async listarDeEmpresa(user: AuthUser, empresaId: string) {
    await this.empresas.obtener(user, empresaId);
    return this.prisma.observacion.findMany({ where: { empresaId }, orderBy: { createdAt: "desc" } });
  }

  async crear(user: AuthUser, empresaId: string, autorNombre: string, dto: CreateObservacionDto) {
    const empresa = await this.empresas.obtener(user, empresaId);

    const observacion = await this.prisma.observacion.create({
      data: { ...dto, empresaId, autorId: user.id, autorNombre, estado: "pendiente" },
    });

    // El mentor comentando mueve el proyecto a "observaciones_pendientes" para que el
    // emprendedor sepa que tiene correcciones por revisar (colaboración en vivo).
    if (user.rol === "mentor" && ESTADOS_MENTORIA.includes(empresa.estado)) {
      if (empresa.estado !== "observaciones_pendientes") {
        this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "observaciones_pendientes");
        await this.prisma.empresa.update({ where: { id: empresaId }, data: { estado: "observaciones_pendientes" } });
      }
      await this.notificar(empresa.ownerId, {
        tipo: "comentario_mentor",
        titulo: "Nuevo comentario de tu mentor",
        mensaje: `Tu mentor dejó un comentario en "${empresa.nombre}".`,
        empresaNombre: empresa.nombre,
      });
    }

    return observacion;
  }

  async actualizarEstado(user: AuthUser, empresaId: string, id: string, estado: EstadoObservacion) {
    const empresa = await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, id);
    const actualizada = await this.prisma.observacion.update({ where: { id }, data: { estado } });

    // El emprendedor marcando "en revisión" avisa al mentor que ya hay cambios que revisar
    // (espejo de la notificación que `crear` ya dispara en la dirección mentor→emprendedor).
    if (estado === "en_revision" && empresa.mentorId) {
      await this.notificar(empresa.mentorId, {
        tipo: "cambio_emprendedor",
        titulo: "El emprendedor atendió un comentario",
        mensaje: `Hay cambios pendientes de revisar en "${empresa.nombre}".`,
        empresaNombre: empresa.nombre,
      });
    }

    return actualizada;
  }

  /** El emprendedor marca que ya corrigió: notifica al mentor y avanza el estado del proyecto. */
  async marcarAtendidas(user: AuthUser, empresaId: string) {
    const empresa = await this.empresas.obtener(user, empresaId);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "observaciones_atendidas");

    await this.prisma.$transaction([
      this.prisma.observacion.updateMany({
        where: { empresaId, estado: { not: "cerrada" } },
        data: { estado: "atendida" },
      }),
      this.prisma.empresa.update({ where: { id: empresaId }, data: { estado: "observaciones_atendidas" } }),
    ]);

    if (empresa.mentorId) {
      await this.notificar(empresa.mentorId, {
        tipo: "cambio_emprendedor",
        titulo: "El emprendedor atendió tus observaciones",
        mensaje: `"${empresa.nombre}" fue actualizado en respuesta a tus comentarios.`,
        empresaNombre: empresa.nombre,
      });
    }
    return { ok: true };
  }

  async cerrarDeEmpresa(user: AuthUser, empresaId: string) {
    await this.empresas.obtener(user, empresaId);
    await this.prisma.observacion.updateMany({
      where: { empresaId, estado: { not: "cerrada" } },
      data: { estado: "cerrada" },
    });
    return { ok: true };
  }

  async eliminar(user: AuthUser, empresaId: string, id: string) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, id);
    await this.prisma.observacion.delete({ where: { id } });
    return { ok: true };
  }

  private async assertPertenece(empresaId: string, id: string) {
    const observacion = await this.prisma.observacion.findUnique({ where: { id } });
    if (!observacion || observacion.empresaId !== empresaId) {
      throw new NotFoundException("Observación no encontrada en esta empresa.");
    }
  }

  private async notificar(destinatarioUserId: string, data: { tipo: string; titulo: string; mensaje: string; empresaNombre: string }) {
    const baseUrl = this.config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");
    await this.http.post(`${baseUrl}/notificaciones`, { destinatarioUserId, ...data }).catch(() => undefined);
  }
}

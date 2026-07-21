import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalHttpClient, type AuthUser, type EstadoEmpresa, type EstadoObservacion } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EmpresasService } from "./empresas.service";
import { EstadoEmpresaService } from "./estado-empresa.service";
import type { CreateObservacionDto } from "../atoms/observacion.dto";

const ESTADOS_MENTORIA = ["en_mentoria", "observaciones_pendientes", "observaciones_atendidas"];

@Injectable()
export class ObservacionesService {
  private readonly logger = new Logger(ObservacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly empresas: EmpresasService,
    private readonly estadoService: EstadoEmpresaService,
    private readonly http: InternalHttpClient,
    private readonly config: ConfigService
  ) {}

  async listarDeEmpresa(user: AuthUser, empresaId: string) {
    await this.empresas.obtener(user, empresaId);
    const observaciones = await this.prisma.observacion.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
    });
    // Un borrador es invisible para todos salvo su propio autor (el mentor que
    // todavía no envía su retroalimentación) — así el emprendedor nunca ve
    // comentarios a medio escribir.
    return observaciones.filter((o) => o.estado !== "borrador" || o.autorId === user.id);
  }

  /**
   * El mentor deja la observación como "borrador": no la ve el emprendedor, no
   * mueve el estado del proyecto ni notifica todavía — eso pasa recién cuando
   * el mentor llama a `enviarRetroalimentacion`, para que pueda dejar varios
   * comentarios sueltos (en distintos bloques/productos) y mandarlos juntos.
   */
  async crear(user: AuthUser, empresaId: string, autorNombre: string, dto: CreateObservacionDto) {
    await this.empresas.obtener(user, empresaId);
    const esBorrador = user.rol === "mentor";

    return this.prisma.observacion.create({
      data: { ...dto, empresaId, autorId: user.id, autorNombre, estado: esBorrador ? "borrador" : "pendiente" },
    });
  }

  /** El mentor envía todos sus borradores de esta empresa de una vez: recién ahí se hacen visibles, se avanza el estado del proyecto y se notifica al emprendedor. */
  async enviarRetroalimentacion(user: AuthUser, empresaId: string) {
    const empresa = await this.empresas.obtener(user, empresaId);

    const { count } = await this.prisma.observacion.updateMany({
      where: { empresaId, autorId: user.id, estado: "borrador" },
      data: { estado: "pendiente" },
    });
    if (count === 0) return { ok: true, enviadas: 0 };

    // Efecto secundario best-effort: la retroalimentación ya quedó visible arriba,
    // que falle mover el estado o notificar no debe reportarse como error al mentor.
    try {
      if (ESTADOS_MENTORIA.includes(empresa.estado) && empresa.estado !== "observaciones_pendientes") {
        this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "observaciones_pendientes");
        await this.prisma.empresa.update({ where: { id: empresaId }, data: { estado: "observaciones_pendientes" } });
      }
      await this.notificar(empresa.ownerId, {
        tipo: "comentario_mentor",
        titulo: "Nuevo comentario de tu mentor",
        mensaje: `Tu mentor dejó retroalimentación en "${empresa.nombre}".`,
        empresaNombre: empresa.nombre,
      });
    } catch {
      // best-effort
    }

    return { ok: true, enviadas: count };
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

  // Todo el cuerpo va en el try (no solo la llamada HTTP): un error leyendo la config
  // (p. ej. NOTIFICACIONES_SERVICE_URL sin definir) es síncrono y ocurre ANTES del
  // await, así que un .catch() encadenado solo a la promesa no lo alcanza a cubrir.
  // Notificar es best-effort en todos los call sites — nunca debe tumbar la operación
  // principal (guardar la observación, cambiar el estado, etc.).
  private async notificar(destinatarioUserId: string, data: { tipo: string; titulo: string; mensaje: string; empresaNombre: string }) {
    try {
      const baseUrl = this.config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");
      await this.http.post(`${baseUrl}/notificaciones`, { destinatarioUserId, ...data });
    } catch (err) {
      this.logger.warn(`No se pudo notificar a ${destinatarioUserId} (tipo=${data.tipo}): ${err instanceof Error ? err.message : err}`);
    }
  }
}

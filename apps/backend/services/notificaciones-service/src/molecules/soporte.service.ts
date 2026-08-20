import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InternalHttpClient, type AuthUser } from "@leanstart/backend-commons";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import type { EstadoReporte, ReporteSoporteDto } from "../atoms/soporte.dto";

interface UsuarioInterno {
  id: string;
  nombre: string;
  correo: string;
}

/**
 * Buzón de soporte técnico: el reporte se guarda y se lee desde
 * /administrador/soporte. No manda correo — el intento de avisar por Resend se
 * quitó porque sin credenciales solo producía errores en el log y no aportaba
 * nada que el buzón no muestre ya.
 *
 * El nombre y el correo de quien reporta se piden a auth-service (mismo
 * endpoint interno que usa NotificacionesService) en vez de aceptarlos del
 * cliente: así nadie puede reportar haciéndose pasar por otro, y el
 * administrador sabe a quién contestarle.
 */
@Injectable()
export class SoporteService {
  private readonly logger = new Logger(SoporteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: InternalHttpClient
  ) {}

  async reportar(dto: ReporteSoporteDto, user: AuthUser): Promise<{ ok: true; id: string }> {
    const autor = await this.buscarAutor(user.id);

    const reporte = await this.prisma.reporteSoporte.create({
      data: {
        autorUserId: user.id,
        autorNombre: autor?.nombre ?? "(nombre no disponible)",
        autorCorreo: autor?.correo ?? "(correo no disponible)",
        autorRoles: user.roles?.length ? user.roles : [user.rol],
        asunto: dto.asunto,
        mensaje: dto.mensaje,
        navegador: dto.navegador,
      },
    });

    this.logger.log(`Reporte de soporte de ${user.id}: ${dto.asunto}`);
    return { ok: true, id: reporte.id };
  }

  /**
   * Buzón del administrador, el más reciente primero. No se ordena por estado —
   * "atendido" va antes que "nuevo" alfabéticamente, así que hacerlo dejaría lo
   * pendiente hasta abajo; la vista ya arranca filtrando por estado.
   */
  async listar() {
    const reportes = await this.prisma.reporteSoporte.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { items: reportes };
  }

  async actualizarEstado(id: string, estado: EstadoReporte) {
    const existente = await this.prisma.reporteSoporte.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException("El reporte no existe.");

    return this.prisma.reporteSoporte.update({
      where: { id },
      // atendidoEn se limpia al reabrir: si no, un reporte reabierto seguiría
      // mostrando la fecha en que se cerró la vez pasada.
      data: { estado, atendidoEn: estado === "atendido" ? new Date() : null },
    });
  }

  private async buscarAutor(userId: string): Promise<UsuarioInterno | null> {
    try {
      const authUrl = this.config.getOrThrow<string>("AUTH_SERVICE_URL");
      return await this.http.get<UsuarioInterno | null>(`${authUrl}/usuarios/${userId}/interno`);
    } catch (err) {
      this.logger.warn(
        `No se pudo resolver el autor ${userId} del reporte de soporte: ${err instanceof Error ? err.message : err}`
      );
      return null;
    }
  }
}

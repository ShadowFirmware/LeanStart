import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { EventoCorreoEntranteDto } from "../atoms/correo-entrante.dto";

@Injectable()
export class CorreosEntrantesService {
  private readonly logger = new Logger(CorreosEntrantesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarda el metadata del correo recibido — idempotente por `resendId`, porque
   * Resend reintenta el webhook si no responde 200 a tiempo. El cuerpo y los
   * adjuntos NO se guardan todavía: eso se agrega cuando exista el flujo real
   * (soporte técnico / reportar empresa) que sepa qué hacer con cada uno.
   */
  async registrar(evento: EventoCorreoEntranteDto) {
    if (evento.type !== "email.received") {
      this.logger.warn(`Evento de Resend ignorado (type=${evento.type})`);
      return { ok: true, guardado: false };
    }

    const existente = await this.prisma.correoEntrante.findUnique({ where: { resendId: evento.data.email_id } });
    if (existente) return { ok: true, guardado: false };

    await this.prisma.correoEntrante.create({
      data: {
        resendId: evento.data.email_id,
        remitente: evento.data.from,
        destinatarios: evento.data.to,
        asunto: evento.data.subject,
        recibidoEn: new Date(evento.created_at),
      },
    });
    return { ok: true, guardado: true };
  }
}

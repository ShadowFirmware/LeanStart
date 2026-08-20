import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "./email.service";
import type { EventoCorreoEntranteDto } from "../atoms/correo-entrante.dto";

/** `reporte-<uuid>@lo-que-sea` — la dirección de hilo que arma EmailService. */
const DIRECCION_DE_HILO = /^reporte-([0-9a-f-]{36})@/i;

@Injectable()
export class CorreosEntrantesService {
  private readonly logger = new Logger(CorreosEntrantesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  /**
   * Guarda el correo recibido — idempotente por `resendId`, porque Resend
   * reintenta el webhook si no responde 200 a tiempo.
   *
   * Si venía dirigido a `reporte-<id>@…`, además queda enganchado a ese reporte
   * (aparece como respuesta en el hilo del buzón) y se reenvía a la otra parte
   * de la conversación. Lo que llegue a cualquier otra dirección se guarda
   * igual, sin enganchar: perder un correo por no saber de qué era es peor que
   * tener filas sueltas en la tabla.
   */
  async registrar(evento: EventoCorreoEntranteDto) {
    if (evento.type !== "email.received") {
      this.logger.warn(`Evento de Resend ignorado (type=${evento.type})`);
      return { ok: true, guardado: false };
    }

    // Nuestro propio eco: SOPORTE_EMAIL vive en el dominio de recepción, así que
    // el aviso que le mandamos a la casilla vuelve a entrar por aquí. Archivarlo
    // llenaría el buzón de copias de lo que ya está en la tabla de reportes.
    if (extraerDireccion(evento.data.from).toLowerCase() === this.email.direccionDeEnvio) {
      this.logger.debug(`Correo propio ignorado (${evento.data.subject})`);
      return { ok: true, guardado: false };
    }

    const existente = await this.prisma.correoEntrante.findUnique({ where: { resendId: evento.data.email_id } });
    if (existente) return { ok: true, guardado: false };

    const cuerpo = evento.data.text?.trim() || null;
    const reporte = await this.reporteDelHilo(evento.data.to);

    await this.prisma.correoEntrante.create({
      data: {
        resendId: evento.data.email_id,
        remitente: evento.data.from,
        destinatarios: evento.data.to,
        asunto: evento.data.subject,
        recibidoEn: new Date(evento.created_at),
        cuerpo,
        reporteId: reporte?.id,
        procesado: !!reporte,
      },
    });

    if (reporte && cuerpo) await this.reenviar(reporte, evento.data.from, cuerpo);

    return { ok: true, guardado: true, reporteId: reporte?.id };
  }

  private async reporteDelHilo(destinatarios: string[]) {
    for (const destinatario of destinatarios) {
      const id = DIRECCION_DE_HILO.exec(extraerDireccion(destinatario))?.[1];
      if (!id) continue;
      const reporte = await this.prisma.reporteSoporte.findUnique({ where: { id } });
      if (reporte) return reporte;
      this.logger.warn(`Correo dirigido a un reporte inexistente (${id}) — se guarda sin enganchar.`);
    }
    return null;
  }

  /**
   * El mensaje va a la otra punta del hilo: si lo escribió el autor del reporte,
   * al buzón de soporte; si lo escribió cualquier otro (el administrador
   * contestando), al autor. Nunca de vuelta a quien lo mandó.
   *
   * Es best-effort: el correo ya quedó archivado en el hilo, así que un fallo de
   * reenvío no debe tumbar el webhook — si devolvemos error, Resend lo reintenta
   * y termina duplicando la entrega del lado que sí funcionó.
   */
  private async reenviar(reporte: { id: string; asunto: string; autorCorreo: string }, de: string, cuerpo: string) {
    const remitente = extraerDireccion(de).toLowerCase();
    const esDelAutor = remitente === reporte.autorCorreo.toLowerCase();
    const destino = esDelAutor ? this.email.buzonSoporte : reporte.autorCorreo;

    try {
      await this.email.enviarRespuestaSoporte(destino, reporte, cuerpo, de);
    } catch (err) {
      this.logger.error(
        `Respuesta del reporte ${reporte.id} archivada pero no reenviada: ${err instanceof Error ? err.message : err}`
      );
    }
  }
}

/** `Nombre Apellido <alguien@dominio.com>` → `alguien@dominio.com`. */
function extraerDireccion(valor: string): string {
  return valor.match(/<([^>]+)>/)?.[1]?.trim() ?? valor.trim();
}

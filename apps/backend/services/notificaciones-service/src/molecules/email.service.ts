import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import type { CreateNotificacionDto } from "../atoms/notificacion.dto";
import type { ReporteSoporteDto } from "../atoms/soporte.dto";

/**
 * A qué ruta del frontend manda el botón del correo, según el rol al que le
 * corresponde cada tipo de notificación — espeja ROL_POR_TIPO en
 * notificaciones-front/src/store/notificaciones.ts.
 */
const RUTA_POR_TIPO: Record<CreateNotificacionDto["tipo"], string> = {
  comentario_mentor: "/emprendedor/notificaciones",
  enviado_evaluacion: "/emprendedor/notificaciones",
  proyecto_publicado: "/emprendedor/notificaciones",
  proyecto_devuelto: "/emprendedor/notificaciones",
  cambio_emprendedor: "/mentor/notificaciones",
  proyecto_asignado: "/mentor/notificaciones",
};

/**
 * Envío de correo vía Resend para las notificaciones in-app — una sola plantilla
 * genérica que reutiliza título/mensaje (evita mantener 6 plantillas sincronizadas
 * con el contenido que ya se genera para cada tipo). Sin RESEND_API_KEY no revienta:
 * solo registra en el log, igual que EmailService en auth-service.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly soporteEmail: string;
  private readonly inboundDomain: string | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.config.get<string>("RESEND_FROM_EMAIL") ?? "LeanStart <onboarding@resend.dev>";
    this.frontendUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3001";
    this.soporteEmail = this.config.get<string>("SOPORTE_EMAIL") ?? "admin@soporte.leanstart.online";
    this.inboundDomain = this.config.get<string>("SOPORTE_INBOUND_DOMAIN")?.trim() || null;
  }

  async enviarNotificacion(correo: string, dto: CreateNotificacionDto): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY no configurada — correo de notificación omitido para ${correo}: ${dto.titulo}`);
      return;
    }

    const enlace = `${this.frontendUrl}${RUTA_POR_TIPO[dto.tipo] ?? "/"}`;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: correo,
      subject: dto.titulo,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1E1D26;">${dto.titulo}</h2>
          <p style="color: #4A4854; line-height: 1.5;">${dto.mensaje}</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${enlace}"
               style="background: linear-gradient(135deg, #9A62FA, #AE6CFD); color: #FBFBFC;
                      padding: 12px 28px; border-radius: 10px; text-decoration: none;
                      font-weight: 600; display: inline-block;">
              Ver en LeanStart
            </a>
          </p>
          <p style="color: #8A8894; font-size: 13px; line-height: 1.5;">
            Recibes este correo porque tienes una cuenta en LeanStart.
          </p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Resend no pudo enviar el correo a ${correo}: ${error.message}`);
    }
  }

  /**
   * Aviso al buzón de soporte de que entró un reporte nuevo. El registro que
   * manda es el de la base — el correo es una copia de cortesía, no la fuente.
   *
   * El `replyTo` apunta al subdominio de recepción (`reporte-<id>@…`) y no al
   * correo del autor: así, cuando el administrador da "Responder", el mensaje
   * vuelve a entrar por el webhook, queda archivado en el hilo del reporte y de
   * ahí se reenvía al usuario. Si `SOPORTE_INBOUND_DOMAIN` no está configurado
   * no hay a dónde recibir, y entonces sí se responde directo al autor: peor
   * trazabilidad, pero la conversación no se rompe.
   *
   * El asunto y el mensaje los escribe el usuario, así que se escapan antes de
   * meterlos en el HTML — sin eso, un reporte con `<` o `&` en el texto llegaría
   * roto (y un `<script>` viajaría intacto hasta el cliente de correo del admin).
   */
  async enviarReporteSoporte(reporte: {
    id: string;
    autorUserId: string;
    autorNombre: string;
    autorCorreo: string;
    autorRoles: string[];
    asunto: string;
    mensaje: string;
    navegador: string | null;
  }): Promise<void> {
    if (!this.resend) {
      throw new ServiceUnavailableException(
        `RESEND_API_KEY no configurada — no se pudo avisar del reporte ${reporte.id} a ${this.soporteEmail}.`
      );
    }

    const fila = (etiqueta: string, valor: string) => `
      <tr>
        <td style="padding: 4px 12px 4px 0; color: #8A8894; font-size: 13px; white-space: nowrap;">${etiqueta}</td>
        <td style="padding: 4px 0; color: #4A4854; font-size: 13px;">${escaparHtml(valor)}</td>
      </tr>`;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: this.soporteEmail,
      replyTo: this.direccionDeHilo(reporte.id) ?? reporte.autorCorreo,
      subject: `[Soporte] ${reporte.asunto}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #1E1D26; margin-bottom: 4px;">Reporte de soporte técnico</h2>
          <p style="color: #8A8894; font-size: 13px; margin-top: 0;">
            Enviado desde el botón de soporte de LeanStart.
          </p>

          <table style="border-collapse: collapse; margin: 20px 0;">
            ${fila("Reporta", reporte.autorNombre)}
            ${fila("Correo", reporte.autorCorreo)}
            ${fila("Rol", reporte.autorRoles.join(", "))}
            ${fila("Usuario", reporte.autorUserId)}
            ${reporte.navegador ? fila("Navegador", reporte.navegador) : ""}
          </table>

          <div style="border-top: 1px solid #E6E4EC; padding-top: 16px;">
            <p style="color: #1E1D26; font-weight: 600; margin: 0 0 8px;">${escaparHtml(reporte.asunto)}</p>
            <p style="color: #4A4854; line-height: 1.6; white-space: pre-wrap; margin: 0;">${escaparHtml(reporte.mensaje)}</p>
          </div>

          <p style="text-align: center; margin: 28px 0;">
            <a href="${this.frontendUrl}/administrador/soporte"
               style="background: linear-gradient(135deg, #9A62FA, #AE6CFD); color: #FBFBFC;
                      padding: 12px 28px; border-radius: 10px; text-decoration: none;
                      font-weight: 600; display: inline-block;">
              Abrir el buzón de soporte
            </a>
          </p>

          <p style="color: #8A8894; font-size: 13px; line-height: 1.5;">
            Responde a este correo para contestarle a ${escaparHtml(reporte.autorNombre)}; la respuesta
            queda guardada en el hilo del reporte.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Resend no pudo avisar del reporte ${reporte.id} a ${this.soporteEmail}: ${error.message}`);
    }
  }

  /**
   * Reenvía un mensaje del hilo a la otra parte: lo que responde el
   * administrador va al usuario, y lo que responde el usuario va al buzón de
   * soporte. Quien manda nunca recibe su propio mensaje de vuelta — sin esa
   * asimetría, dos autorespondedores se mandarían correos entre ellos para
   * siempre.
   */
  async enviarRespuestaSoporte(
    destino: string,
    reporte: { id: string; asunto: string },
    cuerpo: string,
    de: string
  ): Promise<void> {
    if (!this.resend) {
      throw new ServiceUnavailableException("RESEND_API_KEY no configurada — no se pudo reenviar la respuesta.");
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: destino,
      replyTo: this.direccionDeHilo(reporte.id) ?? this.soporteEmail,
      subject: `Re: [Soporte] ${reporte.asunto}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <p style="color: #8A8894; font-size: 13px; margin: 0 0 12px;">De: ${escaparHtml(de)}</p>
          <p style="color: #4A4854; line-height: 1.6; white-space: pre-wrap;">${escaparHtml(cuerpo)}</p>
          <p style="color: #8A8894; font-size: 13px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #E6E4EC; padding-top: 16px;">
            Respuesta al reporte &quot;${escaparHtml(reporte.asunto)}&quot;. Puedes contestar a este
            mismo correo para seguir la conversación.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Resend no pudo reenviar la respuesta del reporte ${reporte.id} a ${destino}: ${error.message}`);
    }
  }

  /** Buzón al que llegan los reportes — destino del reenvío cuando responde el usuario. */
  get buzonSoporte(): string {
    return this.soporteEmail;
  }

  /**
   * La dirección de salida, sin el nombre para mostrar. El buzón de entrada vive
   * en el dominio de Resend Inbound, así que todo lo que le mandamos vuelve por
   * el webhook: sin esto no habría forma de distinguir un correo de verdad de
   * nuestro propio eco. Ver CorreosEntrantesService.registrar.
   */
  get direccionDeEnvio(): string {
    return (this.from.match(/<([^>]+)>/)?.[1] ?? this.from).trim().toLowerCase();
  }

  /**
   * `reporte-<id>@<SOPORTE_INBOUND_DOMAIN>` — la dirección del hilo. El id va en
   * la parte local a propósito: enganchar la respuesta por asunto ("Re: …") o
   * por remitente falla en cuanto alguien edita el asunto o tiene dos reportes
   * abiertos. Null si no hay subdominio de recepción configurado.
   */
  private direccionDeHilo(reporteId: string): string | null {
    return this.inboundDomain ? `reporte-${reporteId}@${this.inboundDomain}` : null;
  }
}

/** Escapa el texto libre que escribe el usuario antes de incrustarlo en el HTML del correo. */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

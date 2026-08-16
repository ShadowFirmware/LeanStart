import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import type { CreateNotificacionDto } from "../atoms/notificacion.dto";

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

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.config.get<string>("RESEND_FROM_EMAIL") ?? "LeanStart <onboarding@resend.dev>";
    this.frontendUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3001";
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
}

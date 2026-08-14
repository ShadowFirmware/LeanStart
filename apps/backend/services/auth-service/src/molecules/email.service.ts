import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

/**
 * Envío de correo vía Resend. Sin RESEND_API_KEY configurada (p. ej. en un
 * entorno local sin la variable) no revienta: registra el enlace en el log,
 * igual que el stub anterior, para poder seguir probando el flujo sin cuenta.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    // Sin dominio propio verificado en Resend, este remitente de pruebas
    // (resend.dev) funciona sin configuración extra.
    this.from = this.config.get<string>("RESEND_FROM_EMAIL") ?? "LeanStart <onboarding@resend.dev>";
  }

  async enviarRecuperacion(correo: string, enlace: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY no configurada — enlace de recuperación para ${correo}: ${enlace}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: correo,
      subject: "Recupera tu contraseña de LeanStart",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1E1D26;">Recupera tu contraseña</h2>
          <p style="color: #4A4854; line-height: 1.5;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en LeanStart.
            Si fuiste tú, haz clic en el siguiente botón. El enlace expira en 1 hora.
          </p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${enlace}"
               style="background: linear-gradient(135deg, #9A62FA, #AE6CFD); color: #FBFBFC;
                      padding: 12px 28px; border-radius: 10px; text-decoration: none;
                      font-weight: 600; display: inline-block;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color: #8A8894; font-size: 13px; line-height: 1.5;">
            Si no pediste esto, puedes ignorar este correo — tu contraseña actual sigue funcionando.
          </p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Resend no pudo enviar el correo a ${correo}: ${error.message}`);
    }
  }
}

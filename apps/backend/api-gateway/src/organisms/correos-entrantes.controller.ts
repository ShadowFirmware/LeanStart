import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Webhook, WebhookVerificationError } from "svix";
import { Public } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

/**
 * Recibe el webhook `email.received` de Resend Inbound (soporte técnico /
 * reportar empresa, etc. — el procesamiento real se agrega más adelante).
 * Resend firma sus webhooks igual que Svix (mismos headers svix-*), así que
 * se verifica con el paquete `svix` directo en vez de subir la versión del
 * SDK de Resend (evita arriesgar el envío de correo saliente ya en uso en
 * auth-service/notificaciones-service). El gateway es el único borde público
 * — por eso la verificación de firma pasa acá y no en notificaciones-service,
 * que solo confía en la llave interna igual que con cualquier otra llamada
 * entre microservicios.
 */
@Controller("correos-entrantes")
export class CorreosEntrantesController {
  private readonly baseUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService
  ) {
    this.baseUrl = config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");
  }

  @Post("webhook")
  @Public()
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async recibir(@Body() body: Record<string, unknown>, @Headers() headers: Record<string, string>) {
    const secret = this.config.get<string>("RESEND_WEBHOOK_SECRET");
    if (!secret) {
      // Sin la variable configurada, no hay forma de verificar que el webhook
      // sea de verdad de Resend — se rechaza en vez de guardar sin validar.
      throw new UnauthorizedException("El webhook de correos entrantes no está configurado.");
    }

    try {
      new Webhook(secret).verify(JSON.stringify(body), {
        "svix-id": headers["svix-id"],
        "svix-timestamp": headers["svix-timestamp"],
        "svix-signature": headers["svix-signature"],
      });
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        throw new UnauthorizedException("Firma de webhook inválida.");
      }
      throw err;
    }

    await this.proxy.post(this.baseUrl, "/correos-entrantes/interno", body);
    return { received: true };
  }
}

import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";
import { AsistenteRateLimitGuard } from "../molecules/asistente-rate-limit.guard";

@ApiTags("asistente")
@Controller("asistente")
export class AsistenteController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Post("mensaje")
  @UseGuards(AsistenteRateLimitGuard)
  @ApiOperation({ summary: "Enviar un mensaje al asistente conversacional (Empresa + Lean Canvas)" })
  enviarMensaje(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, "/asistente/mensaje", body, user);
  }
}

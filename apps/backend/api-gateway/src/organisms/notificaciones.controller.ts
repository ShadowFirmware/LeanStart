import { Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("notificaciones")
@Controller("notificaciones")
export class NotificacionesController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");
  }

  @Get()
  @ApiOperation({ summary: "Listar mis notificaciones" })
  listar(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/notificaciones", user);
  }

  @Patch(":id/leida")
  @ApiOperation({ summary: "Marcar una notificación como leída" })
  marcarLeida(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.proxy.patch(this.baseUrl, `/notificaciones/${id}/leida`, {}, user);
  }

  @Patch("leidas")
  @ApiOperation({ summary: "Marcar todas mis notificaciones como leídas" })
  marcarTodasLeidas(@CurrentUser() user: AuthUser) {
    return this.proxy.patch(this.baseUrl, "/notificaciones/leidas", {}, user);
  }
}

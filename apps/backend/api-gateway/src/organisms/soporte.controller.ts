import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";
import { SoporteRateLimitGuard } from "../molecules/soporte-rate-limit.guard";
import { ActualizarReporteSoporteDto, ReporteSoporteDto } from "../atoms/soporte.dto";

/**
 * Nótese que @Roles va por método y no en la clase: reportar lo hace cualquier
 * usuario autenticado (ese es el punto del botón), pero el buzón es solo del
 * administrador. Un @Roles a nivel de clase dejaría a todos fuera del POST.
 */
@ApiTags("soporte")
@Controller("soporte")
export class SoporteController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");
  }

  @UseGuards(SoporteRateLimitGuard)
  @Post()
  @ApiOperation({ summary: "Reportar una falla al soporte técnico — queda en el buzón del administrador" })
  reportar(@CurrentUser() user: AuthUser, @Body() dto: ReporteSoporteDto) {
    return this.proxy.post(this.baseUrl, "/soporte", dto, user);
  }

  @Roles("administrador")
  @Get("reportes")
  @ApiOperation({ summary: "Buzón de soporte: reportes con su hilo de respuestas" })
  listar(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/soporte/reportes", user);
  }

  @Roles("administrador")
  @Patch("reportes/:id")
  @ApiOperation({ summary: "Marca un reporte como atendido (o lo reabre)" })
  actualizar(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ActualizarReporteSoporteDto) {
    return this.proxy.patch(this.baseUrl, `/soporte/reportes/${id}`, dto, user);
  }
}

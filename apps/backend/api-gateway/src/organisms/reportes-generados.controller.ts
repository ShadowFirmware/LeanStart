import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("reportes")
@Controller("reportes-generados")
export class ReportesGeneradosController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EVALUACIONES_SERVICE_URL");
  }

  @Get()
  @ApiOperation({ summary: "Historial de reportes exportados" })
  listar(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/reportes-generados", user);
  }

  @Post()
  @ApiOperation({ summary: "Registrar un reporte exportado (boleta o canvas)" })
  registrar(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, "/reportes-generados", body, user);
  }
}

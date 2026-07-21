import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("reportes-empresa")
@Controller()
export class ReportesEmpresaController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Post("empresas/:empresaId/reportes")
  @ApiOperation({ summary: "Reportar una empresa" })
  @ApiParam({ name: "empresaId" })
  crear(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, `/empresas/${empresaId}/reportes`, body, user);
  }

  @Get("empresas/:empresaId/reportes")
  @ApiOperation({ summary: "Listar reportes de una empresa" })
  @ApiParam({ name: "empresaId" })
  listarDeEmpresa(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.proxy.get(this.baseUrl, `/empresas/${empresaId}/reportes`, user);
  }

  @Get("reportes-empresas")
  @ApiOperation({ summary: "Listar todos los reportes (solo administrador)" })
  listarTodos(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/reportes-empresas", user);
  }
}

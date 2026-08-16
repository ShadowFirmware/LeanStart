import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("lean-canvas")
@Controller("empresas/:empresaId/canvas")
export class CanvasController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Patch()
  @ApiOperation({ summary: "Actualizar bloques del Lean Canvas" })
  @ApiParam({ name: "empresaId" })
  actualizar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/empresas/${empresaId}/canvas`, body, user);
  }

  @Get("historial")
  @ApiOperation({ summary: "Historial de versiones del Lean Canvas" })
  @ApiParam({ name: "empresaId" })
  historial(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.proxy.get(this.baseUrl, `/empresas/${empresaId}/canvas/historial`, user);
  }
}

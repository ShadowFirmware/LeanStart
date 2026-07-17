import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("hipotesis")
@Controller("empresas/:empresaId/hipotesis")
export class HipotesisController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Post()
  @ApiOperation({ summary: "Crear hipótesis (fase 1, máx. 3 por empresa)" })
  @ApiParam({ name: "empresaId" })
  crear(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, `/empresas/${empresaId}/hipotesis`, body, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar título/descripción (fase 1)" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/empresas/${empresaId}/hipotesis/${id}`, body, user);
  }

  @Patch(":id/experimento")
  @ApiOperation({ summary: "Diseñar experimento (fase 2)" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizarExperimento(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/empresas/${empresaId}/hipotesis/${id}/experimento`, body, user);
  }

  @Patch(":id/resultados")
  @ApiOperation({ summary: "Registrar resultados y evidencia (fase 3)" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizarResultados(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/empresas/${empresaId}/hipotesis/${id}/resultados`, body, user);
  }

  @Patch(":id/validar")
  @ApiOperation({ summary: "El mentor valida o invalida la hipótesis" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  validar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/empresas/${empresaId}/hipotesis/${id}/validar`, body, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar hipótesis" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Param("id") id: string) {
    return this.proxy.delete(this.baseUrl, `/empresas/${empresaId}/hipotesis/${id}`, user);
  }
}

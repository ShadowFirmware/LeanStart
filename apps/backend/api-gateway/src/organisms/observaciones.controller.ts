import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("observaciones")
@Controller("empresas/:empresaId/observaciones")
export class ObservacionesController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Get()
  @ApiOperation({ summary: "Listar observaciones de la empresa" })
  @ApiParam({ name: "empresaId" })
  listar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.proxy.get(this.baseUrl, `/empresas/${empresaId}/observaciones`, user);
  }

  @Post()
  @ApiOperation({ summary: "Agregar observación (colaboración en vivo mentor ⇄ emprendedor)" })
  @ApiParam({ name: "empresaId" })
  crear(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, `/empresas/${empresaId}/observaciones`, body, user);
  }

  @Patch(":id/estado")
  @ApiOperation({ summary: "Cambiar estado de una observación puntual" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizarEstado(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/empresas/${empresaId}/observaciones/${id}/estado`, body, user);
  }

  @Post("marcar-atendidas")
  @ApiOperation({ summary: "El emprendedor marca que ya corrigió" })
  @ApiParam({ name: "empresaId" })
  marcarAtendidas(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.proxy.post(this.baseUrl, `/empresas/${empresaId}/observaciones/marcar-atendidas`, {}, user);
  }

  @Post("cerrar")
  @ApiOperation({ summary: "Cerrar todas las observaciones de la empresa" })
  @ApiParam({ name: "empresaId" })
  cerrar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.proxy.post(this.baseUrl, `/empresas/${empresaId}/observaciones/cerrar`, {}, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar observación" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Param("id") id: string) {
    return this.proxy.delete(this.baseUrl, `/empresas/${empresaId}/observaciones/${id}`, user);
  }
}

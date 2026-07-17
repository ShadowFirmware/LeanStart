import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("productos")
@Controller("empresas/:empresaId/productos")
export class ProductosController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Post()
  @ApiOperation({ summary: "Agregar producto o servicio" })
  @ApiParam({ name: "empresaId" })
  crear(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, `/empresas/${empresaId}/productos`, body, user);
  }

  @Patch(":productoId")
  @ApiOperation({ summary: "Editar producto o servicio" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "productoId" })
  actualizar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("productoId") productoId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/empresas/${empresaId}/productos/${productoId}`, body, user);
  }

  @Delete(":productoId")
  @ApiOperation({ summary: "Eliminar producto o servicio" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "productoId" })
  eliminar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("productoId") productoId: string
  ) {
    return this.proxy.delete(this.baseUrl, `/empresas/${empresaId}/productos/${productoId}`, user);
  }
}

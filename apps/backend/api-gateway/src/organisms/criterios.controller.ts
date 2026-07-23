import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("criterios")
@Roles("administrador")
@Controller("criterios")
export class CriteriosController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EVALUACIONES_SERVICE_URL");
  }

  @Get()
  @Roles("administrador", "evaluador", "emprendedor")
  @ApiOperation({ summary: "Listar criterios de evaluación (lectura: evaluador para calificar, emprendedor para ver el detalle de su feedback)" })
  listar(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/criterios", user);
  }

  @Post()
  @ApiOperation({ summary: "Crear criterio" })
  crear(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, "/criterios", body, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar criterio" })
  @ApiParam({ name: "id" })
  editar(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/criterios/${id}`, body, user);
  }

  @Patch(":id/peso")
  @ApiOperation({ summary: "Actualizar solo el peso de un criterio" })
  @ApiParam({ name: "id" })
  actualizarPeso(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/criterios/${id}/peso`, body, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar criterio" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.proxy.delete(this.baseUrl, `/criterios/${id}`, user);
  }
}

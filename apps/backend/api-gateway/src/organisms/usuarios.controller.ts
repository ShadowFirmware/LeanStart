import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("usuarios")
@Roles("administrador")
@Controller("usuarios")
export class UsuariosController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("AUTH_SERVICE_URL");
  }

  @Get()
  @ApiOperation({ summary: "Listar usuarios" })
  listar(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/usuarios", user);
  }

  @Post()
  @ApiOperation({ summary: "Crear usuario" })
  crear(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, "/usuarios", body, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar usuario" })
  @ApiParam({ name: "id" })
  editar(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/usuarios/${id}`, body, user);
  }

  @Patch(":id/activar")
  @ApiOperation({ summary: "Activar usuario" })
  @ApiParam({ name: "id" })
  activar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.proxy.patch(this.baseUrl, `/usuarios/${id}/activar`, {}, user);
  }

  @Patch(":id/desactivar")
  @ApiOperation({ summary: "Desactivar usuario" })
  @ApiParam({ name: "id" })
  desactivar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.proxy.patch(this.baseUrl, `/usuarios/${id}/desactivar`, {}, user);
  }
}

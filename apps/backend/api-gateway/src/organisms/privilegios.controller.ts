import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("privilegios")
@Roles("administrador")
@Controller("privilegios")
export class PrivilegiosController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("AUTH_SERVICE_URL");
  }

  @Get(":rolId")
  @ApiOperation({ summary: "Matriz módulo × acción de un rol" })
  @ApiParam({ name: "rolId" })
  obtener(@CurrentUser() user: AuthUser, @Param("rolId") rolId: string) {
    return this.proxy.get(this.baseUrl, `/privilegios/${rolId}`, user);
  }

  @Patch(":rolId/toggle-accion")
  @ApiOperation({ summary: "Activar/desactivar una acción puntual" })
  @ApiParam({ name: "rolId" })
  toggleAccion(@CurrentUser() user: AuthUser, @Param("rolId") rolId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/privilegios/${rolId}/toggle-accion`, body, user);
  }

  @Patch(":rolId/toggle-modulo")
  @ApiOperation({ summary: "Activar/desactivar todas las acciones de un módulo" })
  @ApiParam({ name: "rolId" })
  toggleModulo(@CurrentUser() user: AuthUser, @Param("rolId") rolId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/privilegios/${rolId}/toggle-modulo`, body, user);
  }

  @Patch(":rolId/toggle-columna")
  @ApiOperation({ summary: "Activar/desactivar una acción en todos los módulos" })
  @ApiParam({ name: "rolId" })
  toggleColumna(@CurrentUser() user: AuthUser, @Param("rolId") rolId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/privilegios/${rolId}/toggle-columna`, body, user);
  }

  @Patch(":rolId/set-todos")
  @ApiOperation({ summary: "Otorgar o revocar todos los privilegios del rol" })
  @ApiParam({ name: "rolId" })
  setTodos(@CurrentUser() user: AuthUser, @Param("rolId") rolId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/privilegios/${rolId}/set-todos`, body, user);
  }

  @Get("usuario/:userId")
  @ApiOperation({ summary: "Privilegios efectivos de un usuario (roles + excepciones puntuales)" })
  @ApiParam({ name: "userId" })
  obtenerUsuario(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.proxy.get(this.baseUrl, `/privilegios/usuario/${userId}`, user);
  }

  @Patch("usuario/:userId/toggle-accion")
  @ApiOperation({ summary: "Otorgar/quitar una acción puntual a un usuario específico" })
  @ApiParam({ name: "userId" })
  toggleAccionUsuario(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/privilegios/usuario/${userId}/toggle-accion`, body, user);
  }

  @Patch("usuario/:userId/toggle-modulo")
  @ApiOperation({ summary: "Otorgar/quitar todas las acciones de un módulo a un usuario específico" })
  @ApiParam({ name: "userId" })
  toggleModuloUsuario(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/privilegios/usuario/${userId}/toggle-modulo`, body, user);
  }

  @Patch("usuario/:userId/toggle-columna")
  @ApiOperation({ summary: "Otorgar/quitar una acción en todos los módulos a un usuario específico" })
  @ApiParam({ name: "userId" })
  toggleColumnaUsuario(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/privilegios/usuario/${userId}/toggle-columna`, body, user);
  }

  @Patch("usuario/:userId/set-todos")
  @ApiOperation({ summary: "Otorgar o revocar todos los privilegios a un usuario específico" })
  @ApiParam({ name: "userId" })
  setTodosUsuario(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/privilegios/usuario/${userId}/set-todos`, body, user);
  }
}

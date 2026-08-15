import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { Roles } from "@leanstart/backend-commons";
import { PrivilegiosService } from "../molecules/privilegios.service";
import { SetCeldasDto, SetTodosDto, ToggleAccionDto, ToggleColumnaDto, ToggleModuloDto } from "../atoms/privilegio.dto";

@ApiTags("privilegios")
@Roles("administrador")
@Controller("privilegios")
export class PrivilegiosController {
  constructor(private readonly privilegios: PrivilegiosService) {}

  @Get(":rolId")
  @ApiOperation({ summary: "Matriz módulo × acción de un rol" })
  @ApiParam({ name: "rolId" })
  obtener(@Param("rolId") rolId: string) {
    return this.privilegios.getPrivilegiosDeRol(rolId);
  }

  @Patch(":rolId/toggle-accion")
  @ApiOperation({ summary: "Activar/desactivar una acción puntual" })
  @ApiParam({ name: "rolId" })
  toggleAccion(@Param("rolId") rolId: string, @Body() dto: ToggleAccionDto) {
    return this.privilegios.toggleAccion(rolId, dto.modulo, dto.accion);
  }

  @Patch(":rolId/toggle-modulo")
  @ApiOperation({ summary: "Activar/desactivar todas las acciones de un módulo" })
  @ApiParam({ name: "rolId" })
  toggleModulo(@Param("rolId") rolId: string, @Body() dto: ToggleModuloDto) {
    return this.privilegios.toggleModuloCompleto(rolId, dto.modulo);
  }

  @Patch(":rolId/toggle-columna")
  @ApiOperation({ summary: "Activar/desactivar una acción en todos los módulos" })
  @ApiParam({ name: "rolId" })
  toggleColumna(@Param("rolId") rolId: string, @Body() dto: ToggleColumnaDto) {
    return this.privilegios.toggleAccionColumna(rolId, dto.accion);
  }

  @Patch(":rolId/set-todos")
  @ApiOperation({ summary: "Otorgar o revocar todos los privilegios del rol" })
  @ApiParam({ name: "rolId" })
  setTodos(@Param("rolId") rolId: string, @Body() dto: SetTodosDto) {
    return this.privilegios.setTodos(rolId, dto.activar);
  }

  @Get("usuario/:userId")
  @ApiOperation({ summary: "Privilegios efectivos de un usuario (roles + excepciones puntuales)" })
  @ApiParam({ name: "userId" })
  obtenerUsuario(@Param("userId") userId: string) {
    return this.privilegios.getPrivilegiosEfectivosDeUsuario(userId);
  }

  @Patch("usuario/:userId/set-celdas")
  @ApiOperation({ summary: "Guarda en bloque el borrador de privilegios de un usuario específico" })
  @ApiParam({ name: "userId" })
  setCeldasUsuario(@Param("userId") userId: string, @Body() dto: SetCeldasDto) {
    return this.privilegios.setCeldasUsuario(userId, dto.cambios);
  }
}

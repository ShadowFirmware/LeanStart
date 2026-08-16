import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { UsuariosService } from "../molecules/usuarios.service";
import { CreateUsuarioDto, UpdateUsuarioDto } from "../atoms/usuario.dto";

@ApiTags("usuarios")
@Roles("administrador")
@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: "Listar usuarios" })
  listar() {
    return this.usuarios.listar();
  }

  @Get(":id/interno")
  @Roles()
  @ApiOperation({ summary: "[Interno] Nombre y correo de un usuario — solo para otros microservicios" })
  @ApiParam({ name: "id" })
  obtenerInterno(@Param("id") id: string) {
    return this.usuarios.obtenerInterno(id);
  }

  @Post()
  @ApiOperation({ summary: "Crear usuario (contraseña temporal, el usuario la cambia luego)" })
  crear(@CurrentUser() user: AuthUser, @Body() dto: CreateUsuarioDto) {
    return this.usuarios.crear(user.id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar usuario" })
  @ApiParam({ name: "id" })
  editar(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuarios.editar(user.id, id, dto);
  }

  @Patch(":id/activar")
  @ApiOperation({ summary: "Activar usuario" })
  @ApiParam({ name: "id" })
  activar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.usuarios.activar(user.id, id);
  }

  @Patch(":id/desactivar")
  @ApiOperation({ summary: "Desactivar usuario" })
  @ApiParam({ name: "id" })
  desactivar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.usuarios.desactivar(user.id, id);
  }
}

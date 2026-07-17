import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { Roles } from "@leanstart/backend-commons";
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

  @Post()
  @ApiOperation({ summary: "Crear usuario (contraseña temporal, el usuario la cambia luego)" })
  crear(@Body() dto: CreateUsuarioDto) {
    return this.usuarios.crear(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar usuario" })
  @ApiParam({ name: "id" })
  editar(@Param("id") id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuarios.editar(id, dto);
  }

  @Patch(":id/activar")
  @ApiOperation({ summary: "Activar usuario" })
  @ApiParam({ name: "id" })
  activar(@Param("id") id: string) {
    return this.usuarios.activar(id);
  }

  @Patch(":id/desactivar")
  @ApiOperation({ summary: "Desactivar usuario" })
  @ApiParam({ name: "id" })
  desactivar(@Param("id") id: string) {
    return this.usuarios.desactivar(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { EmpresasService } from "../molecules/empresas.service";
import { CreateEmpresaDto, UpdateEmpresaDto } from "../atoms/empresa.dto";
import { AsignarDto, CambiarEstadoDto, CambiarEstadoInternoDto } from "../atoms/estado.dto";

@ApiTags("empresas")
@Controller("empresas")
export class EmpresasController {
  constructor(private readonly empresas: EmpresasService) {}

  @Get()
  @ApiOperation({ summary: "Listar empresas visibles para el usuario actual" })
  listar(@CurrentUser() user: AuthUser) {
    return this.empresas.listar(user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener una empresa (con canvas, productos e hipótesis)" })
  @ApiParam({ name: "id" })
  obtener(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.empresas.obtener(user, id);
  }

  @Get(":id/interno")
  @ApiOperation({ summary: "[Interno] Obtener empresa sin scoping — solo para otros microservicios" })
  @ApiParam({ name: "id" })
  obtenerInterno(@Param("id") id: string) {
    return this.empresas.obtenerInterno(id);
  }

  @Post()
  @Roles("emprendedor")
  @ApiOperation({ summary: "Crear empresa" })
  crear(@CurrentUser() user: AuthUser, @Body() dto: CreateEmpresaDto) {
    return this.empresas.crear(user, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar datos generales de la empresa" })
  @ApiParam({ name: "id" })
  actualizar(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresas.actualizar(user, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar empresa" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.empresas.eliminar(user, id);
  }

  @Patch(":id/estado")
  @ApiOperation({ summary: "Cambiar el estado de la empresa (valida la transición)" })
  @ApiParam({ name: "id" })
  cambiarEstado(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: CambiarEstadoDto) {
    return this.empresas.cambiarEstado(user, id, dto.estado);
  }

  @Patch(":id/estado-interno")
  @ApiOperation({ summary: "[Interno] Cambiar estado sin scoping — usado por el saga de evaluaciones-service" })
  @ApiParam({ name: "id" })
  cambiarEstadoInterno(@Param("id") id: string, @Body() dto: CambiarEstadoInternoDto) {
    return this.empresas.cambiarEstadoInterno(id, dto.estado, dto.scoreFinal);
  }

  @Patch(":id/asignar-mentor")
  @Roles("administrador")
  @ApiOperation({ summary: "Asignar mentor (pasa la empresa a en_mentoria)" })
  @ApiParam({ name: "id" })
  asignarMentor(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AsignarDto) {
    return this.empresas.asignarMentor(user, id, dto.userId);
  }

  @Patch(":id/asignar-evaluador")
  @Roles("administrador")
  @ApiOperation({ summary: "Asignar evaluador (pasa la empresa a en_evaluacion)" })
  @ApiParam({ name: "id" })
  asignarEvaluador(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AsignarDto) {
    return this.empresas.asignarEvaluador(user, id, dto.userId);
  }
}

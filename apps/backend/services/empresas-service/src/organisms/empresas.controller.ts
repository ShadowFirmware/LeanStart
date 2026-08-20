import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, RequierePrivilegio, Roles, S3UploadService, type AuthUser } from "@leanstart/backend-commons";
import { EmpresasService } from "../molecules/empresas.service";
import { CreateEmpresaDto, UpdateEmpresaDto } from "../atoms/empresa.dto";
import { ActualizarNivelInternoDto, AsignarDto, CambiarEstadoDto, CambiarEstadoInternoDto } from "../atoms/estado.dto";

@ApiTags("empresas")
@Controller("empresas")
export class EmpresasController {
  constructor(
    private readonly empresas: EmpresasService,
    private readonly s3: S3UploadService
  ) {}

  @Get()
  @ApiOperation({ summary: "Listar empresas visibles para el usuario actual" })
  listar(@CurrentUser() user: AuthUser) {
    return this.empresas.listar(user);
  }

  @Get("pendientes-nivel-interno")
  @ApiOperation({ summary: "[Interno] Empresas evaluadas sin nivel congelado — solo para el script de backfill" })
  listarPendientesNivelInterno() {
    return this.empresas.listarPendientesNivelInterno();
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
  @RequierePrivilegio("empresas", "crear")
  @ApiOperation({ summary: "Crear empresa" })
  crear(@CurrentUser() user: AuthUser, @Body() dto: CreateEmpresaDto) {
    return this.empresas.crear(user, dto);
  }

  @Patch(":id")
  @RequierePrivilegio("empresas", "editar")
  @ApiOperation({ summary: "Editar datos generales de la empresa" })
  @ApiParam({ name: "id" })
  actualizar(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresas.actualizar(user, id, dto);
  }

  @Delete(":id")
  @RequierePrivilegio("empresas", "eliminar")
  @ApiOperation({ summary: "Eliminar empresa" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.empresas.eliminar(user, id);
  }

  @Post(":id/logo")
  @RequierePrivilegio("empresas", "editar")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Subir el logo de la empresa a S3" })
  @ApiParam({ name: "id" })
  async subirLogo(@CurrentUser() user: AuthUser, @Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Falta el archivo (campo 'file').");
    const logoUrl = await this.s3.subirImagen(file, `logos/${id}`);
    await this.empresas.actualizar(user, id, { logoUrl });
    return { logoUrl };
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
    return this.empresas.cambiarEstadoInterno(id, dto.estado, dto.scoreFinal, dto.nivelNombre, dto.nivelColor);
  }

  @Patch(":id/nivel-interno")
  @ApiOperation({ summary: "[Interno] Rellenar el nivel congelado — solo para el script de backfill" })
  @ApiParam({ name: "id" })
  actualizarNivelInterno(@Param("id") id: string, @Body() dto: ActualizarNivelInternoDto) {
    return this.empresas.actualizarNivelInterno(id, dto.nivelNombre, dto.nivelColor);
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

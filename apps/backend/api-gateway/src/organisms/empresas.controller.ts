import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("empresas")
@Controller("empresas")
export class EmpresasController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Get()
  @ApiOperation({ summary: "Listar empresas visibles para el usuario actual" })
  listar(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/empresas", user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener una empresa (con canvas, productos e hipótesis)" })
  @ApiParam({ name: "id" })
  obtener(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.proxy.get(this.baseUrl, `/empresas/${id}`, user);
  }

  @Post()
  @ApiOperation({ summary: "Crear empresa" })
  crear(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, "/empresas", body, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar datos generales de la empresa" })
  @ApiParam({ name: "id" })
  actualizar(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/empresas/${id}`, body, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar empresa" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.proxy.delete(this.baseUrl, `/empresas/${id}`, user);
  }

  @Patch(":id/estado")
  @ApiOperation({ summary: "Cambiar el estado de la empresa (valida la transición)" })
  @ApiParam({ name: "id" })
  cambiarEstado(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/empresas/${id}/estado`, body, user);
  }

  @Patch(":id/asignar-mentor")
  @ApiOperation({ summary: "Asignar mentor (pasa la empresa a en_mentoria)" })
  @ApiParam({ name: "id" })
  asignarMentor(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/empresas/${id}/asignar-mentor`, body, user);
  }

  @Patch(":id/asignar-evaluador")
  @ApiOperation({ summary: "Asignar evaluador (pasa la empresa a en_evaluacion)" })
  @ApiParam({ name: "id" })
  asignarEvaluador(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/empresas/${id}/asignar-evaluador`, body, user);
  }

  @Post(":id/logo")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Subir logo a S3 (reenvía a empresas-service)" })
  @ApiParam({ name: "id" })
  async subirLogo(@CurrentUser() user: AuthUser, @Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Falta el archivo (campo 'file').");
    return this.proxy.postFile(this.baseUrl, `/empresas/${id}/logo`, file, user);
  }
}

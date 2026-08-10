import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("viabilidad")
@Roles("administrador")
@Controller("viabilidad")
export class ViabilidadController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EVALUACIONES_SERVICE_URL");
  }

  @Get()
  @Roles("administrador", "evaluador", "mentor", "emprendedor")
  @ApiOperation({ summary: "Configuración de viabilidad (lectura: todos los roles, para mostrar el nivel obtenido)" })
  obtener(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/viabilidad", user);
  }

  @Patch("peso-evaluacion")
  @ApiOperation({ summary: "Peso (%) que aporta la evaluación al score final" })
  actualizarPeso(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, "/viabilidad/peso-evaluacion", body, user);
  }

  @Patch("umbral-publicacion")
  @ApiOperation({ summary: "Calificación mínima para publicar un proyecto" })
  actualizarUmbral(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, "/viabilidad/umbral-publicacion", body, user);
  }

  @Patch("niveles/:id/hasta")
  @ApiOperation({ summary: "Mover el límite superior de un nivel" })
  @ApiParam({ name: "id" })
  actualizarHasta(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/viabilidad/niveles/${id}/hasta`, body, user);
  }

  @Patch("niveles/:id")
  @ApiOperation({ summary: "Editar nombre/color de un nivel" })
  @ApiParam({ name: "id" })
  editarNivel(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/viabilidad/niveles/${id}`, body, user);
  }

  @Post("niveles")
  @ApiOperation({ summary: "Agregar un nivel (nombre/color/límite opcionales)" })
  agregarNivel(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, "/viabilidad/niveles", body ?? {}, user);
  }

  @Delete("niveles/:id")
  @ApiOperation({ summary: "Eliminar un nivel" })
  @ApiParam({ name: "id" })
  eliminarNivel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.proxy.delete(this.baseUrl, `/viabilidad/niveles/${id}`, user);
  }

  @Post("niveles/reordenar")
  @ApiOperation({ summary: "Reordenar niveles preservando el ancho de cada uno" })
  reordenar(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.post(this.baseUrl, "/viabilidad/niveles/reordenar", body, user);
  }
}

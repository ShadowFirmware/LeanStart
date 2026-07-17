import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("evaluaciones")
@Roles("evaluador")
@Controller("evaluaciones")
export class EvaluacionesController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EVALUACIONES_SERVICE_URL");
  }

  @Get(":empresaId")
  @ApiOperation({ summary: "Borrador/resultado de la evaluación de una empresa" })
  @ApiParam({ name: "empresaId" })
  obtener(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.proxy.get(this.baseUrl, `/evaluaciones/${empresaId}`, user);
  }

  @Patch(":empresaId/puntaje")
  @ApiOperation({ summary: "Calificar un criterio (0-100)" })
  @ApiParam({ name: "empresaId" })
  setPuntaje(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/evaluaciones/${empresaId}/puntaje`, body, user);
  }

  @Patch(":empresaId/comentario-criterio")
  @ApiOperation({ summary: "Comentar un criterio puntual" })
  @ApiParam({ name: "empresaId" })
  setComentarioCriterio(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.proxy.patch(this.baseUrl, `/evaluaciones/${empresaId}/comentario-criterio`, body, user);
  }

  @Patch(":empresaId/comentario")
  @ApiOperation({ summary: "Comentario general del evaluador" })
  @ApiParam({ name: "empresaId" })
  setComentario(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, `/evaluaciones/${empresaId}/comentario`, body, user);
  }

  @Post(":empresaId/finalizar")
  @ApiOperation({ summary: "Finalizar evaluación: calcula el score y publica o devuelve el proyecto" })
  @ApiParam({ name: "empresaId" })
  finalizar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.proxy.post(this.baseUrl, `/evaluaciones/${empresaId}/finalizar`, {}, user);
  }
}

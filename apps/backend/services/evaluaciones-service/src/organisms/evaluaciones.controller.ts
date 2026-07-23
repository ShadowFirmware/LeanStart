import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { EvaluacionesService } from "../molecules/evaluaciones.service";
import { SetComentarioCriterioDto, SetComentarioDto, SetPuntajeDto } from "../atoms/evaluacion.dto";

@ApiTags("evaluaciones")
@Roles("evaluador")
@Controller("evaluaciones")
export class EvaluacionesController {
  constructor(private readonly evaluaciones: EvaluacionesService) {}

  @Get(":empresaId")
  @Roles("evaluador", "administrador", "emprendedor")
  @ApiOperation({ summary: "Borrador/resultado de la evaluación de una empresa (el emprendedor solo ve la suya, ya finalizada)" })
  @ApiParam({ name: "empresaId" })
  obtener(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.evaluaciones.obtener(user, empresaId);
  }

  @Patch(":empresaId/puntaje")
  @ApiOperation({ summary: "Calificar un criterio (0-100)" })
  @ApiParam({ name: "empresaId" })
  setPuntaje(@Param("empresaId") empresaId: string, @Body() dto: SetPuntajeDto) {
    return this.evaluaciones.setPuntaje(empresaId, dto.criterioId, dto.puntaje);
  }

  @Patch(":empresaId/comentario-criterio")
  @ApiOperation({ summary: "Comentar un criterio puntual" })
  @ApiParam({ name: "empresaId" })
  setComentarioCriterio(@Param("empresaId") empresaId: string, @Body() dto: SetComentarioCriterioDto) {
    return this.evaluaciones.setComentarioCriterio(empresaId, dto.criterioId, dto.comentario);
  }

  @Patch(":empresaId/comentario")
  @ApiOperation({ summary: "Comentario general del evaluador" })
  @ApiParam({ name: "empresaId" })
  setComentario(@Param("empresaId") empresaId: string, @Body() dto: SetComentarioDto) {
    return this.evaluaciones.setComentario(empresaId, dto.comentario);
  }

  @Post(":empresaId/finalizar")
  @ApiOperation({ summary: "Finalizar evaluación: calcula el score y publica o devuelve el proyecto" })
  @ApiParam({ name: "empresaId" })
  finalizar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.evaluaciones.finalizar(user, empresaId);
  }
}

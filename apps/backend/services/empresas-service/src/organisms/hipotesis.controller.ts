import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, RequierePrivilegio, Roles, type AuthUser, type EstadoHipotesis } from "@leanstart/backend-commons";
import { HipotesisService } from "../molecules/hipotesis.service";
import { CreateHipotesisDto, ExperimentoDisenoDto, ResultadosHipotesisDto, UpdateHipotesisDto } from "../atoms/hipotesis.dto";
import { IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

class ValidarHipotesisDto {
  @ApiProperty({ enum: ["validada", "invalidada"] })
  @IsIn(["validada", "invalidada"])
  estado!: EstadoHipotesis;
}

@ApiTags("hipotesis")
@Controller("empresas/:empresaId/hipotesis")
export class HipotesisController {
  constructor(private readonly hipotesis: HipotesisService) {}

  @Post()
  @RequierePrivilegio("hipotesis", "crear")
  @ApiOperation({ summary: "Crear hipótesis (fase 1, máx. 3 por empresa)" })
  @ApiParam({ name: "empresaId" })
  crear(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() dto: CreateHipotesisDto) {
    return this.hipotesis.crear(user, empresaId, dto);
  }

  @Patch(":id")
  @RequierePrivilegio("hipotesis", "editar")
  @ApiOperation({ summary: "Editar título/descripción (fase 1)" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() dto: UpdateHipotesisDto
  ) {
    return this.hipotesis.actualizar(user, empresaId, id, dto);
  }

  @Patch(":id/experimento")
  @RequierePrivilegio("hipotesis", "editar")
  @ApiOperation({ summary: "Diseñar experimento (fase 2)" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizarExperimento(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() dto: ExperimentoDisenoDto
  ) {
    return this.hipotesis.actualizarExperimento(user, empresaId, id, dto);
  }

  @Patch(":id/resultados")
  @RequierePrivilegio("hipotesis", "editar")
  @ApiOperation({ summary: "Registrar resultados y evidencia (fase 3)" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizarResultados(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() dto: ResultadosHipotesisDto
  ) {
    return this.hipotesis.actualizarResultados(user, empresaId, id, dto);
  }

  @Patch(":id/validar")
  @Roles("mentor")
  @RequierePrivilegio("hipotesis", "aprobar")
  @ApiOperation({ summary: "El mentor valida o invalida la hipótesis" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  validar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() dto: ValidarHipotesisDto
  ) {
    return this.hipotesis.validar(user, empresaId, id, dto.estado);
  }

  @Delete(":id")
  @RequierePrivilegio("hipotesis", "eliminar")
  @ApiOperation({ summary: "Eliminar hipótesis" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Param("id") id: string) {
    return this.hipotesis.eliminar(user, empresaId, id);
  }
}

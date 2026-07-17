import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser, type EstadoObservacion } from "@leanstart/backend-commons";
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { ObservacionesService } from "../molecules/observaciones.service";
import { CreateObservacionDto } from "../atoms/observacion.dto";

const ESTADOS_OBSERVACION = ["pendiente", "en_revision", "atendida", "cerrada"] as const;

class ActualizarEstadoObservacionDto {
  @ApiProperty({ enum: ESTADOS_OBSERVACION })
  @IsIn(ESTADOS_OBSERVACION)
  estado!: EstadoObservacion;
}

@ApiTags("observaciones")
@Controller("empresas/:empresaId/observaciones")
export class ObservacionesController {
  constructor(private readonly observaciones: ObservacionesService) {}

  @Get()
  @ApiOperation({ summary: "Listar observaciones de la empresa (visibles para dueño y mentor/evaluador)" })
  @ApiParam({ name: "empresaId" })
  listar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.observaciones.listarDeEmpresa(user, empresaId);
  }

  @Post()
  @ApiOperation({ summary: "Agregar observación (colaboración en vivo mentor ⇄ emprendedor)" })
  @ApiParam({ name: "empresaId" })
  crear(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Body() dto: CreateObservacionDto
  ) {
    return this.observaciones.crear(user, empresaId, dto.autorNombre, dto);
  }

  @Patch(":id/estado")
  @ApiOperation({ summary: "Cambiar estado de una observación puntual" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  actualizarEstado(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("id") id: string,
    @Body() dto: ActualizarEstadoObservacionDto
  ) {
    return this.observaciones.actualizarEstado(user, empresaId, id, dto.estado);
  }

  @Post("marcar-atendidas")
  @ApiOperation({ summary: "El emprendedor marca que ya corrigió — notifica al mentor" })
  @ApiParam({ name: "empresaId" })
  marcarAtendidas(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.observaciones.marcarAtendidas(user, empresaId);
  }

  @Post("cerrar")
  @ApiOperation({ summary: "Cerrar todas las observaciones de la empresa" })
  @ApiParam({ name: "empresaId" })
  cerrar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.observaciones.cerrarDeEmpresa(user, empresaId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar observación" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "id" })
  eliminar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Param("id") id: string) {
    return this.observaciones.eliminar(user, empresaId, id);
  }
}

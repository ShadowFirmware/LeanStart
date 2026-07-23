import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiProperty, ApiTags } from "@nestjs/swagger";
import { Roles } from "@leanstart/backend-commons";
import { IsInt, Max, Min } from "class-validator";
import { CriteriosService } from "../molecules/criterios.service";
import { CreateCriterioDto, EditarCriterioDto } from "../atoms/criterio.dto";

class ActualizarPesoCriterioDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  peso!: number;
}

@ApiTags("criterios")
@Roles("administrador")
@Controller("criterios")
export class CriteriosController {
  constructor(private readonly criterios: CriteriosService) {}

  @Get()
  @Roles("administrador", "evaluador", "emprendedor")
  @ApiOperation({ summary: "Listar criterios de evaluación (lectura: evaluador para calificar, emprendedor para ver el detalle de su feedback)" })
  listar() {
    return this.criterios.listar();
  }

  @Post()
  @ApiOperation({ summary: "Crear criterio" })
  crear(@Body() dto: CreateCriterioDto) {
    return this.criterios.crear(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Editar criterio" })
  @ApiParam({ name: "id" })
  editar(@Param("id") id: string, @Body() dto: EditarCriterioDto) {
    return this.criterios.editar(id, dto);
  }

  @Patch(":id/peso")
  @ApiOperation({ summary: "Actualizar solo el peso de un criterio" })
  @ApiParam({ name: "id" })
  actualizarPeso(@Param("id") id: string, @Body() dto: ActualizarPesoCriterioDto) {
    return this.criterios.actualizarPeso(id, dto.peso);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar criterio" })
  @ApiParam({ name: "id" })
  eliminar(@Param("id") id: string) {
    return this.criterios.eliminar(id);
  }
}

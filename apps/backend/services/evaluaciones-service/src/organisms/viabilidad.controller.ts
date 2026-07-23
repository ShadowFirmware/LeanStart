import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { Roles } from "@leanstart/backend-commons";
import { ViabilidadService } from "../molecules/viabilidad.service";
import {
  ActualizarHastaNivelDto,
  ActualizarPesoDto,
  ActualizarUmbralDto,
  EditarNivelDto,
  ReordenarNivelDto,
} from "../atoms/viabilidad.dto";

@ApiTags("viabilidad")
@Roles("administrador")
@Controller("viabilidad")
export class ViabilidadController {
  constructor(private readonly viabilidad: ViabilidadService) {}

  @Get()
  @Roles("administrador", "evaluador", "mentor", "emprendedor")
  @ApiOperation({ summary: "Configuración de viabilidad (lectura: todos los roles, para mostrar el nivel obtenido)" })
  obtener() {
    return this.viabilidad.obtenerConfig();
  }

  @Patch("peso-evaluacion")
  @ApiOperation({ summary: "Peso (%) que aporta la evaluación al score final" })
  actualizarPeso(@Body() dto: ActualizarPesoDto) {
    return this.viabilidad.actualizarPesoEvaluacion(dto.peso);
  }

  @Patch("umbral-publicacion")
  @ApiOperation({ summary: "Calificación mínima para publicar un proyecto" })
  actualizarUmbral(@Body() dto: ActualizarUmbralDto) {
    return this.viabilidad.actualizarUmbralPublicacion(dto.umbral);
  }

  @Patch("niveles/:id/hasta")
  @ApiOperation({ summary: "Mover el límite superior de un nivel" })
  @ApiParam({ name: "id" })
  actualizarHasta(@Param("id") id: string, @Body() dto: ActualizarHastaNivelDto) {
    return this.viabilidad.actualizarHastaNivel(id, dto.hasta);
  }

  @Patch("niveles/:id")
  @ApiOperation({ summary: "Editar nombre/color de un nivel" })
  @ApiParam({ name: "id" })
  editarNivel(@Param("id") id: string, @Body() dto: EditarNivelDto) {
    return this.viabilidad.editarNivel(id, dto);
  }

  @Post("niveles")
  @ApiOperation({ summary: "Agregar un nivel (inserta un punto medio antes del último)" })
  agregarNivel() {
    return this.viabilidad.agregarNivel();
  }

  @Delete("niveles/:id")
  @ApiOperation({ summary: "Eliminar un nivel" })
  @ApiParam({ name: "id" })
  eliminarNivel(@Param("id") id: string) {
    return this.viabilidad.eliminarNivel(id);
  }

  @Post("niveles/reordenar")
  @ApiOperation({ summary: "Reordenar niveles preservando el ancho de cada uno" })
  reordenar(@Body() dto: ReordenarNivelDto) {
    return this.viabilidad.reordenarNivel(dto.desde, dto.hasta);
  }
}

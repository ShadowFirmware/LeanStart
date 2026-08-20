import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { SoporteService } from "../molecules/soporte.service";
import { ActualizarReporteSoporteDto, ReporteSoporteDto } from "../atoms/soporte.dto";

@ApiTags("soporte")
@Controller("soporte")
export class SoporteController {
  constructor(private readonly soporte: SoporteService) {}

  @Post()
  @ApiOperation({ summary: "Reportar una falla al soporte técnico (se guarda y se avisa por correo)" })
  reportar(@CurrentUser() user: AuthUser, @Body() dto: ReporteSoporteDto) {
    return this.soporte.reportar(dto, user);
  }

  @Get("reportes")
  @ApiOperation({ summary: "Buzón de soporte: reportes con su hilo de respuestas" })
  listar() {
    return this.soporte.listar();
  }

  @Patch("reportes/:id")
  @ApiOperation({ summary: "Marca un reporte como atendido (o lo reabre)" })
  actualizar(@Param("id") id: string, @Body() dto: ActualizarReporteSoporteDto) {
    return this.soporte.actualizarEstado(id, dto.estado);
  }
}

import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ReportesGeneradosService } from "../molecules/reportes-generados.service";
import { RegistrarReporteDto } from "../atoms/reporte-generado.dto";

@ApiTags("reportes")
@Controller("reportes-generados")
export class ReportesGeneradosController {
  constructor(private readonly reportes: ReportesGeneradosService) {}

  @Get()
  @ApiOperation({ summary: "Historial de reportes exportados" })
  listar() {
    return this.reportes.listar();
  }

  @Post()
  @ApiOperation({ summary: "Registrar un reporte exportado (boleta o canvas)" })
  registrar(@Body() dto: RegistrarReporteDto) {
    return this.reportes.registrar(dto);
  }
}

import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { ReportesEmpresaService } from "../molecules/reportes-empresa.service";
import { CreateReporteDto } from "../atoms/reporte.dto";

@ApiTags("reportes-empresa")
@Controller()
export class ReportesEmpresaController {
  constructor(private readonly reportes: ReportesEmpresaService) {}

  @Post("empresas/:empresaId/reportes")
  @ApiOperation({ summary: "Reportar una empresa (mentor, evaluador o administrador)" })
  @ApiParam({ name: "empresaId" })
  crear(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Body() dto: CreateReporteDto
  ) {
    return this.reportes.crear(user, empresaId, dto.autorNombre, dto.motivo);
  }

  @Get("empresas/:empresaId/reportes")
  @ApiOperation({ summary: "Listar reportes de una empresa" })
  @ApiParam({ name: "empresaId" })
  listarDeEmpresa(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.reportes.listarDeEmpresa(user, empresaId);
  }

  @Get("reportes-empresas")
  @ApiOperation({ summary: "Listar todos los reportes (solo administrador)" })
  listarTodos(@CurrentUser() user: AuthUser) {
    return this.reportes.listarTodos(user);
  }
}

import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, RequierePrivilegio, type AuthUser } from "@leanstart/backend-commons";
import { CanvasService } from "../molecules/canvas.service";
import { UpdateCanvasDto } from "../atoms/canvas.dto";

@ApiTags("lean-canvas")
@Controller("empresas/:empresaId/canvas")
export class CanvasController {
  constructor(private readonly canvas: CanvasService) {}

  @Patch()
  @RequierePrivilegio("lean_canvas", "editar")
  @ApiOperation({ summary: "Actualizar bloques del Lean Canvas (recalcula canvasBloques)" })
  @ApiParam({ name: "empresaId" })
  actualizar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() dto: UpdateCanvasDto) {
    return this.canvas.actualizar(user, empresaId, dto);
  }

  @Get("historial")
  @ApiOperation({ summary: "Historial de versiones del Lean Canvas (solo lectura)" })
  @ApiParam({ name: "empresaId" })
  historial(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string) {
    return this.canvas.historial(user, empresaId);
  }
}

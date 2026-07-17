import { Body, Controller, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { CanvasService } from "../molecules/canvas.service";
import { UpdateCanvasDto } from "../atoms/canvas.dto";

@ApiTags("lean-canvas")
@Controller("empresas/:empresaId/canvas")
export class CanvasController {
  constructor(private readonly canvas: CanvasService) {}

  @Patch()
  @ApiOperation({ summary: "Actualizar bloques del Lean Canvas (recalcula canvasBloques)" })
  @ApiParam({ name: "empresaId" })
  actualizar(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() dto: UpdateCanvasDto) {
    return this.canvas.actualizar(user, empresaId, dto);
  }
}

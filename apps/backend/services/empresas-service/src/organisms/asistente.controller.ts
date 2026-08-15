import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { AsistenteService } from "../molecules/asistente.service";
import { MensajeChatDto } from "../atoms/asistente.dto";

@ApiTags("asistente")
@Controller("asistente")
export class AsistenteController {
  constructor(private readonly asistente: AsistenteService) {}

  @Post("mensaje")
  @Roles("emprendedor")
  @ApiOperation({ summary: "Enviar un mensaje al asistente conversacional (Empresa + Lean Canvas)" })
  enviarMensaje(@CurrentUser() user: AuthUser, @Body() dto: MensajeChatDto) {
    return this.asistente.enviarMensaje(user, dto);
  }
}

import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CorreosEntrantesService } from "../molecules/correos-entrantes.service";
import { EventoCorreoEntranteDto } from "../atoms/correo-entrante.dto";

@ApiTags("correos-entrantes")
@Controller("correos-entrantes")
export class CorreosEntrantesController {
  constructor(private readonly correosEntrantes: CorreosEntrantesService) {}

  @Post("interno")
  @ApiOperation({ summary: "[Interno] Registra un correo recibido — el api-gateway ya validó la firma del webhook" })
  registrar(@Body() dto: EventoCorreoEntranteDto) {
    return this.correosEntrantes.registrar(dto);
  }
}

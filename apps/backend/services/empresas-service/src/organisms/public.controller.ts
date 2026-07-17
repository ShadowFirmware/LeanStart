import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { EmpresasService } from "../molecules/empresas.service";

@ApiTags("public")
@Controller("public")
export class PublicController {
  constructor(private readonly empresas: EmpresasService) {}

  @Get("empresas")
  @ApiOperation({ summary: "Vitrina pública: solo empresas publicadas, sin autenticación" })
  listarPublicas() {
    return this.empresas.listarPublicas();
  }
}

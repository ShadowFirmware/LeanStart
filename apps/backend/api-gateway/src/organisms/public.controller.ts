import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Public } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("public")
@Controller("public")
export class PublicController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
  }

  @Public()
  @Get("empresas")
  @ApiOperation({ summary: "Vitrina pública: solo empresas publicadas, sin autenticación" })
  listarPublicas() {
    return this.proxy.get(this.baseUrl, "/public/empresas");
  }
}

import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";

@ApiTags("bitacora")
@Roles("administrador")
@Controller("bitacora")
export class BitacoraController {
  private readonly baseUrl: string;

  constructor(private readonly proxy: ProxyService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>("AUTH_SERVICE_URL");
  }

  @Get()
  @ApiOperation({ summary: "Lista la bitácora de auditoría, paginada y filtrable" })
  listar(@CurrentUser() user: AuthUser, @Query() query: Record<string, string>) {
    const qs = new URLSearchParams(query).toString();
    return this.proxy.get(this.baseUrl, `/bitacora${qs ? `?${qs}` : ""}`, user);
  }
}

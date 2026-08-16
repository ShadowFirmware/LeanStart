import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type AuthUser } from "@leanstart/backend-commons";
import { BitacoraService } from "../molecules/bitacora.service";
import { RegistrarBitacoraDto } from "../atoms/bitacora.dto";

@ApiTags("bitacora")
@Controller("bitacora")
export class BitacoraController {
  constructor(private readonly bitacora: BitacoraService) {}

  @Post("interno")
  @Roles()
  @ApiOperation({ summary: "[Interno] Registra una entrada de bitácora — solo para otros microservicios" })
  registrar(@CurrentUser() user: AuthUser, @Body() dto: RegistrarBitacoraDto) {
    return this.bitacora.registrar(user.id, dto);
  }

  @Get()
  @Roles("administrador")
  @ApiOperation({ summary: "Lista la bitácora de auditoría, paginada y filtrable" })
  listar(
    @Query("servicio") servicio?: string,
    @Query("accion") accion?: string,
    @Query("actorUserId") actorUserId?: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.bitacora.listar({
      servicio,
      accion,
      actorUserId,
      desde,
      hasta,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}

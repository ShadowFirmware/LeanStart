import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { NotificacionesService } from "../molecules/notificaciones.service";
import { CreateNotificacionDto } from "../atoms/notificacion.dto";

@ApiTags("notificaciones")
@Controller("notificaciones")
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: "Listar mis notificaciones" })
  listar(@CurrentUser() user: AuthUser) {
    return this.notificaciones.listarDeUsuario(user.id);
  }

  @Post()
  @ApiOperation({ summary: "[Interno] Crear notificación — la disparan otros microservicios" })
  crear(@Body() dto: CreateNotificacionDto) {
    return this.notificaciones.crear(dto);
  }

  @Patch(":id/leida")
  @ApiOperation({ summary: "Marcar una notificación como leída" })
  @ApiParam({ name: "id" })
  marcarLeida(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notificaciones.marcarLeida(user.id, id);
  }

  @Patch("leidas")
  @ApiOperation({ summary: "Marcar todas mis notificaciones como leídas" })
  marcarTodasLeidas(@CurrentUser() user: AuthUser) {
    return this.notificaciones.marcarTodasLeidas(user.id);
  }
}

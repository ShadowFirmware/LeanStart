import { Module } from "@nestjs/common";
import { NotificacionesController } from "./notificaciones.controller";
import { HealthController } from "./health.controller";
import { NotificacionesService } from "../molecules/notificaciones.service";

@Module({
  controllers: [NotificacionesController, HealthController],
  providers: [NotificacionesService],
})
export class NotificacionesModule {}

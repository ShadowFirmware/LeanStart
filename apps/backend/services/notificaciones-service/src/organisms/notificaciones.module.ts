import { Module } from "@nestjs/common";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { NotificacionesController } from "./notificaciones.controller";
import { HealthController } from "./health.controller";
import { NotificacionesService } from "../molecules/notificaciones.service";
import { EmailService } from "../molecules/email.service";

@Module({
  controllers: [NotificacionesController, HealthController],
  providers: [NotificacionesService, EmailService, InternalHttpClient],
})
export class NotificacionesModule {}

import { Module } from "@nestjs/common";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { NotificacionesController } from "./notificaciones.controller";
import { CorreosEntrantesController } from "./correos-entrantes.controller";
import { HealthController } from "./health.controller";
import { NotificacionesService } from "../molecules/notificaciones.service";
import { CorreosEntrantesService } from "../molecules/correos-entrantes.service";
import { EmailService } from "../molecules/email.service";

@Module({
  controllers: [NotificacionesController, CorreosEntrantesController, HealthController],
  providers: [NotificacionesService, CorreosEntrantesService, EmailService, InternalHttpClient],
})
export class NotificacionesModule {}

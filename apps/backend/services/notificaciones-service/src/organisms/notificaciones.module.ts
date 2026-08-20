import { Module } from "@nestjs/common";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { NotificacionesController } from "./notificaciones.controller";
import { CorreosEntrantesController } from "./correos-entrantes.controller";
import { SoporteController } from "./soporte.controller";
import { HealthController } from "./health.controller";
import { NotificacionesService } from "../molecules/notificaciones.service";
import { CorreosEntrantesService } from "../molecules/correos-entrantes.service";
import { SoporteService } from "../molecules/soporte.service";
import { EmailService } from "../molecules/email.service";

@Module({
  controllers: [NotificacionesController, CorreosEntrantesController, SoporteController, HealthController],
  providers: [NotificacionesService, CorreosEntrantesService, SoporteService, EmailService, InternalHttpClient],
})
export class NotificacionesModule {}

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { AuthController } from "./auth.controller";
import { UsuariosController } from "./usuarios.controller";
import { PrivilegiosController } from "./privilegios.controller";
import { EmpresasController } from "./empresas.controller";
import { PublicController } from "./public.controller";
import { CanvasController } from "./canvas.controller";
import { ProductosController } from "./productos.controller";
import { HipotesisController } from "./hipotesis.controller";
import { ObservacionesController } from "./observaciones.controller";
import { CriteriosController } from "./criterios.controller";
import { ViabilidadController } from "./viabilidad.controller";
import { EvaluacionesController } from "./evaluaciones.controller";
import { ReportesGeneradosController } from "./reportes-generados.controller";
import { NotificacionesController } from "./notificaciones.controller";
import { HealthController } from "./health.controller";
import { ProxyService } from "../molecules/proxy.service";
import { LoginRateLimitGuard } from "../molecules/login-rate-limit.guard";
import { TokenRevocationService } from "../molecules/token-revocation.service";

const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>("JWT_SECRET"),
  }),
});

@Module({
  imports: [jwtModule],
  // Exportamos JwtModule y TokenRevocationService para que JwtAuthGuard (registrado
  // como APP_GUARD en AppModule, fuera de este módulo) pueda resolver sus dependencias.
  exports: [jwtModule, TokenRevocationService],
  controllers: [
    AuthController,
    UsuariosController,
    PrivilegiosController,
    EmpresasController,
    PublicController,
    CanvasController,
    ProductosController,
    HipotesisController,
    ObservacionesController,
    CriteriosController,
    ViabilidadController,
    EvaluacionesController,
    ReportesGeneradosController,
    NotificacionesController,
    HealthController,
  ],
  providers: [ProxyService, InternalHttpClient, LoginRateLimitGuard, TokenRevocationService],
})
export class GatewayModule {}

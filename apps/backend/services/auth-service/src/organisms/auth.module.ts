import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { UsuariosController } from "./usuarios.controller";
import { PrivilegiosController } from "./privilegios.controller";
import { HealthController } from "./health.controller";
import { AuthService } from "../molecules/auth.service";
import { UsuariosService } from "../molecules/usuarios.service";
import { PrivilegiosService } from "../molecules/privilegios.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: (config.get<string>("JWT_EXPIRES_IN") ?? "7d") as never },
      }),
    }),
  ],
  controllers: [AuthController, UsuariosController, PrivilegiosController, HealthController],
  providers: [AuthService, UsuariosService, PrivilegiosService],
})
export class AuthModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { AllExceptionsFilter, PrivilegiosGuard, RolesGuard } from "@leanstart/backend-commons";
import { GatewayModule } from "./organisms/gateway.module";
import { JwtAuthGuard } from "./molecules/jwt-auth.guard";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GatewayModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PrivilegiosGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { AllExceptionsFilter, GatewayKeyGuard, PrivilegiosGuard, RolesGuard } from "@leanstart/backend-commons";
import { PrismaModule } from "./prisma/prisma.module";
import { EvaluacionesModule } from "./organisms/evaluaciones.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, EvaluacionesModule],
  providers: [
    { provide: APP_GUARD, useClass: GatewayKeyGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PrivilegiosGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

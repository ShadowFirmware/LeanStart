import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { AllExceptionsFilter, GatewayKeyGuard, PrivilegiosGuard, RolesGuard } from "@leanstart/backend-commons";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./organisms/auth.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  providers: [
    { provide: APP_GUARD, useClass: GatewayKeyGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PrivilegiosGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

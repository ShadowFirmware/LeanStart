import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { CurrentUser, Public, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";
import { LoginRateLimitGuard } from "../molecules/login-rate-limit.guard";
import { SeedRateLimitGuard } from "../molecules/seed-rate-limit.guard";
import { TokenRevocationService } from "../molecules/token-revocation.service";
import { GenerarSemillaDto, LoginDto, RecuperarDto, RegisterDto, ValidarSemillaDto } from "../atoms/auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly baseUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly jwt: JwtService,
    private readonly revocation: TokenRevocationService,
    config: ConfigService
  ) {
    this.baseUrl = config.getOrThrow<string>("AUTH_SERVICE_URL");
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Autorregistro de emprendedor" })
  register(@Body() dto: RegisterDto) {
    return this.proxy.post(this.baseUrl, "/auth/register", dto);
  }

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post("login")
  @ApiOperation({ summary: "Login — shape consumido por el Credentials provider de NextAuth" })
  login(@Body() dto: LoginDto) {
    return this.proxy.post(this.baseUrl, "/auth/login", dto);
  }

  @Public()
  @Post("recuperar")
  @ApiOperation({ summary: "Solicitar recuperación de contraseña" })
  recuperar(@Body() dto: RecuperarDto) {
    return this.proxy.post(this.baseUrl, "/auth/recuperar", dto);
  }

  @Get("me")
  @ApiOperation({ summary: "Perfil del usuario autenticado" })
  me(@CurrentUser() user: AuthUser) {
    return this.proxy.get(this.baseUrl, "/auth/me", user);
  }

  @Patch("me")
  @ApiOperation({ summary: "Actualizar perfil propio" })
  updateMe(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.proxy.patch(this.baseUrl, "/auth/me", body, user);
  }

  @Post("logout")
  @ApiOperation({ summary: "Revocar el token actual (logout real, no solo del lado del cliente)" })
  async logout(@Req() req: Request) {
    const authHeader = req.header("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
    if (!token) return { ok: true };

    // El JwtAuthGuard ya validó este token para llegar hasta aquí; solo lo decodificamos
    // (sin reverificar) para leer jti/exp y calcular cuánto le queda de vida.
    const payload = this.jwt.decode(token) as { jti?: string; exp?: number } | null;
    if (payload?.jti && payload.exp) {
      const ttlSegundos = payload.exp - Math.floor(Date.now() / 1000);
      await this.revocation.revocar(payload.jti, ttlSegundos);
    }
    return { ok: true };
  }

  @Post("seeds/generate")
  @ApiOperation({ summary: "Generar semilla de un solo uso para el login por voz (skill de Alexa)" })
  generarSemilla(@CurrentUser() user: AuthUser, @Body() dto: GenerarSemillaDto) {
    return this.proxy.post(this.baseUrl, "/auth/seeds/generate", dto, user);
  }

  @Public()
  @UseGuards(SeedRateLimitGuard)
  @Post("seeds/validate")
  @ApiOperation({ summary: "Validar semilla y obtener un access token — lo llama la skill de Alexa, sin sesión web" })
  validarSemilla(@Body() dto: ValidarSemillaDto) {
    return this.proxy.post(this.baseUrl, "/auth/seeds/validate", dto);
  }
}

import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { CurrentUser, Public, type AuthUser } from "@leanstart/backend-commons";
import { ProxyService } from "../molecules/proxy.service";
import { LoginRateLimitGuard } from "../molecules/login-rate-limit.guard";
import { TokenRevocationService } from "../molecules/token-revocation.service";
import { SessionPresenceService } from "../molecules/session-presence.service";
import { LoginDto, RecuperarDto, RegisterDto } from "../atoms/auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly baseUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly jwt: JwtService,
    private readonly revocation: TokenRevocationService,
    private readonly presence: SessionPresenceService,
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
  async login(@Body() dto: LoginDto) {
    const respuesta = await this.proxy.post<{ accessToken: string }>(this.baseUrl, "/auth/login", dto);

    // Sesión "presente" desde ya: el cliente recién arranca su heartbeat al
    // recibir esto, así que sin esto la primera petición autenticada (o el
    // primer heartbeat) llegaría con la presencia todavía sin sembrar.
    const payload = this.jwt.decode(respuesta.accessToken) as { jti?: string } | null;
    if (payload?.jti) {
      await this.presence.marcarPresente(payload.jti);
    }
    return respuesta;
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

  @Post("heartbeat")
  @ApiOperation({ summary: "Marca la sesión como activa (el cliente lo llama cada pocos segundos)" })
  async heartbeat(@Req() req: Request) {
    const authHeader = req.header("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
    if (!token) return { ok: true };

    const payload = this.jwt.decode(token) as { jti?: string } | null;
    if (payload?.jti) {
      await this.presence.marcarPresente(payload.jti);
    }
    return { ok: true };
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
}

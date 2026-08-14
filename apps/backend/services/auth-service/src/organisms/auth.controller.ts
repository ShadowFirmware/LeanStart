import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { AuthService } from "../molecules/auth.service";
import { SeedsAlexaService } from "../molecules/seeds-alexa.service";
import { LoginDto } from "../atoms/login.dto";
import { RegisterDto } from "../atoms/register.dto";
import { RecuperarDto } from "../atoms/recuperar.dto";
import { RestablecerDto } from "../atoms/restablecer.dto";
import { UpdateMeDto } from "../atoms/update-me.dto";
import { GenerarSemillaDto, ValidarSemillaDto } from "../atoms/semilla.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly seedsAlexa: SeedsAlexaService
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Autorregistro de emprendedor" })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @ApiOperation({ summary: "Login — shape consumido por el Credentials provider de NextAuth" })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("recuperar")
  @ApiOperation({ summary: "Solicitar recuperación de contraseña (envía un correo con el enlace vía Resend)" })
  recuperar(@Body() dto: RecuperarDto) {
    return this.auth.recuperar(dto.correo);
  }

  @Post("restablecer")
  @ApiOperation({ summary: "Fijar una contraseña nueva a partir del token del correo de recuperación" })
  restablecer(@Body() dto: RestablecerDto) {
    return this.auth.restablecer(dto.token, dto.password);
  }

  @Get("me")
  @ApiOperation({ summary: "Perfil del usuario autenticado" })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch("me")
  @ApiOperation({ summary: "Actualizar perfil propio" })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(user.id, dto);
  }

  @Post("seeds/generate")
  @ApiOperation({ summary: "Generar una semilla de un solo uso para iniciar sesión por voz (skill de Alexa)" })
  generarSemilla(@CurrentUser() user: AuthUser, @Body() dto: GenerarSemillaDto) {
    return this.seedsAlexa.generar(user.id, dto.nombre);
  }

  @Post("seeds/validate")
  @ApiOperation({ summary: "Validar una semilla y emitir un access token (lo llama la skill de Alexa, sin sesión web)" })
  validarSemilla(@Body() dto: ValidarSemillaDto) {
    return this.seedsAlexa.validar(dto.nombre, dto.seed);
  }
}

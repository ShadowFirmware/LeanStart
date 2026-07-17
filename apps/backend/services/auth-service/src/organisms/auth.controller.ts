import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "@leanstart/backend-commons";
import { AuthService } from "../molecules/auth.service";
import { LoginDto } from "../atoms/login.dto";
import { RegisterDto } from "../atoms/register.dto";
import { RecuperarDto } from "../atoms/recuperar.dto";
import { UpdateMeDto } from "../atoms/update-me.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
  @ApiOperation({ summary: "Solicitar recuperación de contraseña (stub, sin envío real de correo)" })
  recuperar(@Body() dto: RecuperarDto) {
    return this.auth.recuperar(dto.correo);
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
}

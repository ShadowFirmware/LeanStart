import { BadRequestException, Body, Controller, Get, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, S3UploadService, type AuthUser } from "@leanstart/backend-commons";
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
    private readonly seedsAlexa: SeedsAlexaService,
    private readonly s3: S3UploadService
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

  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Subir avatar a S3 y guardarlo como el del usuario actual" })
  async subirAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Falta el archivo (campo 'file').");
    const avatarUrl = await this.s3.subirImagen(file, `avatars/${user.id}`);
    await this.auth.updateMe(user.id, { avatarUrl });
    return { avatarUrl };
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

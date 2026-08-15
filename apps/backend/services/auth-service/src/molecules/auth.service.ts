import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import type { Privilegio } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import type { LoginDto } from "../atoms/login.dto";
import type { RegisterDto } from "../atoms/register.dto";
import type { UpdateMeDto } from "../atoms/update-me.dto";
import { PrivilegiosService } from "./privilegios.service";
import { EmailService } from "./email.service";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    /** Rol principal = roles[0]. Se mantiene por compatibilidad. */
    rol: string;
    roles: string[];
    privilegios: Privilegio[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly privilegios: PrivilegiosService,
    private readonly email: EmailService,
    private readonly config: ConfigService
  ) {}

  /** Público: también lo usa SeedsAlexaService para emitir el token tras validar una semilla. */
  async buildAuthResponse(
    user: { id: string; nombre: string; correo: string; rol: string; roles: string[] },
    options?: { expiresIn?: string }
  ): Promise<AuthResponse> {
    const roles = user.roles?.length ? user.roles : [user.rol];
    const privilegios = await this.privilegios.getPrivilegiosEfectivos(user.id, roles);
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        rol: roles[0],
        roles,
        privilegios,
        // Identificador único del token: permite revocarlo puntualmente en logout
        // sin necesitar una tabla de sesiones (ver TokenRevocationService en el gateway).
        jti: crypto.randomUUID(),
      },
      options?.expiresIn ? { expiresIn: options.expiresIn as never } : undefined
    );
    return {
      accessToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.correo,
        rol: roles[0],
        roles,
        privilegios,
      },
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existente = await this.prisma.user.findUnique({ where: { correo: dto.correo } });
    if (existente) {
      throw new ConflictException("Ya existe una cuenta con ese correo.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        passwordHash,
        rol: "emprendedor",
        roles: ["emprendedor"],
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { correo: dto.email } });
    if (!user || user.estado !== "activo") {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const valido = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valido) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const roles = user.roles.length ? user.roles : [user.rol];
    const privilegios = await this.privilegios.getPrivilegiosEfectivos(user.id, roles);
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.correo,
      rol: roles[0],
      roles,
      avatarUrl: user.avatarUrl,
      privilegios,
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        avatarUrl: dto.avatarUrl,
      },
    });
    return { id: user.id, nombre: user.nombre, email: user.correo, avatarUrl: user.avatarUrl };
  }

  /**
   * Responde siempre igual exista o no la cuenta, para no filtrar qué correos
   * están registrados (por eso el envío va fire-and-forget: nunca hace más
   * lenta la respuesta ni la condiciona a que el correo salga bien).
   */
  async recuperar(correo: string): Promise<{ mensaje: string }> {
    const user = await this.prisma.user.findUnique({ where: { correo } });
    if (user) {
      const token = crypto.randomUUID();
      const expiraAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await this.prisma.passwordResetToken.create({ data: { userId: user.id, token, expiraAt } });

      const enlace = `${this.config.getOrThrow<string>("FRONTEND_URL")}/restablecer?token=${token}`;
      void this.email.enviarRecuperacion(correo, enlace).catch(() => undefined);
    }
    return { mensaje: "Si el correo existe, se enviaron instrucciones de recuperación." };
  }

  /** Consume el token del correo de recuperación y fija una contraseña nueva. */
  async restablecer(token: string, password: string): Promise<{ ok: true }> {
    const registro = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!registro || registro.usadoAt || registro.expiraAt.getTime() < Date.now()) {
      throw new UnauthorizedException("El enlace de recuperación no es válido o ya expiró.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: registro.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: registro.id }, data: { usadoAt: new Date() } }),
    ]);
    return { ok: true };
  }
}

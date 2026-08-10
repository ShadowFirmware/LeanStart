import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { Privilegio } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import type { LoginDto } from "../atoms/login.dto";
import type { RegisterDto } from "../atoms/register.dto";
import type { UpdateMeDto } from "../atoms/update-me.dto";
import { PrivilegiosService } from "./privilegios.service";

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    privilegios: Privilegio[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly privilegios: PrivilegiosService
  ) {}

  /** Público: también lo usa SeedsAlexaService para emitir el token tras validar una semilla. */
  async buildAuthResponse(
    user: { id: string; nombre: string; correo: string; rol: string },
    options?: { expiresIn?: string }
  ): Promise<AuthResponse> {
    const privilegios = await this.privilegios.getPrivilegiosDeRol(user.rol);
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        rol: user.rol,
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
        rol: user.rol,
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
    const privilegios = await this.privilegios.getPrivilegiosDeRol(user.rol);
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.correo,
      rol: user.rol,
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
   * Sin proveedor de email todavía: genera un token de recuperación y lo loguea.
   * Responde siempre igual exista o no la cuenta, para no filtrar qué correos están registrados.
   */
  async recuperar(correo: string): Promise<{ mensaje: string }> {
    const user = await this.prisma.user.findUnique({ where: { correo } });
    if (user) {
      const token = crypto.randomUUID();
      // eslint-disable-next-line no-console
      console.warn(`[auth-service] Token de recuperación para ${correo}: ${token}`);
    }
    return { mensaje: "Si el correo existe, se enviaron instrucciones de recuperación." };
  }
}

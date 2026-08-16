import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { BitacoraService } from "./bitacora.service";
import type { CreateUsuarioDto, UpdateUsuarioDto } from "../atoms/usuario.dto";

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService
  ) {}

  private sinPassword(user: { passwordHash: string; [k: string]: unknown }) {
    const { passwordHash: _omit, ...resto } = user;
    return resto;
  }

  async listar() {
    const usuarios = await this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return usuarios.map((u) => this.sinPassword(u));
  }

  async crear(actorUserId: string, dto: CreateUsuarioDto) {
    const existente = await this.prisma.user.findUnique({ where: { correo: dto.correo } });
    if (existente) {
      throw new ConflictException("Ya existe una cuenta con ese correo.");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { nombre: dto.nombre, correo: dto.correo, rol: dto.roles[0], roles: dto.roles, passwordHash },
    });
    await this.bitacora.registrar(actorUserId, {
      servicio: "auth",
      accion: "usuario.crear",
      entidadTipo: "usuario",
      entidadId: user.id,
      entidadDescripcion: user.nombre,
      detalle: `roles: ${dto.roles.join(", ")}`,
    });
    return this.sinPassword(user);
  }

  async editar(actorUserId: string, id: string, dto: UpdateUsuarioDto) {
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        rol: dto.roles[0],
        roles: dto.roles,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
    await this.bitacora.registrar(actorUserId, {
      servicio: "auth",
      accion: "usuario.editar",
      entidadTipo: "usuario",
      entidadId: user.id,
      entidadDescripcion: user.nombre,
      detalle: `roles: ${dto.roles.join(", ")}`,
    });
    return this.sinPassword(user);
  }

  async activar(actorUserId: string, id: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { estado: "activo" } });
    await this.bitacora.registrar(actorUserId, {
      servicio: "auth",
      accion: "usuario.activar",
      entidadTipo: "usuario",
      entidadId: user.id,
      entidadDescripcion: user.nombre,
    });
    return this.sinPassword(user);
  }

  async desactivar(actorUserId: string, id: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { estado: "inactivo" } });
    await this.bitacora.registrar(actorUserId, {
      servicio: "auth",
      accion: "usuario.desactivar",
      entidadTipo: "usuario",
      entidadId: user.id,
      entidadDescripcion: user.nombre,
    });
    return this.sinPassword(user);
  }

  /** Usado por notificaciones-service para resolver a quién mandarle el correo de un aviso. */
  async obtenerInterno(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, nombre: true, correo: true },
    });
    return user;
  }
}

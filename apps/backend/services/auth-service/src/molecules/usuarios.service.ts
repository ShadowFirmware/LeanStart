import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateUsuarioDto, UpdateUsuarioDto } from "../atoms/usuario.dto";

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private sinPassword(user: { passwordHash: string; [k: string]: unknown }) {
    const { passwordHash: _omit, ...resto } = user;
    return resto;
  }

  async listar() {
    const usuarios = await this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return usuarios.map((u) => this.sinPassword(u));
  }

  async crear(dto: CreateUsuarioDto) {
    const existente = await this.prisma.user.findUnique({ where: { correo: dto.correo } });
    if (existente) {
      throw new ConflictException("Ya existe una cuenta con ese correo.");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { nombre: dto.nombre, correo: dto.correo, rol: dto.rol, passwordHash },
    });
    return this.sinPassword(user);
  }

  async editar(id: string, dto: UpdateUsuarioDto) {
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: { nombre: dto.nombre, correo: dto.correo, rol: dto.rol, ...(passwordHash ? { passwordHash } : {}) },
    });
    return this.sinPassword(user);
  }

  async activar(id: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { estado: "activo" } });
    return this.sinPassword(user);
  }

  async desactivar(id: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { estado: "inactivo" } });
    return this.sinPassword(user);
  }
}

import { Injectable } from "@nestjs/common";
import { ACCIONES, MODULOS, type Accion, type Modulo, type Privilegio } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PrivilegiosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Shape que consume el front (`session.user.privilegios`): un array por módulo con sus acciones. */
  async getPrivilegiosDeRol(rolId: string): Promise<Privilegio[]> {
    const filas = await this.prisma.privilegio.findMany({ where: { rolId } });
    return MODULOS.map((modulo) => ({
      modulo,
      acciones: filas.filter((f) => f.modulo === modulo).map((f) => f.accion as Accion),
    }));
  }

  /** Un usuario con varios roles tiene la UNIÓN de lo que cada uno le permite, módulo por módulo. */
  async getPrivilegiosDeRoles(rolIds: string[]): Promise<Privilegio[]> {
    const porRol = await Promise.all(rolIds.map((r) => this.getPrivilegiosDeRol(r)));
    return MODULOS.map((modulo) => {
      const acciones = new Set<Accion>();
      for (const privilegios of porRol) {
        const entrada = privilegios.find((p) => p.modulo === modulo);
        entrada?.acciones.forEach((a) => acciones.add(a));
      }
      return { modulo, acciones: [...acciones] };
    });
  }

  async toggleAccion(rolId: string, modulo: Modulo, accion: Accion) {
    const existente = await this.prisma.privilegio.findUnique({
      where: { rolId_modulo_accion: { rolId, modulo, accion } },
    });
    if (existente) {
      await this.prisma.privilegio.delete({ where: { id: existente.id } });
    } else {
      await this.prisma.privilegio.create({ data: { rolId, modulo, accion } });
    }
    return this.getPrivilegiosDeRol(rolId);
  }

  async toggleModuloCompleto(rolId: string, modulo: Modulo) {
    const actuales = await this.prisma.privilegio.findMany({ where: { rolId, modulo } });
    const tieneTodas = actuales.length === ACCIONES.length;

    await this.prisma.$transaction([
      this.prisma.privilegio.deleteMany({ where: { rolId, modulo } }),
      ...(tieneTodas
        ? []
        : [
            this.prisma.privilegio.createMany({
              data: ACCIONES.map((accion) => ({ rolId, modulo, accion })),
            }),
          ]),
    ]);
    return this.getPrivilegiosDeRol(rolId);
  }

  async toggleAccionColumna(rolId: string, accion: Accion) {
    const filas = await this.prisma.privilegio.findMany({ where: { rolId, accion } });
    const todosLaTienen = filas.length === MODULOS.length;

    await this.prisma.$transaction([
      this.prisma.privilegio.deleteMany({ where: { rolId, accion } }),
      ...(todosLaTienen
        ? []
        : [
            this.prisma.privilegio.createMany({
              data: MODULOS.map((modulo) => ({ rolId, modulo, accion })),
              skipDuplicates: true,
            }),
          ]),
    ]);
    return this.getPrivilegiosDeRol(rolId);
  }

  async setTodos(rolId: string, activar: boolean) {
    await this.prisma.privilegio.deleteMany({ where: { rolId } });
    if (activar) {
      await this.prisma.privilegio.createMany({
        data: MODULOS.flatMap((modulo) => ACCIONES.map((accion) => ({ rolId, modulo, accion }))),
      });
    }
    return this.getPrivilegiosDeRol(rolId);
  }
}

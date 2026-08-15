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

  /**
   * Privilegios reales de un usuario puntual: la unión de sus roles, con las
   * excepciones de `usuario_privilegios` aplicadas encima (otorgado=true agrega,
   * otorgado=false quita). Se le pasan los `roles` ya resueltos para no volver a
   * leer el usuario cuando el llamador (auth.service) ya lo tiene a mano.
   */
  async getPrivilegiosEfectivos(userId: string, roles: string[]): Promise<Privilegio[]> {
    const base = await this.getPrivilegiosDeRoles(roles);
    const overrides = await this.prisma.usuarioPrivilegio.findMany({ where: { userId } });
    return MODULOS.map((modulo) => {
      const acciones = new Set<Accion>(base.find((p) => p.modulo === modulo)?.acciones ?? []);
      for (const o of overrides) {
        if (o.modulo !== modulo) continue;
        if (o.otorgado) acciones.add(o.accion as Accion);
        else acciones.delete(o.accion as Accion);
      }
      return { modulo, acciones: [...acciones] };
    });
  }

  /** Variante para los endpoints "por usuario": solo se conoce el userId, hay que resolver sus roles primero. */
  async getPrivilegiosEfectivosDeUsuario(userId: string): Promise<Privilegio[]> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const roles = user.roles.length ? user.roles : [user.rol];
    return this.getPrivilegiosEfectivos(userId, roles);
  }

  /**
   * Guarda de una sola vez el borrador completo que el admin armó en la
   * matriz para un usuario: cada celda trae su estado FINAL deseado (no un
   * toggle relativo), así que el resultado es exacto sin importar si de paso
   * también cambiaron los roles del usuario en el mismo guardado. Solo se
   * guardan filas de excepción donde el estado deseado difiere de lo que el
   * usuario ya tendría solo por sus roles — el resto se borra (o ni se toca).
   */
  async setCeldasUsuario(
    userId: string,
    cambios: Array<{ modulo: Modulo; accion: Accion; activar: boolean }>
  ): Promise<Privilegio[]> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const roles = user.roles.length ? user.roles : [user.rol];
    const base = await this.getPrivilegiosDeRoles(roles);
    const baseSet = new Set(base.flatMap((p) => p.acciones.map((a) => `${p.modulo}:${a}`)));

    const aBorrar = cambios.filter((c) => c.activar === baseSet.has(`${c.modulo}:${c.accion}`));
    const aGuardar = cambios.filter((c) => c.activar !== baseSet.has(`${c.modulo}:${c.accion}`));

    await this.prisma.$transaction([
      ...aBorrar.map((c) =>
        this.prisma.usuarioPrivilegio.deleteMany({ where: { userId, modulo: c.modulo, accion: c.accion } })
      ),
      ...aGuardar.map((c) =>
        this.prisma.usuarioPrivilegio.upsert({
          where: { userId_modulo_accion: { userId, modulo: c.modulo, accion: c.accion } },
          update: { otorgado: c.activar },
          create: { userId, modulo: c.modulo, accion: c.accion, otorgado: c.activar },
        })
      ),
    ]);
    return this.getPrivilegiosEfectivos(userId, roles);
  }
}

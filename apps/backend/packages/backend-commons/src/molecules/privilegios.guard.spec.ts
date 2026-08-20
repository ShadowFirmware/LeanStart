import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { PrivilegiosGuard, PRIVILEGIO_KEY, type PrivilegioRequerido } from "./privilegios.guard";
import type { AuthUser } from "../atoms/auth-user";

function makeContext(authUser: AuthUser | undefined, requerido: PrivilegioRequerido | undefined) {
  const reflector = new Reflector();
  jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(requerido);

  const request = { authUser };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  return { guard: new PrivilegiosGuard(reflector), context };
}

describe("PrivilegiosGuard", () => {
  it("permite el paso cuando el endpoint no declara @RequierePrivilegio", () => {
    const { guard, context } = makeContext(
      { id: "u1", rol: "emprendedor", roles: ["emprendedor"], privilegios: [] },
      undefined
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("permite el paso cuando el usuario tiene el privilegio exacto (módulo + acción)", () => {
    const { guard, context } = makeContext(
      {
        id: "u1",
        rol: "emprendedor",
        roles: ["emprendedor"],
        privilegios: [{ modulo: "empresas", acciones: ["ver", "crear", "editar", "eliminar"] }],
      },
      { modulo: "empresas", accion: "eliminar" }
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rechaza cuando el usuario tiene el módulo pero no la acción requerida", () => {
    const { guard, context } = makeContext(
      {
        id: "u1",
        rol: "mentor",
        roles: ["mentor"],
        privilegios: [{ modulo: "empresas", acciones: ["ver"] }],
      },
      { modulo: "empresas", accion: "eliminar" }
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("rechaza cuando el usuario no tiene ningún privilegio sobre el módulo", () => {
    const { guard, context } = makeContext(
      { id: "u1", rol: "evaluador", roles: ["evaluador"], privilegios: [] },
      { modulo: "usuarios", accion: "crear" }
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("expone la metadata bajo la misma llave que lee el guard", () => {
    expect(PRIVILEGIO_KEY).toBe("leanstart:privilegio");
  });
});

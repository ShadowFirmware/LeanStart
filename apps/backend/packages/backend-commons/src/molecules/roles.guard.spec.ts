import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { RolesGuard } from "./roles.guard";
import type { AuthUser } from "../atoms/auth-user";
import type { Role } from "../atoms/roles";

function makeContext(authUser: AuthUser | undefined, roles: Role[] | undefined) {
  const reflector = new Reflector();
  jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(roles);

  const request = { authUser };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  return { guard: new RolesGuard(reflector), context };
}

describe("RolesGuard", () => {
  it("permite el paso cuando el endpoint no declara @Roles", () => {
    const { guard, context } = makeContext(
      { id: "u1", rol: "emprendedor", roles: ["emprendedor"], privilegios: [] },
      undefined
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("permite el paso cuando el usuario tiene uno de los roles requeridos", () => {
    const { guard, context } = makeContext(
      { id: "u1", rol: "administrador", roles: ["administrador"], privilegios: [] },
      ["administrador", "evaluador"]
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rechaza cuando el usuario no tiene ninguno de los roles requeridos", () => {
    const { guard, context } = makeContext(
      { id: "u1", rol: "emprendedor", roles: ["emprendedor"], privilegios: [] },
      ["administrador"]
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("rechaza cuando no hay usuario autenticado en la request", () => {
    const { guard, context } = makeContext(undefined, ["administrador"]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("permite el paso si al menos uno de los roles múltiples del usuario coincide", () => {
    const { guard, context } = makeContext(
      { id: "u1", rol: "emprendedor", roles: ["emprendedor", "mentor"], privilegios: [] },
      ["mentor"]
    );
    expect(guard.canActivate(context)).toBe(true);
  });
});

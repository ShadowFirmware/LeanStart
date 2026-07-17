import { ForbiddenException } from "@nestjs/common";
import type { AuthUser } from "@leanstart/backend-commons";

/** Filtro Prisma de aislamiento por dueño/mentor/evaluador, según el rol de quien consulta. */
export function whereScope(user: AuthUser): Record<string, unknown> {
  switch (user.rol) {
    case "administrador":
      return {};
    case "emprendedor":
      return { ownerId: user.id };
    case "mentor":
      return { mentorId: user.id };
    case "evaluador":
      return { evaluadorId: user.id };
    default:
      throw new ForbiddenException("Rol no reconocido.");
  }
}

export function puedeVerEmpresa(
  user: AuthUser,
  empresa: { ownerId: string; mentorId: string | null; evaluadorId: string | null }
): boolean {
  if (user.rol === "administrador") return true;
  if (user.rol === "emprendedor") return empresa.ownerId === user.id;
  if (user.rol === "mentor") return empresa.mentorId === user.id;
  if (user.rol === "evaluador") return empresa.evaluadorId === user.id;
  return false;
}

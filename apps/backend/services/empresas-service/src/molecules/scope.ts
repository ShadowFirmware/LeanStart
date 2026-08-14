import { ForbiddenException } from "@nestjs/common";
import type { AuthUser } from "@leanstart/backend-commons";

/** Filtro Prisma de aislamiento por dueño/mentor/evaluador, según TODOS los roles de quien
 *  consulta (un usuario puede tener varios a la vez — ve la unión de lo que cada uno le permite). */
export function whereScope(user: AuthUser): Record<string, unknown> {
  if (user.roles.includes("administrador")) return {};

  const or: Record<string, unknown>[] = [];
  if (user.roles.includes("emprendedor")) or.push({ ownerId: user.id });
  if (user.roles.includes("mentor")) or.push({ mentorId: user.id });
  if (user.roles.includes("evaluador")) or.push({ evaluadorId: user.id });

  if (or.length === 0) throw new ForbiddenException("Rol no reconocido.");
  return or.length === 1 ? or[0] : { OR: or };
}

export function puedeVerEmpresa(
  user: AuthUser,
  empresa: { ownerId: string; mentorId: string | null; evaluadorId: string | null }
): boolean {
  if (user.roles.includes("administrador")) return true;
  if (user.roles.includes("emprendedor") && empresa.ownerId === user.id) return true;
  if (user.roles.includes("mentor") && empresa.mentorId === user.id) return true;
  if (user.roles.includes("evaluador") && empresa.evaluadorId === user.id) return true;
  return false;
}

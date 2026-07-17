// Espejo de apps/frontend/commons/src/types/index.ts — mantener sincronizado.

export type Role = "administrador" | "emprendedor" | "mentor" | "evaluador";

export type Modulo =
  | "usuarios"
  | "empresas"
  | "productos"
  | "lean_canvas"
  | "hipotesis"
  | "mentorias"
  | "evaluaciones"
  | "reportes";

export type Accion = "ver" | "crear" | "editar" | "eliminar" | "aprobar" | "exportar";

export const MODULOS: Modulo[] = [
  "usuarios",
  "empresas",
  "productos",
  "lean_canvas",
  "hipotesis",
  "mentorias",
  "evaluaciones",
  "reportes",
];

export const ACCIONES: Accion[] = ["ver", "crear", "editar", "eliminar", "aprobar", "exportar"];

export interface Privilegio {
  modulo: Modulo;
  acciones: Accion[];
}

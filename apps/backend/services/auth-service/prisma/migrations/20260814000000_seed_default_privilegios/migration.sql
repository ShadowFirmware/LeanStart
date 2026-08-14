-- Siembra los privilegios por defecto de emprendedor/mentor/evaluador (y
-- reafirma los de administrador). El script prisma/seed.ts que ya definía
-- estos valores nunca se corrió contra la base de producción — a diferencia
-- de las migraciones, no se ejecuta solo en cada deploy. ON CONFLICT DO
-- NOTHING: si alguien ya tocó estos permisos a mano desde la UI, no se
-- pisan, solo se agregan las filas que faltan.

-- administrador
INSERT INTO "privilegios" ("id", "rolId", "modulo", "accion") VALUES
  (gen_random_uuid(), 'administrador', 'usuarios', 'ver'),
  (gen_random_uuid(), 'administrador', 'usuarios', 'crear'),
  (gen_random_uuid(), 'administrador', 'usuarios', 'editar'),
  (gen_random_uuid(), 'administrador', 'empresas', 'ver'),
  (gen_random_uuid(), 'administrador', 'productos', 'ver'),
  (gen_random_uuid(), 'administrador', 'lean_canvas', 'ver'),
  (gen_random_uuid(), 'administrador', 'hipotesis', 'ver'),
  (gen_random_uuid(), 'administrador', 'mentorias', 'ver'),
  (gen_random_uuid(), 'administrador', 'mentorias', 'editar'),
  (gen_random_uuid(), 'administrador', 'evaluaciones', 'ver'),
  (gen_random_uuid(), 'administrador', 'evaluaciones', 'editar'),
  (gen_random_uuid(), 'administrador', 'reportes', 'ver'),
  (gen_random_uuid(), 'administrador', 'reportes', 'exportar')
ON CONFLICT ("rolId", "modulo", "accion") DO NOTHING;

-- emprendedor
INSERT INTO "privilegios" ("id", "rolId", "modulo", "accion") VALUES
  (gen_random_uuid(), 'emprendedor', 'empresas', 'ver'),
  (gen_random_uuid(), 'emprendedor', 'empresas', 'crear'),
  (gen_random_uuid(), 'emprendedor', 'empresas', 'editar'),
  (gen_random_uuid(), 'emprendedor', 'empresas', 'eliminar'),
  (gen_random_uuid(), 'emprendedor', 'productos', 'ver'),
  (gen_random_uuid(), 'emprendedor', 'productos', 'crear'),
  (gen_random_uuid(), 'emprendedor', 'productos', 'editar'),
  (gen_random_uuid(), 'emprendedor', 'productos', 'eliminar'),
  (gen_random_uuid(), 'emprendedor', 'lean_canvas', 'ver'),
  (gen_random_uuid(), 'emprendedor', 'lean_canvas', 'editar'),
  (gen_random_uuid(), 'emprendedor', 'hipotesis', 'ver'),
  (gen_random_uuid(), 'emprendedor', 'hipotesis', 'crear'),
  (gen_random_uuid(), 'emprendedor', 'hipotesis', 'editar'),
  (gen_random_uuid(), 'emprendedor', 'hipotesis', 'eliminar'),
  (gen_random_uuid(), 'emprendedor', 'mentorias', 'ver'),
  (gen_random_uuid(), 'emprendedor', 'evaluaciones', 'ver'),
  (gen_random_uuid(), 'emprendedor', 'reportes', 'ver')
ON CONFLICT ("rolId", "modulo", "accion") DO NOTHING;

-- mentor
INSERT INTO "privilegios" ("id", "rolId", "modulo", "accion") VALUES
  (gen_random_uuid(), 'mentor', 'empresas', 'ver'),
  (gen_random_uuid(), 'mentor', 'productos', 'ver'),
  (gen_random_uuid(), 'mentor', 'lean_canvas', 'ver'),
  (gen_random_uuid(), 'mentor', 'hipotesis', 'ver'),
  (gen_random_uuid(), 'mentor', 'hipotesis', 'editar'),
  (gen_random_uuid(), 'mentor', 'hipotesis', 'aprobar'),
  (gen_random_uuid(), 'mentor', 'mentorias', 'ver'),
  (gen_random_uuid(), 'mentor', 'mentorias', 'crear'),
  (gen_random_uuid(), 'mentor', 'mentorias', 'editar'),
  (gen_random_uuid(), 'mentor', 'mentorias', 'aprobar'),
  (gen_random_uuid(), 'mentor', 'reportes', 'ver')
ON CONFLICT ("rolId", "modulo", "accion") DO NOTHING;

-- evaluador
INSERT INTO "privilegios" ("id", "rolId", "modulo", "accion") VALUES
  (gen_random_uuid(), 'evaluador', 'empresas', 'ver'),
  (gen_random_uuid(), 'evaluador', 'productos', 'ver'),
  (gen_random_uuid(), 'evaluador', 'lean_canvas', 'ver'),
  (gen_random_uuid(), 'evaluador', 'hipotesis', 'ver'),
  (gen_random_uuid(), 'evaluador', 'evaluaciones', 'ver'),
  (gen_random_uuid(), 'evaluador', 'evaluaciones', 'crear'),
  (gen_random_uuid(), 'evaluador', 'evaluaciones', 'editar'),
  (gen_random_uuid(), 'evaluador', 'evaluaciones', 'aprobar'),
  (gen_random_uuid(), 'evaluador', 'reportes', 'ver')
ON CONFLICT ("rolId", "modulo", "accion") DO NOTHING;

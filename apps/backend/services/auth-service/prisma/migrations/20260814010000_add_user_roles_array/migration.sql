-- Agrega "roles" (array) como nueva fuente de verdad para autorización,
-- manteniendo "rol" como rol principal (= roles[0]) para no romper nada
-- que todavía lo lea directamente.
ALTER TABLE "users" ADD COLUMN "roles" TEXT[] NOT NULL DEFAULT '{}';
UPDATE "users" SET "roles" = ARRAY["rol"];
ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT;

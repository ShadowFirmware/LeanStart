-- Crea el rol y las 4 bases de datos que el backend de LeanStart necesita,
-- contra un Postgres nativo de Windows (sin Docker).
--
-- Uso: psql -U postgres -f scripts/create-databases.sql
-- (te pedirá la contraseña del superusuario "postgres" que definiste al instalar).

CREATE ROLE leanstart WITH LOGIN PASSWORD 'leanstart' CREATEDB;

CREATE DATABASE leanstart_auth OWNER leanstart;
CREATE DATABASE leanstart_empresas OWNER leanstart;
CREATE DATABASE leanstart_evaluaciones OWNER leanstart;
CREATE DATABASE leanstart_notificaciones OWNER leanstart;

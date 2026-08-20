# Arquitectura Backend — Microservicios

LeanStart implementa el backend como un monorepo **pnpm** independiente en `apps/backend/`, separado de los workspaces npm del frontend (`apps/frontend/*`). Cada pieza es un microservicio NestJS aislado, con su propia base de datos PostgreSQL, su propio `package.json` y su propia documentación interactiva (Scalar).

## Estructura

```
apps/backend/
├── scripts/create-databases.sql  Crea rol + 4 DBs en el Postgres nativo de Windows
├── packages/
│   └── backend-commons/          @leanstart/backend-commons — piezas compartidas
├── services/
│   ├── auth-service/              :4001 — usuarios, login (JWT), privilegios
│   ├── empresas-service/          :4002 — empresas, canvas, productos, hipótesis, observaciones
│   ├── evaluaciones-service/      :4003 — criterios, viabilidad, evaluaciones, reportes
│   └── notificaciones-service/    :4004 — bandeja de notificaciones
├── api-gateway/                   :4000 — único punto de entrada público
└── dev-cli/                       Panel de arranque interactivo (`pnpm dev`)
```

## Por qué microservicios por dominio (y no por rol)

Los límites de servicio reflejan 1:1 los `*-front` que ya existían en el frontend (`empresas-front`, `administrador-front` → evaluaciones, `notificaciones-front`), en vez de un servicio por rol de usuario. Un servicio por rol habría duplicado la lógica de "empresas" en emprendedor/mentor/evaluador/admin; por dominio, cada regla de negocio vive en un solo lugar.

`mentorias` **no** es un microservicio aparte: en el modelo real no hay una entidad "mentoría" independiente — es la combinación de `Empresa.mentorId` + `Observacion`, ambas ya dentro de `empresas-service`.

## Convención "Atomic Design" por capas

Cada servicio (y el gateway) organiza su código en 4 capas, con una relectura deliberada de la metodología de Atomic Design para el backend:

```
src/
  atoms/        DTOs (request/response), enums, funciones puras de cálculo — sin DI de Nest
  molecules/    servicios de dominio (reglas de negocio) — usan atoms + PrismaService
  organisms/    módulos NestJS + controllers — exponen molecules como HTTP
  app.module.ts "template": compone organisms + guards/filtros globales + Scalar
```

No es un patrón nativo de NestJS — es una convención de carpetas para que la jerarquía atoms→molecules→organisms→template sea idéntica en los 5 proyectos y cualquiera pueda orientarse igual en todos.

## `@leanstart/backend-commons`

Análogo al `commons` del frontend. Sin dependencias de infraestructura (no incluye Prisma, porque cada servicio genera su propio cliente desde su propio schema): enums de dominio espejo de `apps/frontend/commons/src/types`, `GatewayKeyGuard`, `CurrentUser`, `RolesGuard`/`@Roles`, `PrivilegiosGuard`/`@RequierePrivilegio`, `Public`, `AllExceptionsFilter`, `setupApiDocs` (helper de Scalar/Swagger) e `InternalHttpClient` (fetch nativo con headers de confianza para llamadas servicio-a-servicio).

## Seguridad entre servicios: "gateway de confianza"

- El **api-gateway** es el único servicio que valida el JWT (`JwtAuthGuard`, con `@nestjs/jwt`).
- Tras validar, propaga la identidad ya resuelta a los servicios internos vía headers (`x-user-id`, `x-user-rol`, `x-user-privilegios`) más una llave compartida `x-internal-key`.
- Los 4 microservicios internos **nunca** vuelven a validar el JWT: solo verifican la llave interna (`GatewayKeyGuard`) y confían en esos headers. Esto evita duplicar lógica de JWT en 4 lugares, a costa de asumir que la red interna (docker network / mismo host en dev) no es alcanzable desde fuera.
- `RolesGuard`/`PrivilegiosGuard` corren tanto en el gateway como en cada servicio (defensa en profundidad).

## Comunicación entre servicios (sagas HTTP simples)

No hay bus de mensajería — las pocas operaciones multi-servicio son llamadas HTTP directas vía `InternalHttpClient`:

- **Finalizar evaluación** (`evaluaciones-service`): pide la empresa+hipótesis a `empresas-service`, calcula el score (puerto literal de `calcularReporte` del frontend), actualiza el estado de la empresa en `empresas-service`, y notifica al emprendedor en `notificaciones-service`.
- **Observaciones del mentor** (`empresas-service`): al comentar, avanza el estado de la empresa y notifica en `notificaciones-service`.

## Base de datos: una por servicio

Postgres corre **nativo en Windows** (sin Docker — este equipo no tiene WSL2/Hyper-V disponible). Una sola instancia aloja 4 bases lógicas independientes (`leanstart_auth`, `leanstart_empresas`, `leanstart_evaluaciones`, `leanstart_notificaciones`), cada una con su propio `schema.prisma`. Ningún servicio hace `JOIN` contra la base de otro — si necesita datos de otro dominio, los pide por HTTP.

`apps/backend/scripts/create-databases.sql` crea el rol `leanstart` y las 4 bases contra un Postgres nativo recién instalado (ver "Comandos" abajo).

Redis (usado solo por el api-gateway para el rate-limit de `/auth/login`) también corre nativo — vía [Memurai](https://www.memurai.com/) (Redis-compatible para Windows) o un Redis administrado en la nube (p. ej. Upstash). El código no distingue el origen: solo lee `REDIS_URL`.

Prisma 7 ya no permite `url` en el datasource del schema; la conexión para `migrate`/`generate` vive en `prisma.config.ts` (`datasource.url` vía `env("DATABASE_URL")`), mientras que en runtime cada `PrismaService` usa el driver adapter `@prisma/adapter-pg`.

## Documentación de API (Scalar + Swagger)

Cada servicio expone, siguiendo el mismo patrón en los 5 proyectos:

| Ruta | Qué es |
| --- | --- |
| `/docs` | Scalar (documentación interactiva, es la principal) |
| `/api` | Swagger UI clásico |
| `/api-json` | OpenAPI JSON crudo (para importar en Apidog/Postman) |

El **api-gateway** es la documentación pública real del sistema (`http://localhost:4000/docs`): expone Bearer Auth y controllers explícitos por dominio (no un proxy ciego), así Scalar documenta cada ruta pública con su tag, resumen y parámetros reales. Los `/docs` de los 4 microservicios internos son para desarrollo (inspeccionar un servicio aislado), no para consumo externo.

## `dev-cli`: panel de arranque

`apps/backend/dev-cli` (`pnpm dev`) pinta un banner y un checkbox de servicios — `api-gateway` sale forzado y no se puede desmarcar — recuerda que Postgres/Redis nativos deben estar corriendo, arranca cada servicio elegido con logs prefijados por color, y permite abrir Prisma Studio de cualquiera de los 4 servicios (cada uno en su propio puerto, porque hay 4 esquemas Prisma distintos). `Ctrl+C` apaga todo; `pnpm dev --dry` solo muestra el plan sin lanzar nada.

## Comandos

Requisitos previos (una sola vez, sin Docker):
1. Instalar [PostgreSQL para Windows](https://www.postgresql.org/download/windows/) (recuerda la contraseña del superusuario `postgres`) e instalar [Memurai](https://www.memurai.com/get-memurai) (o usar un Redis en la nube) — ambos quedan como servicios de Windows arrancando solos.
2. Crear el rol y las 4 bases: `psql -U postgres -f apps/backend/scripts/create-databases.sql`.

```bash
cd apps/backend
pnpm install                      # instala todo el workspace pnpm (auto-compila backend-commons)

# por cada servicio (auth-service, empresas-service, evaluaciones-service, notificaciones-service):
pnpm --filter @leanstart/auth-service prisma:migrate
pnpm --filter @leanstart/auth-service seed        # solo auth-service y evaluaciones-service tienen seed

cd dev-cli && pnpm dev            # panel interactivo — levanta gateway + servicios elegidos
```

## Variables de entorno relevantes

Cada servicio trae su `.env.example`. Las que deben coincidir **entre servicios** para que la cadena de confianza funcione:

- `JWT_SECRET`: igual en `auth-service` (firma el token) y `api-gateway` (lo valida).
- `INTERNAL_KEY`: igual en los 5 proyectos (api-gateway + 4 servicios).

## Patrones de diseño aplicados

No son patrones GoF "de manual" añadidos por completitud — cada uno resuelve un problema concreto que ya existía en el código:

- **Strategy vía Guards** (`RolesGuard`, `PrivilegiosGuard`, `GatewayKeyGuard`): cada guard encapsula una estrategia de autorización intercambiable que Nest resuelve por reflexión (`@Roles`, `@RequierePrivilegio`), sin que el controller sepa cómo se decide el acceso. Permite apilar rol (grueso) + privilegio (módulo+acción, fino) sin duplicar lógica en cada endpoint — ver más abajo.
- **Facade/Adapter** (`InternalHttpClient`): esconde fetch nativo + headers de confianza (`x-internal-key`, `x-user-*`) detrás de una API mínima (`get/post/patch/delete`), así ningún servicio arma esos headers a mano ni repite el parseo de errores upstream.
- **Repository delgado** (`PrismaService` por servicio): aísla el resto del código de los detalles del driver adapter (`@prisma/adapter-pg`) — si cambia cómo se conecta Prisma, solo cambia ese archivo.
- **DTO como frontera de I/O**: todo controller recibe/devuelve DTOs validados con `class-validator`, nunca entidades de Prisma crudas — evita que un cambio de esquema filtre campos internos a la respuesta HTTP.

## Multirol y multiprivilegio — cómo se aplican de verdad

Dos capas, no una:

1. **Rol** (`@Roles(...)` + `RolesGuard`): grueso — "¿este endpoint es para administradores?".
2. **Privilegio** (`@RequierePrivilegio(modulo, accion)` + `PrivilegiosGuard`): fino — el JWT lleva los privilegios del usuario (tabla `Privilegio`, editable desde `/administrador/roles-privilegios`), el gateway los reenvía en `x-user-privilegios` a los servicios internos, y cada mutación relevante (`empresas`, `productos`, `lean_canvas`, `hipotesis`, `usuarios`, `evaluaciones`) exige el privilegio exacto — no solo el rol. Antes de esto, un mentor o evaluador con acceso de *lectura* a una empresa ajena podía, en teoría, llamar directo a `PATCH /empresas/:id/canvas` porque el único chequeo era de visibilidad, no de acción; con `@RequierePrivilegio("lean_canvas", "editar")` esa ruta ahora la cierra el propio backend, no solo el hecho de que el frontend no muestre el botón.

El frontend espeja la misma regla con `usePrivilegios().puede(modulo, accion)` (`apps/frontend/commons/src/hooks/use-privilegios.ts`) para ocultar la acción en la UI — pero la fuente de verdad es siempre el guard del backend.

## Automated tests y CI

`packages/backend-commons` y `evaluaciones-service` tienen pruebas unitarias con Jest (`pnpm test` en cada uno): los guards de autorización (incluyendo los casos negativos de `PrivilegiosGuard`/`RolesGuard`) y el algoritmo de reordenamiento/inserción de niveles de viabilidad. `.github/workflows/ci.yml` corre esas pruebas y compila los 5 servicios más el frontend en cada push/PR.

## Estado del frontend

El frontend ya no es solo modo demo: `live-sync.tsx` carga empresas, notificaciones, perfil y criterios desde el api-gateway real al iniciar sesión (con polling corto para notificaciones), y `auth.ts` autentica contra `/auth/login`. `NEXT_PUBLIC_DEMO_MODE` sigue existiendo como apagador explícito para desarrollar sin backend levantado, no como el modo por defecto.

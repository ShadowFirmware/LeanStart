# auth-service — :4001

Usuarios, login (emite el JWT), recuperación de contraseña por correo (Resend),
bitácora de auditoría, y la tabla `Privilegio` que respalda el sistema de
privilegios dinámicos (módulo + acción) — ver `RequierePrivilegio`/`PrivilegiosGuard`
en `@leanstart/backend-commons`.

## Correr

```bash
cp .env.example .env
pnpm prisma:migrate
pnpm seed        # crea admin@leanstart.dev / demo@leanstart.dev / mentor@leanstart.dev / evaluador@leanstart.dev — password Leanstart123!
pnpm start:dev
```

## Tests

```bash
pnpm test
```

## Notas

- Sin `RESEND_API_KEY`, el correo de recuperación de contraseña no se envía —
  el enlace se registra en el log del servicio en su lugar (no revienta el flujo).
- El seed (`prisma/seed.ts`) es la fuente de los privilegios por defecto de cada
  rol; si agregas un módulo/acción nuevo, actualízalo ahí también.

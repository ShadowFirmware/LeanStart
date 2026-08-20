# empresas-service — :4002

Empresas, Lean Canvas, productos, hipótesis y observaciones (colaboración
mentor ⇄ emprendedor). El dominio con más superficie del sistema.

## Correr

```bash
cp .env.example .env
pnpm prisma:migrate
pnpm start:dev
```

## Autorización

Además de `@Roles(...)`, los endpoints de escritura (crear/editar/eliminar
empresa, canvas, productos, hipótesis) exigen el privilegio exacto vía
`@RequierePrivilegio(modulo, accion)` — no basta con que el usuario *vea* la
empresa (scoping de `empresas.obtener`), también necesita el privilegio de esa
acción. Ver `docs/backend-architecture.md` → "Multirol y multiprivilegio".

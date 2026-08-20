# api-gateway — :4000

Único servicio público del backend. Valida el JWT (`JwtAuthGuard`) y reenvía cada
petición a su microservicio interno con la identidad ya resuelta (`x-user-id`,
`x-user-rol`, `x-user-roles`, `x-user-privilegios`) más la llave compartida
`x-internal-key`. Ver `docs/backend-architecture.md` ("Seguridad entre servicios")
para el porqué de este diseño.

## Correr

```bash
cp .env.example .env   # ajusta JWT_SECRET/INTERNAL_KEY para que coincidan con los demás servicios
pnpm start:dev
```

Docs interactivas en `http://localhost:4000/docs` (Scalar) — es la documentación
pública real del sistema; los `/docs` de los servicios internos son solo para
desarrollo aislado.

## Variables de entorno

Ver `.env.example`. Las que **deben coincidir** con otros servicios: `JWT_SECRET`
(auth-service la firma, el gateway la valida) e `INTERNAL_KEY` (los 5 proyectos).
`REDIS_URL` alimenta el rate-limit de `/auth/login`; sin Redis levantado, el
servicio sigue arrancando pero ese rate-limit no aplica.

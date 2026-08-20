# notificaciones-service — :4004

Bandeja de notificaciones in-app y correos entrantes (webhook de Resend
Inbound). El resto de servicios lo llaman por HTTP (`InternalHttpClient`)
cuando ocurre algo que amerita avisar a un usuario — nunca al revés.

## Correr

```bash
cp .env.example .env
pnpm prisma:migrate
pnpm start:dev
```

## Notas

- Sin `RESEND_API_KEY`, las notificaciones se siguen creando in-app; solo no
  se manda el correo.
- `/correos-entrantes/webhook` valida la firma con `RESEND_WEBHOOK_SECRET` —
  sin ella, rechaza todo con 401 en vez de aceptar correos sin verificar.

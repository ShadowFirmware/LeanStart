# evaluaciones-service — :4003

Criterios de evaluación, puntajes, comentarios, cálculo del score de
viabilidad y sus niveles configurables, y el registro de reportes exportados.

## Correr

```bash
cp .env.example .env
pnpm prisma:migrate
pnpm seed        # criterios de evaluación por defecto
pnpm start:dev
```

## Tests

```bash
pnpm test
```

Cubre los guards de autorización (heredados de `backend-commons`) y el
algoritmo de reordenamiento/inserción de `ViabilidadService` (preservación de
ancho de tramo, inserción por posición, el último nivel siempre cierra en 100)
con un fake de Prisma en memoria — sin necesidad de base de datos para correr
la suite.

# Seed Service (temporal)

Backend mínimo para probar el login por semilla de un solo uso de la skill
de Alexa (`Alexa/index.js`). No es el backend definitivo del proyecto
(ese será NestJS, ver README raíz); esto solo simula, del lado del
servidor, lo que más adelante hará el botón "Generar nueva semilla" del
panel del empresario.

## Uso

```bash
cd seed-service
npm install
npm start
# Escuchando en http://localhost:3001
```

La skill de Alexa (`Alexa/index.js`) llama a este servicio usando la
variable de entorno `SEED_API_URL` (por defecto `http://localhost:3001`).

## Probar el flujo sin UI

1. Generar una semilla nueva para un empresario (esto es lo que hará el
   botón en la página cuando exista):

   ```bash
   curl -X POST http://localhost:3001/auth/seeds/generate \
     -H "Content-Type: application/json" \
     -d '{"username":"Daniel"}'
   # -> {"username":"daniel","seed":"4829"}
   ```

2. En la skill de Alexa (o directo contra el endpoint), validar nombre +
   semilla. Si es correcta, queda consumida y ya no sirve para un
   siguiente login:

   ```bash
   curl -X POST http://localhost:3001/auth/seeds/validate \
     -H "Content-Type: application/json" \
     -d '{"username":"Daniel","seed":"4829"}'
   # -> {"valid":true}

   curl -X POST http://localhost:3001/auth/seeds/validate \
     -H "Content-Type: application/json" \
     -d '{"username":"Daniel","seed":"4829"}'
   # -> {"valid":false,"reason":"SEED_ALREADY_USED"}
   ```

3. Consultar el estado de la semilla activa de un usuario (solo para
   depuración; en el backend real esto no debe exponerse así):

   ```bash
   curl http://localhost:3001/auth/seeds/daniel
   ```

4. Consultar los proyectos de ejemplo de un usuario (usado por
   `GetProjectStatusIntent` y `GetMentorCommentsIntent` de la skill; ver
   datos en `projects.js`, hoy solo hay datos para `"daniel"`):

   ```bash
   curl "http://localhost:3001/projects?username=daniel"
   # -> {"username":"daniel","projects":[{"nombre":"SnackEco","estado":"en_mentoria","comentarios":[...]}, ...]}
   ```

## Notas

- El store es en memoria: se reinicia cada vez que se reinicia el
  servicio. Suficiente para pruebas, no para producción.
- Si el usuario no existe todavía, `POST /auth/seeds/generate` lo crea
  automáticamente (para no depender de un registro previo mientras se
  prueba).

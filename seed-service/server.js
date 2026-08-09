/**
 * Servicio HTTP temporal que emula el contrato del api-gateway real para el
 * flujo de login por semilla de la skill de Alexa (Alexa/index.js), sin
 * necesitar levantar todo el stack de NestJS/Postgres/Redis en local.
 *
 * Endpoints (mismos paths y shapes que expone el api-gateway real):
 *  POST /auth/seeds/generate   { nombre } -> { seed, expiraEn }
 *      Simula el botón "Generar nueva semilla" que tendrá el empresario
 *      en la página (todavía sin UI: se prueba por HTTP).
 *  POST /auth/seeds/validate   { nombre, seed } -> { valid, reason? } o,
 *      si es válida, { valid: true, auth: { accessToken, user } }. El
 *      accessToken es un token "falso" (ver store.js#issueFakeToken), NO un
 *      JWT real — solo sirve para las llamadas GET de este mismo servicio.
 *  GET  /auth/seeds/:nombre    -> estado de la semilla activa (solo pruebas).
 *  GET  /empresas                            (requiere Authorization: Bearer)
 *      -> [{ id, nombre, estado }]
 *  GET  /empresas/:empresaId/observaciones   (requiere Authorization: Bearer)
 *      -> [{ id, autorNombre, comentario }]
 *      Usados por la skill para "estado de mi proyecto" y "comentarios de mi
 *      mentor". Datos de ejemplo (ver projects.js), no conectados a la app web.
 */
'use strict';

const express = require('express');
const { generateSeedForUser, validateAndConsumeSeed, getUserRecord, issueFakeToken, resolveFakeToken } = require('./store');
const { getEmpresasForUser, getObservacionesForEmpresa } = require('./projects');

const app = express();
app.use(express.json());

// CORS abierto: es un servicio temporal solo para pruebas locales, llamado
// directo desde el navegador (localhost:3000) en otro puerto.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

const PORT = process.env.PORT || 3001;

// Igual que JwtAuthGuard en el gateway real: exige "Authorization: Bearer
// <token>" y responde 401 si falta o no se reconoce.
function requireBearerUser(req, res) {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const nombre = token && resolveFakeToken(token);
  if (!nombre) {
    res.status(401).json({ statusCode: 401, message: 'Token de acceso inválido o expirado.' });
    return null;
  }
  return nombre;
}

app.post('/auth/seeds/generate', (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre) {
    return res.status(400).json({ error: 'nombre es requerido' });
  }

  const { seed } = generateSeedForUser(nombre);
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  return res.status(201).json({ seed, expiraEn });
});

app.post('/auth/seeds/validate', (req, res) => {
  const { nombre, seed } = req.body || {};
  if (!nombre || !seed) {
    return res.status(400).json({ error: 'nombre y seed son requeridos' });
  }

  const result = validateAndConsumeSeed(nombre, seed);
  if (!result.valid) {
    return res.status(200).json({ valid: false, reason: result.reason });
  }

  return res.status(200).json({
    valid: true,
    auth: {
      accessToken: issueFakeToken(result.nombre),
      user: { id: result.nombre, nombre: result.nombre, email: `${result.nombre}@example.com`, rol: 'emprendedor' },
    },
  });
});

app.get('/auth/seeds/:nombre', (req, res) => {
  const record = getUserRecord(req.params.nombre);
  if (!record) {
    return res.status(404).json({ error: 'usuario no encontrado' });
  }
  return res.status(200).json(record);
});

app.get('/empresas', (req, res) => {
  const nombre = requireBearerUser(req, res);
  if (!nombre) return;
  return res.status(200).json(getEmpresasForUser(nombre));
});

app.get('/empresas/:empresaId/observaciones', (req, res) => {
  const nombre = requireBearerUser(req, res);
  if (!nombre) return;
  return res.status(200).json(getObservacionesForEmpresa(req.params.empresaId));
});

app.listen(PORT, () => {
  console.log(`~~~~ Seed auth service escuchando en http://localhost:${PORT}`);
});

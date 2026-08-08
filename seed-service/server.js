/**
 * Servicio HTTP temporal para probar el login por semilla de la skill de
 * Alexa antes de integrarlo al backend NestJS real.
 *
 * Endpoints:
 *  POST /auth/seeds/generate   { username } -> { username, seed }
 *      Simula el botón "Generar nueva semilla" que tendrá el empresario
 *      en la página (todavía sin UI: se prueba por HTTP).
 *  POST /auth/seeds/validate   { username, seed } -> { valid, reason? }
 *      Usado por la skill de Alexa en el login. Si es válida, la semilla
 *      queda consumida (un solo uso).
 *  GET  /auth/seeds/:username  -> estado de la semilla activa (solo pruebas).
 *  GET  /projects?username=... -> { username, projects: [{ nombre, estado, comentarios }] }
 *      Usado por la skill para "estado de mi proyecto" y "comentarios de mi
 *      mentor". Datos de ejemplo (ver projects.js), no conectados a la app web.
 */
'use strict';

const express = require('express');
const { generateSeedForUser, validateAndConsumeSeed, getUserRecord } = require('./store');
const { getProjectsForUser } = require('./projects');

const app = express();
app.use(express.json());

// CORS abierto: es un servicio temporal solo para pruebas locales, llamado
// directo desde el navegador (localhost:3000) en otro puerto.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

const PORT = process.env.PORT || 3001;

app.post('/auth/seeds/generate', (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: 'username es requerido' });
  }

  const { seed } = generateSeedForUser(username);
  return res.status(201).json({ username, seed });
});

app.post('/auth/seeds/validate', (req, res) => {
  const { username, seed } = req.body || {};
  if (!username || !seed) {
    return res.status(400).json({ error: 'username y seed son requeridos' });
  }

  const result = validateAndConsumeSeed(username, seed);
  if (!result.valid) {
    return res.status(401).json({ valid: false, reason: result.reason });
  }
  return res.status(200).json({ valid: true });
});

app.get('/auth/seeds/:username', (req, res) => {
  const record = getUserRecord(req.params.username);
  if (!record) {
    return res.status(404).json({ error: 'usuario no encontrado' });
  }
  return res.status(200).json(record);
});

app.get('/projects', (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'username es requerido' });
  }

  const projects = getProjectsForUser(username);
  return res.status(200).json({ username, projects });
});

app.listen(PORT, () => {
  console.log(`~~~~ Seed auth service escuchando en http://localhost:${PORT}`);
});

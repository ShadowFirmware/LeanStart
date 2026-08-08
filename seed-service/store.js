/**
 * Store en memoria para el login por semilla de un solo uso.
 * Temporal: cuando exista el backend real (NestJS), esta lógica debe migrar
 * a la tabla de usuarios/empresarios y persistirse en PostgreSQL.
 */
'use strict';

const users = new Map();

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function generateFourDigitSeed() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Genera (y reemplaza) la semilla activa de un usuario. Si el usuario no
// existía todavía se crea, para poder probar el flujo sin un paso previo
// de registro.
function generateSeedForUser(username) {
  const key = normalizeUsername(username);
  if (!key) {
    throw new Error('username es requerido');
  }

  const seed = generateFourDigitSeed();
  users.set(key, {
    username: key,
    seed,
    generatedAt: new Date().toISOString(),
    usedAt: null,
  });

  return { username: key, seed };
}

// Valida nombre + semilla. Si es válida, la marca como usada de inmediato
// (fugaz: un solo uso) para que no pueda reutilizarse en un siguiente login.
function validateAndConsumeSeed(username, seed) {
  const key = normalizeUsername(username);
  const record = users.get(key);

  if (!record) {
    return { valid: false, reason: 'USER_NOT_FOUND' };
  }
  if (record.usedAt) {
    return { valid: false, reason: 'SEED_ALREADY_USED' };
  }
  if (record.seed !== String(seed || '').trim()) {
    return { valid: false, reason: 'SEED_MISMATCH' };
  }

  record.usedAt = new Date().toISOString();
  return { valid: true };
}

function getUserRecord(username) {
  return users.get(normalizeUsername(username)) || null;
}

module.exports = {
  generateSeedForUser,
  validateAndConsumeSeed,
  getUserRecord,
};

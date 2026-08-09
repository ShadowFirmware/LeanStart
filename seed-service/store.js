/**
 * Store en memoria para el login por semilla de un solo uso, y para el
 * access token "falso" que emula el JWT que emite el backend real
 * (auth-service) al validar una semilla. Temporal: en el backend real esta
 * lógica vive en SemillaAlexa (Prisma) + AuthService.buildAuthResponse, ver
 * apps/backend/services/auth-service en la rama con el backend.
 */
'use strict';

const users = new Map();

function normalizeName(nombre) {
  return String(nombre || '').trim().toLowerCase();
}

function generateFourDigitSeed() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Genera (y reemplaza) la semilla activa de un usuario. Si el usuario no
// existía todavía se crea, para poder probar el flujo sin un paso previo
// de registro.
function generateSeedForUser(nombre) {
  const key = normalizeName(nombre);
  if (!key) {
    throw new Error('nombre es requerido');
  }

  const seed = generateFourDigitSeed();
  users.set(key, {
    nombre: nombre.trim(),
    seed,
    generatedAt: new Date().toISOString(),
    usedAt: null,
  });

  return { nombre: users.get(key).nombre, seed };
}

// Valida nombre + semilla. Si es válida, la marca como usada de inmediato
// (fugaz: un solo uso) para que no pueda reutilizarse en un siguiente login.
function validateAndConsumeSeed(nombre, seed) {
  const key = normalizeName(nombre);
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
  return { valid: true, nombre: record.nombre };
}

function getUserRecord(nombre) {
  return users.get(normalizeName(nombre)) || null;
}

// "Access token" de juguete: solo el nombre codificado en base64url, con un
// prefijo para reconocerlo. Nada de esto es criptográficamente válido (no
// firma nada, cualquiera puede fabricar uno) — es un doble simplificado del
// JWT real únicamente para poder probar la skill en local sin levantar todo
// el stack de NestJS/Postgres/Redis. NUNCA usar este esquema fuera de
// pruebas locales.
function issueFakeToken(nombre) {
  return `fake.${Buffer.from(nombre, 'utf8').toString('base64url')}`;
}

function resolveFakeToken(token) {
  if (!token || !token.startsWith('fake.')) return null;
  try {
    return Buffer.from(token.slice('fake.'.length), 'base64url').toString('utf8');
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateSeedForUser,
  validateAndConsumeSeed,
  getUserRecord,
  issueFakeToken,
  resolveFakeToken,
};

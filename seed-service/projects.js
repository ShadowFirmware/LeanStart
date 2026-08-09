/**
 * Datos de ejemplo (mock) de empresas/observaciones por usuario, para que la
 * skill de Alexa pueda responder "estado de mi proyecto" y "comentarios de
 * mi mentor" sin depender todavía del backend real (NestJS). Mismo shape
 * que expone el api-gateway real: GET /empresas y
 * GET /empresas/:empresaId/observaciones (ver apps/backend/api-gateway en
 * la rama con el backend) — comentarios vive en el campo "comentario"
 * (no "texto"), separado de la empresa, no anidado.
 */
'use strict';

const EMPRESAS_BY_USER = {
  daniel: [
    { id: 'emp-snackeco', nombre: 'SnackEco', estado: 'en_mentoria' },
    { id: 'emp-tutoria', nombre: 'TutorIA', estado: 'borrador' },
  ],
};

const OBSERVACIONES_BY_EMPRESA = {
  'emp-snackeco': [
    { id: 'obs-1', autorNombre: 'Mentor', comentario: 'Buen avance en el problema, pero profundiza más en el segmento de clientes.' },
    { id: 'obs-2', autorNombre: 'Mentor', comentario: 'Agrega métricas más específicas para medir el éxito del negocio.' },
  ],
  'emp-tutoria': [],
};

function normalizeName(nombre) {
  return String(nombre || '').trim().toLowerCase();
}

function getEmpresasForUser(nombre) {
  return EMPRESAS_BY_USER[normalizeName(nombre)] || [];
}

function getObservacionesForEmpresa(empresaId) {
  return OBSERVACIONES_BY_EMPRESA[empresaId] || [];
}

module.exports = { getEmpresasForUser, getObservacionesForEmpresa };

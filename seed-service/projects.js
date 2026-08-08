/**
 * Datos de ejemplo (mock) de proyectos por usuario, para que la skill de
 * Alexa pueda responder "estado de mi proyecto" y "comentarios de mi mentor"
 * sin depender todavía del backend real (NestJS). No están conectados a los
 * datos reales de la app web (esos viven en localStorage del navegador).
 */
'use strict';

const PROJECTS_BY_USER = {
  daniel: [
    {
      nombre: 'SnackEco',
      estado: 'en_mentoria',
      comentarios: [
        { autor: 'Mentor', texto: 'Buen avance en el problema, pero profundiza más en el segmento de clientes.' },
        { autor: 'Mentor', texto: 'Agrega métricas más específicas para medir el éxito del negocio.' },
      ],
    },
    {
      nombre: 'TutorIA',
      estado: 'borrador',
      comentarios: [],
    },
  ],
};

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function getProjectsForUser(username) {
  return PROJECTS_BY_USER[normalizeUsername(username)] || [];
}

module.exports = { getProjectsForUser };

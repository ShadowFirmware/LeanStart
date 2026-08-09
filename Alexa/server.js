/**
 * Servidor HTTPS para exponer la skill como "endpoint" personalizado de
 * Alexa (en vez de desplegarla como función Lambda). Se usa junto con ngrok:
 *
 *   1. npm install
 *   2. npm start                         (deja esta terminal corriendo)
 *   3. ngrok http 5000                   (en otra terminal)
 *   4. Copia la URL https que te dé ngrok (ej. https://abc123.ngrok.io) en
 *      Alexa Developer Console > tu skill > Endpoint > Default Region,
 *      con el tipo de certificado "My development endpoint is a sub-domain
 *      of a domain that has a wildcard certificate from a certificate
 *      authority" (ngrok ya trae un certificado válido).
 *
 * IMPORTANTE: seed-service (carpeta /seed-service, puerto 3001) debe estar
 * corriendo aparte para que el login por semilla funcione.
 */
'use strict';

const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const { skillBuilder } = require('./index');

const PORT = process.env.ALEXA_PORT || 5000;

// Alexa firma cada petición HTTPS entrante; un endpoint personalizado real
// debe verificar esa firma y el timestamp (por eso true/true por default).
// Para probar rápido con curl (sin pasar por Alexa) se puede desactivar con
// ALEXA_VERIFY_REQUESTS=false — nunca dejarlo así en el endpoint real.
const verifyRequests = process.env.ALEXA_VERIFY_REQUESTS !== 'false';
if (!verifyRequests) {
  console.warn('~~~~ ALEXA_VERIFY_REQUESTS=false: no se está verificando la firma de Alexa. Solo para pruebas locales con curl.');
}

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, verifyRequests, verifyRequests);

const app = express();
app.post('/', adapter.getRequestHandlers());

app.listen(PORT, () => {
  console.log(`~~~~ Alexa skill (endpoint HTTPS) escuchando en http://localhost:${PORT}`);
  console.log(`~~~~ Expon este puerto con: ngrok http ${PORT}`);
});

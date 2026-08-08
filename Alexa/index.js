/**
 * Asistente de Emprendimiento - Skill de Alexa
 * -----------------------------------------------------------------------
 * Handlers para: StartProjectGuideIntent, OverviewPhasesIntent,
 * GetSpecificPhaseIntent (fases 1-4), CanvasDeepDiveIntent (partes del Lean
 * Canvas por NOMBRE), HypothesisDeepDiveIntent (partes de la hipótesis por
 * NOMBRE), AMAZON.HelpIntent, AMAZON.CancelIntent, AMAZON.StopIntent,
 * AMAZON.FallbackIntent, SessionEndedRequest y manejo de errores.
 *
 * Cambios de esta versión:
 * 1. LÓGICA: CanvasDeepDiveIntent y el nuevo HypothesisDeepDiveIntent ya no
 *    usan números, usan el NOMBRE de cada parte (slots CANVAS_STEP_NAME y
 *    HYPOTHESIS_STEP_NAME). Las antiguas fases 4, 5 y 6 (Validación de
 *    Hipótesis, Diseño del Experimento, Registro de Resultados) se unieron
 *    en una sola fase 4 "Hipótesis", con sus 3 partes accesibles por nombre
 *    a través de HypothesisDeepDiveIntent (igual que el canvas).
 * 2. UX: respuestas más cortas. OverviewPhasesIntent ahora es solo un menú.
 *    Cada respuesta cierra con una sugerencia de qué decir a continuación.
 *    AMAZON.HelpIntent da un mini menú de opciones.
 * 3. TRY/CATCH: cada handler envuelve su lógica en try/catch para loguear
 *    el error y responder de forma controlada, sin tronar la skill.
 *
 * NOTA: Sigue sin incluir "GetProjectStatusIntent" y "GetMentorCommentsIntent",
 * ya que dependen de la aplicación web/API que todavía no está lista.
 *
 * LOGIN POR SEMILLA:
 * Antes de usar el resto de la skill, el usuario debe autenticarse con su
 * nombre y una "semilla" (PIN de 4 dígitos) de un solo uso. La semilla se
 * valida contra un servicio backend externo (ver carpeta /seed-service en
 * la raíz del proyecto) que es quien decide si es válida y la marca como
 * usada. La autenticación dura solo mientras la sesión de Alexa siga
 * abierta; al volver a abrir la skill hay que iniciar sesión de nuevo.
 * -----------------------------------------------------------------------
 */

const Alexa = require('ask-sdk-core');
const http = require('http');
const https = require('https');

// =========================================================================
// Contenido de fases, partes del canvas y partes de la hipótesis.
// =========================================================================

const PHASES = {
  "1": {
    "title": "Creación de Mini Empresa",
    "response": "En la fase uno registras los datos generales de tu empresa. Por ejemplo, para la empresa SnackEco: la categoría sería Sustentabilidad y el mercado, Jóvenes ecoamigables.",
    "closing": "Si quieres avanzar, solo di 'dame la fase' y el número que quieras, del uno al cuatro."
  },
  "2": {
    "title": "Registro de Productos o Servicios",
    "response": "En la fase dos registras tus productos o servicios. Para productos: nombre, imagen, descripción, características y precio. Para servicios: similar, sin imagen, y con opciones de precio: rango, periodo o personalizado.",
    "closing": "Si quieres avanzar, solo di 'dame la fase' y el número que quieras, del uno al cuatro."
  },
  "3": {
    "title": "Construcción del Lean Canvas",
    "response": "En la fase tres armas tu Lean Canvas, que tiene nueve partes: problema, segmento de clientes, propuesta de valor, solución, canales, fuentes de ingreso, estructura de costos, métricas clave y ventaja injusta.",
    "closing": "Si quieres profundizar en alguna parte, puedes decir algo como 'ayúdame con la propuesta de valor'."
  },
  "4": {
    "title": "Hipótesis",
    "response": "La fase cuatro valida tu idea en tres pasos: Creación de hipótesis, diseño del experimento y registro de resultados.",
    "closing": "Si quieres profundizar en alguna parte, puedes decir algo como 'explícame el diseño del experimento'."
  }
};

const CANVAS_STEPS = {
  "problema": {
    "title": "Problema",
    "response": "Aquí defines los problemas que enfrentan tus clientes. Para la empresa SnackEco, el problema sería la falta de botanas saludables y sustentables en la universidad."
  },
  "segmento_clientes": {
    "title": "Segmento de Clientes",
    "response": "Aquí defines quiénes tienen ese problema. Para la empresa SnackEco, el segmento de clientes serían jóvenes universitarios conscientes del medio ambiente."
  },
  "propuesta_valor": {
    "title": "Propuesta de Valor",
    "response": "Aquí describes el valor que ofreces. Para la empresa SnackEco, la Propuesta de valor son las botanas ricas, altas en proteína y que ayudan al planeta."
  },
  "solucion": {
    "title": "Solución",
    "response": "Aquí describes cómo resuelves el problema. Para la empresa SnackEco, la solucion es vender snacks a base de insectos en empaques biodegradables."
  },
  "canales": {
    "title": "Canales",
    "response": "Aquí defines cómo llega tu producto al cliente. Para la empresa SnackEco, el canal seria un stand en el campus, además de Instagram y TikTok."
  },
  "fuentes_ingreso": {
    "title": "Fuentes de Ingreso",
    "response": "Aquí defines cómo generas dinero. Para la empresa SnackEco, la fuente de ingreso serian la venta directa a 50 pesos por paquete."
  },
  "estructura_costos": {
    "title": "Estructura de Costos",
    "response": "Aquí defines tus principales gastos. Para la empresa SnackEco, en la estructura de consto es la materia prima, empaques y renta del stand."
  },
  "metricas_clave": {
    "title": "Métricas Clave",
    "response": "Aquí defines cómo medirás tu éxito. Para la empresa SnackEco, las metricas clave son los paquetes vendidos por semana y clientes recurrentes."
  },
  "ventaja_injusta": {
    "title": "Ventaja Injusta",
    "response": "Aquí defines qué es difícil de copiar. Para la empresa SnackEco, la venta injusta se basa en una alianza exclusiva con un criadero de insectos orgánicos."
  }
};

const HYPOTHESIS_STEPS = {
  "validacion": {
    "title": "Validación de Hipótesis",
    "response": "Aquí planteas una hipótesis y cómo la vas a probar. Para la empresa SnackEco, la hipótesis seria que 'los estudiantes comprarán el snack si cuesta menos de 60 pesos', y lo probarías con una encuesta."
  },
  "diseno": {
    "title": "Diseño del Experimento",
    "response": "Aquí planeas la prueba para tu hipótesis. Para la empresa SnackEco, el diseño de experimento es poner un stand en la universidad y tratar de vender al menos 20 unidades en un día."
  },
  "registro": {
    "title": "Registro de Resultados",
    "response": "Aquí registras tus hallazgos y tu conclusión. Para la empresa SnackEco, el resultado seria que se vendieron 25 unidades, así que la hipótesis se cumple."
  }
};

const CANVAS_CLOSING = "Si quieres profundizar en otra parte del canvas, solo dime su nombre, por ejemplo 'los canales' o 'las métricas clave'.";

const HYPOTHESIS_CLOSING = "Si quieres ver otra parte de la hipótesis, solo dime su nombre, como 'el registro de resultados'.";

// Bienvenida cuando NO hay sesión iniciada: es solo una presentación breve,
// ya NO fuerza el login. El login (LoginIntent) solo hace falta para las
// preguntas sobre TUS proyectos (estado, comentarios de mentor); la guía
// general (fases, canvas, hipótesis) funciona sin haber iniciado sesión.
const WELCOME_MESSAGE = "¡Hola! Estoy aquí para ayudarte con tu mini empresa. Si quieres saber el estado o los comentarios de tus proyectos, primero di 'iniciar sesión'. Si no, puedes usar la guía con normalidad diciendo, por ejemplo, 'ayuda con un proyecto'.";

// Bienvenida cuando SÍ hay sesión iniciada (justo tras loguearse, o al
// reabrir la skill ya autenticado): aquí sí tiene sentido el menú de 3
// formas de ayuda, porque las 3 ya están disponibles.
const MENU_MESSAGE = "Puedo ayudarte de tres formas: pídeme ayuda con tu proyecto, pregúntame el estado de tu proyecto, o pídeme los comentarios que haya dejado tu mentor. ¿Qué necesitas?";

const OVERVIEW_MESSAGE = "Estas son las 4 fases: primera, creación de tu mini empresa; segunda, registro de productos o servicios; tercera, construcción del Canvas; y cuarta, validación de tu hipótesis. Dime el número de la fase que quieras conocer a detalle.";

const HELP_MESSAGE = "Claro, recuerda que puedes explorar las fases del proyecto, el canvas o la hipótesis sin necesidad de iniciar sesión. Para las fases, solo dime un número del 1 al 4, como 'la fase 2'. Para el canvas o la hipótesis, dime el nombre de la parte, por ejemplo 'la propuesta de valor' o 'el diseño del experimento'. Si quieres el estado de tu proyecto o los comentarios de tu mentor, primero di 'iniciar sesión'. ¿En qué te ayudo?";

const CANCEL_MESSAGE = "Entendido, cancelé eso. ¿Te ayudo con otra fase, el canvas o la hipótesis?";

const STOP_MESSAGE = "¡Mucho éxito con tu mini empresa! Vuelve cuando quieras. ¡Hasta luego!";

const FALLBACK_MESSAGE = "Lo siento, no entendí tu petición. Recuerda que solo puedo ayudarte con las fases del proyecto, el Lean Canvas o la hipótesis. ¿En qué te ayudo?";

const ERROR_MESSAGE = "Lo siento, tuve un problema para procesar tu petición. ¿Puedes repetirla? Recuerda que puedo ayudarte con las fases del proyecto, el canvas o la hipótesis.";

const NEEDS_LOGIN_MESSAGE = "Antes de continuar necesito verificar tu identidad. Di 'inicia sesión' para darme tu nombre y tu semilla de acceso.";

const LOGIN_FAILURE_REASONS = {
  USER_NOT_FOUND: "No encontré una cuenta con ese nombre.",
  SEED_MISMATCH: "Esa semilla no es válida.",
  SEED_ALREADY_USED: "Esa semilla ya fue utilizada, cada semilla sirve una sola vez.",
  BACKEND_UNAVAILABLE: "Tuve un problema para verificar tus datos.",
  UNKNOWN: "No pude verificar tus datos.",
};

// =========================================================================
// Login por semilla: valida nombre + semilla (PIN de 4 dígitos) contra el
// servicio backend externo (/seed-service). SEED_API_URL es configurable
// por variable de entorno para poder apuntar a otro ambiente sin tocar
// código.
// =========================================================================
const SEED_API_URL = process.env.SEED_API_URL || 'http://localhost:3001';

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(url);
    } catch (error) {
      reject(error);
      return;
    }

    const lib = target.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);

    const request = lib.request({
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          resolve({ statusCode: response.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function validateSeedWithBackend(username, seed) {
  try {
    const { statusCode, body } = await postJson(`${SEED_API_URL}/auth/seeds/validate`, { username, seed });
    if (statusCode === 200 && body && body.valid) {
      return { valid: true };
    }
    return { valid: false, reason: (body && body.reason) || 'UNKNOWN' };
  } catch (error) {
    console.error(`~~~~ Error al validar la semilla contra el backend: ${error}`);
    return { valid: false, reason: 'BACKEND_UNAVAILABLE' };
  }
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(url);
    } catch (error) {
      reject(error);
      return;
    }

    const lib = target.protocol === 'https:' ? https : http;

    const request = lib.request({
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: 'GET',
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          resolve({ statusCode: response.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}

// =========================================================================
// Consulta de proyectos: usada por GetProjectStatusIntent y
// GetMentorCommentsIntent. Igual que el login, depende del backend externo
// (/seed-service), que hoy solo trae datos de ejemplo (ver projects.js).
// Regresa `null` (no []) cuando hubo un error de conexión, para distinguir
// "no se pudo consultar" de "el usuario no tiene proyectos".
// =========================================================================
async function fetchProjectsForUser(username) {
  try {
    const url = `${SEED_API_URL}/projects?username=${encodeURIComponent(username)}`;
    const { statusCode, body } = await getJson(url);
    if (statusCode === 200 && body && Array.isArray(body.projects)) {
      return body.projects;
    }
    return [];
  } catch (error) {
    console.error(`~~~~ Error al consultar los proyectos: ${error}`);
    return null;
  }
}

// Si el usuario dio un nombre de proyecto, busca coincidencia parcial
// (case-insensitive). Si no dio nombre, solo se resuelve solo cuando hay
// exactamente un proyecto; con varios, se deja que el handler pida que
// repita la pregunta con el nombre (nombreProyecto no tiene elicitación
// configurada en el modelo de interacción).
function resolveProject(projects, nombreProyecto) {
  if (!nombreProyecto) {
    return projects.length === 1 ? projects[0] : null;
  }
  const normalized = nombreProyecto.trim().toLowerCase();
  return projects.find((p) => p.nombre.toLowerCase().includes(normalized)) || null;
}

const ESTADO_LABELS = {
  borrador: 'en borrador, todavía no la mandas a mentoría',
  pendiente_mentoria: 'pendiente de mentoría',
  en_mentoria: 'en mentoría',
  observaciones_pendientes: 'con observaciones pendientes por atender',
  observaciones_atendidas: 'con las observaciones ya atendidas',
  pendiente_evaluacion: 'pendiente de evaluación',
  en_evaluacion: 'en evaluación',
  publicado: 'publicada, ya fue evaluada',
  devuelto: 'devuelta, necesita ajustes',
};

function isAuthenticated(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  return !!(sessionAttributes && sessionAttributes.authenticated);
}

// Respuesta corta usada por los intents de contenido cuando el usuario
// todavía no inició sesión. No delega el diálogo directamente para
// mantener el mismo patrón simple que ya usa el resto de la skill: el
// usuario dispara LoginIntent diciendo "inicia sesión".
function buildLoginRequiredResponse(handlerInput) {
  return handlerInput.responseBuilder
    .speak(NEEDS_LOGIN_MESSAGE)
    .reprompt(NEEDS_LOGIN_MESSAGE)
    .getResponse();
}

// =========================================================================
// Utilidad: obtiene el "id" resuelto de un slot con tipo personalizado
// (FASE_NUMBER / CANVAS_STEP_NAME / HYPOTHESIS_STEP_NAME). Gracias a los
// sinónimos definidos en el modelo de interacción, esto funciona igual si
// el usuario dijo "2", "dos", "segundo" o el nombre completo de una parte.
// Si Alexa no pudo resolver el slot, regresamos null.
// Envuelta en try/catch: si la estructura de "resolutions" llega distinta a
// lo esperado (por ejemplo, una respuesta malformada del servicio de Alexa),
// no debe tronar toda la skill, solo se registra el error y se sigue.
// =========================================================================
function getResolvedSlotId(handlerInput, slotName) {
  try {
    const slot = Alexa.getSlot(handlerInput.requestEnvelope, slotName);
    if (!slot) return null;

    const resolutions = slot.resolutions
      && slot.resolutions.resolutionsPerAuthority
      && slot.resolutions.resolutionsPerAuthority[0];

    if (resolutions && resolutions.status && resolutions.status.code === 'ER_SUCCESS_MATCH') {
      return resolutions.values[0].value.id;
    }

    // Si no hubo match por sinónimos, usamos el valor crudo del slot como
    // respaldo (por ejemplo, si el slot type no tuvo resolución).
    return slot.value || null;
  } catch (error) {
    console.error(`~~~~ Error al resolver el slot "${slotName}": ${error}`);
    return null;
  }
}

// =========================================================================
// LaunchRequest + StartProjectGuideIntent
// =========================================================================
const LaunchAndStartHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
      || Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartProjectGuideIntent';
  },
  handle(handlerInput) {
    try {
      if (!isAuthenticated(handlerInput)) {
        // Ya NO se fuerza el login: solo una presentación breve. El usuario
        // decide si quiere iniciar sesión (para lo de sus proyectos) o usar
        // la guía general directamente.
        return handlerInput.responseBuilder
          .speak(WELCOME_MESSAGE)
          .reprompt(WELCOME_MESSAGE)
          .getResponse();
      }

      const { username } = handlerInput.attributesManager.getSessionAttributes();
      const speakOutput = `Hola de nuevo, ${username}. ${MENU_MESSAGE}`;
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(MENU_MESSAGE)
        .getResponse();
    } catch (error) {
      console.error(`~~~~ Error en LaunchAndStartHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// LoginIntent (slots: nombreUsuario, semilla). Con "delegationStrategy":
// "ALWAYS" y sus prompts de elicitación, Alexa pide ambos datos aunque el
// usuario solo haya dicho "inicia sesión". El handler de abajo solo corre
// cuando el diálogo ya está COMPLETED.
// =========================================================================
const LoginIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LoginIntent'
      && request.dialogState === 'COMPLETED';
  },
  async handle(handlerInput) {
    try {
      const nombreUsuario = getResolvedSlotId(handlerInput, 'nombreUsuario');
      const semilla = getResolvedSlotId(handlerInput, 'semilla');

      const result = await validateSeedWithBackend(nombreUsuario, semilla);

      if (!result.valid) {
        const reasonMessage = LOGIN_FAILURE_REASONS[result.reason] || LOGIN_FAILURE_REASONS.UNKNOWN;
        const speakOutput = `${reasonMessage} Vamos a intentarlo de nuevo. ¿Cuál es tu nombre?`;
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .addDelegateDirective({ name: 'LoginIntent', confirmationStatus: 'NONE', slots: {} })
          .getResponse();
      }

      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.authenticated = true;
      sessionAttributes.username = nombreUsuario;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      const speakOutput = `Listo, ${nombreUsuario}. ${MENU_MESSAGE}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(MENU_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en LoginIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

const LoginIntentDialogDelegationHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LoginIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en LoginIntentDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// OverviewPhasesIntent -> ahora es solo un menú corto (UX: no saturar)
// =========================================================================
const OverviewPhasesIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OverviewPhasesIntent';
  },
  handle(handlerInput) {
    try {
      return handlerInput.responseBuilder
        .speak(OVERVIEW_MESSAGE)
        .reprompt('¿De cuál fase necesitas un ejemplo detallado?')
        .getResponse();
    } catch (error) {
      console.error(`~~~~ Error en OverviewPhasesIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// GetSpecificPhaseIntent (slot: numeroFase, tipo FASE_NUMBER, 1 a 4)
// "delegationStrategy": "ALWAYS" hace que Alexa pregunte sola por el slot
// si falta. Este handler solo corre cuando el diálogo ya está COMPLETED.
// =========================================================================
const GetSpecificPhaseIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSpecificPhaseIntent'
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    try {
      const numeroFase = getResolvedSlotId(handlerInput, 'numeroFase');
      const fase = PHASES[numeroFase];

      if (!fase) {
        const speakOutput = 'No tengo información para ese número de fase. Recuerda que son '
          + '4 en total. ¿De cuál necesitas ayuda?';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      const speakOutput = `${fase.response} ${fase.closing}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(fase.closing).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetSpecificPhaseIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

const GetSpecificPhaseDialogDelegationHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSpecificPhaseIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetSpecificPhaseDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// CanvasDeepDiveIntent (slot: canvasStepName, tipo CANVAS_STEP_NAME)
// Ahora se pide por NOMBRE ("la propuesta de valor"), no por número.
// =========================================================================
const CanvasDeepDiveIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CanvasDeepDiveIntent'
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    try {
      const canvasStepName = getResolvedSlotId(handlerInput, 'canvasStepName');
      const step = CANVAS_STEPS[canvasStepName];

      if (!step) {
        const speakOutput = 'No tengo información para esa parte del canvas. ¿Puedes decirme '
          + 'el nombre de nuevo, por ejemplo el problema o la propuesta de valor?';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      const speakOutput = `${step.response} ${CANVAS_CLOSING}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(CANVAS_CLOSING).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en CanvasDeepDiveIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

const CanvasDeepDiveDialogDelegationHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CanvasDeepDiveIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en CanvasDeepDiveDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// HypothesisDeepDiveIntent (slot: hypothesisStepName, tipo HYPOTHESIS_STEP_NAME)
// Nuevo intent: reemplaza a las antiguas fases 4, 5 y 6. Se pide por
// NOMBRE, igual que el canvas ("el diseño del experimento").
// =========================================================================
const HypothesisDeepDiveIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HypothesisDeepDiveIntent'
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    try {
      const hypothesisStepName = getResolvedSlotId(handlerInput, 'hypothesisStepName');
      const step = HYPOTHESIS_STEPS[hypothesisStepName];

      if (!step) {
        const speakOutput = 'No tengo información para esa parte de la hipótesis. ¿Puedes '
          + 'decirme el nombre de nuevo, por ejemplo el diseño del experimento?';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      const speakOutput = `${step.response} ${HYPOTHESIS_CLOSING}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(HYPOTHESIS_CLOSING).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en HypothesisDeepDiveIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

const HypothesisDeepDiveDialogDelegationHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HypothesisDeepDiveIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en HypothesisDeepDiveDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// GetProjectStatusIntent (slot opcional: nombreProyecto, AMAZON.SearchQuery)
// Solo da el estatus del proyecto, sin detalles adicionales. Si el usuario
// tiene más de un proyecto y no dijo el nombre, se le pide que lo repita
// (el slot no tiene elicitación configurada en el modelo de interacción).
// =========================================================================
const GetProjectStatusIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetProjectStatusIntent';
  },
  async handle(handlerInput) {
    try {
      if (!isAuthenticated(handlerInput)) {
        return buildLoginRequiredResponse(handlerInput);
      }

      const { username } = handlerInput.attributesManager.getSessionAttributes();
      const nombreProyecto = getResolvedSlotId(handlerInput, 'nombreProyecto');
      const projects = await fetchProjectsForUser(username);

      if (projects === null) {
        const speakOutput = 'Tuve un problema para consultar tus proyectos. Intenta de nuevo en un momento.';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      if (projects.length === 0) {
        const speakOutput = 'No encontré proyectos registrados a tu nombre todavía.';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      const project = resolveProject(projects, nombreProyecto);

      if (!project) {
        const nombres = projects.map((p) => p.nombre).join(' y ');
        const speakOutput = projects.length > 1
          ? `Tienes varios proyectos: ${nombres}. Vuelve a preguntar diciendo el nombre, por ejemplo "cómo va mi proyecto ${projects[0].nombre}".`
          : `No encontré un proyecto con ese nombre. Tu proyecto registrado es ${nombres}.`;
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      const estadoLabel = ESTADO_LABELS[project.estado] || project.estado;
      const speakOutput = `Tu proyecto ${project.nombre} está ${estadoLabel}. ¿Necesitas algo más?`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt('¿Necesitas algo más?').getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetProjectStatusIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// GetMentorCommentsIntent (slot opcional: nombreProyecto, AMAZON.SearchQuery)
// Solo da los comentarios que dejó el mentor, sin más contexto del proyecto.
// =========================================================================
const GetMentorCommentsIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetMentorCommentsIntent';
  },
  async handle(handlerInput) {
    try {
      if (!isAuthenticated(handlerInput)) {
        return buildLoginRequiredResponse(handlerInput);
      }

      const { username } = handlerInput.attributesManager.getSessionAttributes();
      const nombreProyecto = getResolvedSlotId(handlerInput, 'nombreProyecto');
      const projects = await fetchProjectsForUser(username);

      if (projects === null) {
        const speakOutput = 'Tuve un problema para consultar tus proyectos. Intenta de nuevo en un momento.';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      if (projects.length === 0) {
        const speakOutput = 'No encontré proyectos registrados a tu nombre todavía.';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      const project = resolveProject(projects, nombreProyecto);

      if (!project) {
        const nombres = projects.map((p) => p.nombre).join(' y ');
        const speakOutput = projects.length > 1
          ? `Tienes varios proyectos: ${nombres}. Vuelve a preguntar diciendo el nombre, por ejemplo "cuántos comentarios tiene ${projects[0].nombre}".`
          : `No encontré un proyecto con ese nombre. Tu proyecto registrado es ${nombres}.`;
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      const comentarios = project.comentarios || [];
      let speakOutput;
      if (comentarios.length === 0) {
        speakOutput = `Tu mentor todavía no ha dejado comentarios en ${project.nombre}. ¿Necesitas algo más?`;
      } else {
        const listado = comentarios.map((c) => c.texto).join(' ');
        const plural = comentarios.length === 1 ? 'comentario' : 'comentarios';
        speakOutput = `Tu mentor dejó ${comentarios.length} ${plural} en ${project.nombre}: ${listado}`;
      }
      return handlerInput.responseBuilder.speak(speakOutput).reprompt('¿Necesitas algo más?').getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetMentorCommentsIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// AMAZON.HelpIntent -> ahora da un mini menú de opciones (UX)
// =========================================================================
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    try {
      return handlerInput.responseBuilder.speak(HELP_MESSAGE).reprompt(HELP_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en HelpIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// AMAZON.CancelIntent y AMAZON.StopIntent
// =========================================================================
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    try {
      const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
      const speakOutput = intentName === 'AMAZON.StopIntent' ? STOP_MESSAGE : CANCEL_MESSAGE;
      const responseBuilder = handlerInput.responseBuilder.speak(speakOutput);

      if (intentName === 'AMAZON.StopIntent') {
        return responseBuilder.withShouldEndSession(true).getResponse();
      }
      return responseBuilder.reprompt(CANCEL_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en CancelAndStopIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).withShouldEndSession(true).getResponse();
    }
  },
};

// =========================================================================
// AMAZON.FallbackIntent -> petición no reconocida
// =========================================================================
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    try {
      return handlerInput.responseBuilder.speak(FALLBACK_MESSAGE).reprompt(FALLBACK_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en FallbackIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
    }
  },
};

// =========================================================================
// SessionEndedRequest
// =========================================================================
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    try {
      console.log(`~~~~ Sesión terminada: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
    } catch (error) {
      console.error(`~~~~ Error en SessionEndedRequestHandler: ${error}`);
    }
    // No se puede devolver "speak" en SessionEndedRequest.
    return handlerInput.responseBuilder.getResponse();
  },
};

// =========================================================================
// Manejador de errores genérico (última red de seguridad, además de los
// try/catch dentro de cada handler). Aquí caen los errores que no fueron
// atrapados dentro de un handler, por ejemplo fallas del propio SDK.
// =========================================================================
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`~~~~ Error no controlado: ${JSON.stringify(error)}`);
    return handlerInput.responseBuilder.speak(ERROR_MESSAGE).reprompt(ERROR_MESSAGE).getResponse();
  },
};

// =========================================================================
// Registro de handlers
// =========================================================================
// No se llama `.lambda()` ni `.create()` aquí todavía: se exporta el
// SkillBuilder crudo para que tanto Lambda (exports.handler) como un
// endpoint HTTPS propio (ver server.js, usado con ngrok) puedan construir
// la skill a su manera sin duplicar la lista de handlers.
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchAndStartHandler,
    LoginIntentDialogDelegationHandler,
    LoginIntentHandler,
    OverviewPhasesIntentHandler,
    GetSpecificPhaseDialogDelegationHandler,
    GetSpecificPhaseIntentHandler,
    CanvasDeepDiveDialogDelegationHandler,
    CanvasDeepDiveIntentHandler,
    HypothesisDeepDiveDialogDelegationHandler,
    HypothesisDeepDiveIntentHandler,
    GetProjectStatusIntentHandler,
    GetMentorCommentsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler);

exports.skillBuilder = skillBuilder;
exports.handler = skillBuilder.lambda();
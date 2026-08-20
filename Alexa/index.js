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
 * 1. i18n: todos los textos que antes eran constantes de módulo ahora viven
 *    en el diccionario `languageStrings` (uno por locale: es-MX, en-US).
 *    Un RequestInterceptor (`LocalizationInterceptor`) resuelve el locale
 *    de cada request con Alexa.getLocale() y deja el set de textos
 *    correspondiente en las request attributes (`resources`), con fallback
 *    a DEFAULT_LOCALE si el locale no está soportado. Los handlers ya no
 *    hablan en un idioma fijo: leen todo de `resources`.
 * 2. ERROR HANDLER POR DICCIONARIO: el ErrorHandler ya no responde siempre
 *    el mismo mensaje genérico. `classifyErrorType()` clasifica el error
 *    (red, respuesta inválida, problema de request, etc.) y busca el
 *    mensaje correspondiente en `resources.ERRORS`, con `DEFAULT` como
 *    respaldo. También evita mandar `speak`/`reprompt` en un
 *    SessionEndedRequest (Alexa no lo permite) para no ensuciar la
 *    respuesta cuando un error ocurre justo ahí.
 * 3. CANHANDLE MÁS ESTRICTO: todos los `canHandle` siguen el mismo patrón
 *    que ya usaba GetProjectStatusIntentHandler: primero se valida
 *    `getRequestType === 'IntentRequest'` con `&&` (corto-circuito) antes
 *    de llamar a `getIntentName`/`getSlot`, nunca con `||`. Antes,
 *    LaunchAndStartHandler mezclaba `LaunchRequest || getIntentName(...)`,
 *    lo cual truena (`getIntentName` lanza si el request no es
 *    IntentRequest) ante cualquier request que no fuera LaunchRequest ni
 *    IntentRequest (p. ej. SessionEndedRequest), mandando la skill directo
 *    al ErrorHandler sin razón. Corregido para no salir de la skill por un
 *    error de enrutamiento.
 * 4. TRY/CATCH: cada handler sigue envolviendo su lógica en try/catch para
 *    loguear el error y responder de forma controlada, sin tronar la skill.
 *
 * LOGIN POR SEMILLA (contra el backend real):
 * Antes de usar GetProjectStatusIntent o GetMentorCommentsIntent, el usuario
 * debe autenticarse con su nombre y una "semilla" (código de 4 dígitos) de
 * un solo uso, generada desde la app web ya logueada (botón "Generar nueva
 * semilla" -> POST /auth/seeds/generate). La skill valida nombre + semilla
 * contra el api-gateway (POST /auth/seeds/validate); si es válida, el
 * gateway regresa un access token JWT igual al de un login normal, que la
 * skill guarda en las session attributes y reenvía como
 * "Authorization: Bearer" en cada llamada a /empresas y
 * /empresas/:id/observaciones. La autenticación dura solo mientras la
 * sesión de Alexa siga abierta (o hasta que el token expire, ver
 * TOKEN_EXPIRES_IN en SeedsAlexaService del backend); al volver a abrir la
 * skill, o si el token expira a medio uso, hay que iniciar sesión de nuevo
 * (ver buildSessionExpiredResponse).
 *
 * MODELO DE INTERACCIÓN MULTI-IDIOMA:
 * El modelo de interacción (samples, prompts, tipos) vive ahora en
 * /Alexa/models/es-MX.json y /Alexa/models/en-US.json, un archivo por
 * locale (formato estándar del Alexa Developer Console / ask-cli). Los
 * nombres de intents y slots son idénticos entre locales; solo cambian los
 * samples, prompts y sinónimos.
 * -----------------------------------------------------------------------
 */

const Alexa = require('ask-sdk-core');
const http = require('http');
const https = require('https');

// =========================================================================
// Diccionario de idiomas (i18n). Cada locale trae: mensajes sueltos,
// contenido de fases/canvas/hipótesis, etiquetas de estado, razones de
// fallo de login, plantillas (funciones) para armar frases con datos
// dinámicos (nombre de usuario, nombre de proyecto, etc.) y el diccionario
// de errores usado por el ErrorHandler.
// =========================================================================
const DEFAULT_LOCALE = 'es-MX';

const languageStrings = {
  'es-MX': {
    WELCOME_MESSAGE: "¡Hola! Estoy aquí para ayudarte con tu mini empresa. Si quieres saber el estado o los comentarios de tus proyectos, primero di 'iniciar sesión'. Si no, puedes usar la guía con normalidad diciendo, por ejemplo, 'ayuda con un proyecto'. Si en algún momento te pierdes, solo di 'ayuda'.",
    MENU_MESSAGE: "Puedo ayudarte de tres formas: di 'dame el menú de fases' para la guía del proyecto, di 'estado de mi proyecto' para saber cómo va, o di 'cuántos comentarios tengo' para ver los de tu mentor. ¿Qué necesitas?",
    OVERVIEW_MESSAGE: "Estas son las 4 fases: primera, creación de tu mini empresa; segunda, registro de productos o servicios; tercera, construcción del Canvas; y cuarta, validación de tu hipótesis. Dime el número de la fase que quieras conocer a detalle.",
    OVERVIEW_REPROMPT: "¿De cuál fase necesitas un ejemplo detallado?",
    HELP_MESSAGE: "Claro, recuerda que puedes explorar las fases del proyecto, el canvas o la hipótesis sin necesidad de iniciar sesión. Para las fases, solo dime un número del 1 al 4, como 'la fase 2'. Para el canvas o la hipótesis, dime el nombre de la parte, por ejemplo 'la propuesta de valor' o 'el diseño del experimento'. Si quieres el estado de tu proyecto o los comentarios de tu mentor, primero di 'iniciar sesión'. Y si no escuchaste bien algo, solo di 'repite'. ¿En qué te ayudo?",
    CANCEL_MESSAGE: "Entendido, cancelé eso. ¿Te ayudo con otra fase, el canvas o la hipótesis?",
    STOP_MESSAGE: "¡Mucho éxito con tu mini empresa! Vuelve cuando quieras. ¡Hasta luego!",
    FALLBACK_MESSAGE: "Lo siento, no entendí lo que dijiste. Recuerda que puedes decir 'ayuda' en cualquier momento para saber qué te puedo decir. ¿En qué te ayudo?",
    NEEDS_LOGIN_MESSAGE: "Antes de continuar necesito verificar tu identidad. Di 'inicia sesión' para darme tu nombre y tu semilla de acceso.",
    ROLE_NOT_ALLOWED_MESSAGE: "Esta función es solo para cuentas de emprendedor. Si eres mentor o evaluador, usa la aplicación web para consultar esto. ¿Necesitas algo más?",
    SESSION_EXPIRED_MESSAGE: "Tu sesión expiró. Di 'inicia sesión' para verificar tu identidad de nuevo.",
    PHASE_NOT_FOUND_MESSAGE: "No tengo información para ese número de fase. Recuerda que son 4 en total. ¿De cuál necesitas ayuda?",
    CANVAS_STEP_NOT_FOUND_MESSAGE: "No tengo información para esa parte del canvas. ¿Puedes decirme el nombre de nuevo, por ejemplo el problema o la propuesta de valor?",
    HYPOTHESIS_STEP_NOT_FOUND_MESSAGE: "No tengo información para esa parte de la hipótesis. ¿Puedes decirme el nombre de nuevo, por ejemplo el diseño del experimento?",
    LIST_CONJUNCTION: 'y',
    PROGRESS_MESSAGE: "Dame un segundo, estoy revisando eso.",
    PROJECTS_FETCH_ERROR_MESSAGE: "Tuve un problema para consultar tus proyectos. Intenta de nuevo en un momento.",
    NO_PROJECTS_MESSAGE: "No encontré proyectos registrados a tu nombre todavía.",
    NEED_ANYTHING_ELSE: "¿Necesitas algo más?",
    ASK_COMMENTS_MESSAGE: "¿Quieres que te diga si tu mentor dejó comentarios en este proyecto?",
    COMMENTS_OFFER_DECLINED: "Entendido. ¿Necesitas algo más?",
    CANVAS_CLOSING: "Si quieres profundizar en otra parte del canvas, solo dime su nombre, por ejemplo 'los canales' o 'las métricas clave'.",
    HYPOTHESIS_CLOSING: "Si quieres ver otra parte de la hipótesis, solo dime su nombre, como 'el registro de resultados'.",
    PHASES: {
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
    },
    CANVAS_STEPS: {
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
    },
    HYPOTHESIS_STEPS: {
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
    },
    ESTADO_LABELS: {
      borrador: 'en borrador, todavía no la mandas a mentoría',
      pendiente_mentoria: 'pendiente de mentoría',
      en_mentoria: 'en mentoría',
      observaciones_pendientes: 'con observaciones pendientes por atender',
      observaciones_atendidas: 'con las observaciones ya atendidas',
      pendiente_evaluacion: 'pendiente de evaluación',
      en_evaluacion: 'en evaluación',
      publicado: 'publicada, ya fue evaluada',
      devuelto: 'devuelta, necesita ajustes',
    },
    LOGIN_FAILURE_REASONS: {
      USER_NOT_FOUND: "No encontré una cuenta con ese nombre.",
      SEED_MISMATCH: "Esa semilla no es válida.",
      SEED_ALREADY_USED: "Esa semilla ya fue utilizada, cada semilla sirve una sola vez.",
      SEED_EXPIRED: "Esa semilla ya expiró, genera una nueva desde la aplicación web.",
      BACKEND_UNAVAILABLE: "Tuve un problema para verificar tus datos.",
      UNKNOWN: "No pude verificar tus datos.",
    },
    ERRORS: {
      DEFAULT: "Lo siento, tuve un problema para procesar tu petición. ¿Puedes repetirla? Recuerda que también puedes decir 'ayuda' para conocer tus opciones.",
      NETWORK: "Tuve un problema de conexión con el servidor. Intenta de nuevo en un momento.",
      INVALID_RESPONSE: "Tuve un problema generando la respuesta. Intenta de nuevo.",
      REQUEST: "Tuve un problema entendiendo parte de tu petición. ¿Puedes repetirla?",
    },
    // Mensaje específico por intent cuando algo truena inesperadamente
    // dentro de su handler (además del ERRORS de arriba, que clasifica por
    // TIPO de error). Se usa tanto en el catch de cada handler como en el
    // ErrorHandler global (ver classifyErrorType/getIntentErrorMessage),
    // con ERRORS.DEFAULT como respaldo si el intent no tiene uno propio.
    INTENT_ERRORS: {
      LoginIntent: "Tuve un problema verificando tu semilla. Vamos a intentarlo de nuevo.",
      StartProjectGuideIntent: "Tuve un problema abriendo la guía. Intenta de nuevo en un momento.",
      OverviewPhasesIntent: "Tuve un problema mostrando las fases del proyecto. Intenta de nuevo.",
      GetSpecificPhaseIntent: "Tuve un problema con la información de esa fase. Intenta de nuevo.",
      CanvasDeepDiveIntent: "Tuve un problema con esa parte del canvas. Intenta de nuevo.",
      HypothesisDeepDiveIntent: "Tuve un problema con esa parte de la hipótesis. Intenta de nuevo.",
      GetProjectStatusIntent: "Tuve un problema consultando el estado de tu proyecto. Intenta de nuevo en un momento.",
      GetMentorCommentsIntent: "Tuve un problema consultando los comentarios de tu mentor. Intenta de nuevo en un momento.",
    },
    TEMPLATES: {
      loginRetry: (reasonMessage) => `${reasonMessage} Di 'inicia sesión' cuando quieras intentarlo de nuevo con tu nombre y tu semilla.`,
      loginSuccess: (username, menuMessage) => `Listo, ${username}. ${menuMessage}`,
      launchAuthenticated: (username, menuMessage) => `Hola de nuevo, ${username}. ${menuMessage}`,
      statusExampleQuestion: (name) => `cómo va mi proyecto ${name}`,
      commentsExampleQuestion: (name) => `cuántos comentarios tiene ${name}`,
      multipleProjects: (nombres, exampleQuestion) => `Tienes varios proyectos: ${nombres}. Vuelve a preguntar diciendo el nombre, por ejemplo "${exampleQuestion}".`,
      singleProjectNotFound: (nombres) => `No encontré un proyecto con ese nombre. Tu proyecto registrado es ${nombres}.`,
      projectStatus: (nombre, estadoLabel) => `Tu proyecto ${nombre} está ${estadoLabel}.`,
      noComments: (nombre) => `Tu mentor todavía no ha dejado comentarios en ${nombre}. ¿Necesitas algo más?`,
      commentsPlural: (count) => (count === 1 ? 'comentario' : 'comentarios'),
      withComments: (count, plural, nombre) => `Tu mentor dejó ${count} ${plural} en ${nombre}. ¿Necesitas algo más?`,
    },
  },
  'en-US': {
    WELCOME_MESSAGE: "Hi! I'm here to help you with your mini company. If you want to know the status or the comments on your projects, first say 'log in'. Otherwise, you can use the guide normally by saying, for example, 'help with a project'. If you ever get lost, just say 'help'.",
    MENU_MESSAGE: "I can help you in three ways: say 'give me the phase menu' for the project guide, say 'status of my project' to check how it's going, or say 'how many comments do i have' to see your mentor's feedback. What do you need?",
    OVERVIEW_MESSAGE: "These are the 4 phases: first, creating your mini company; second, registering your products or services; third, building your Canvas; and fourth, validating your hypothesis. Tell me the number of the phase you'd like to know in detail.",
    OVERVIEW_REPROMPT: "Which phase would you like a detailed example of?",
    HELP_MESSAGE: "Sure, remember you can explore the project's phases, the canvas, or the hypothesis without needing to log in. For the phases, just tell me a number from 1 to 4, like 'phase 2'. For the canvas or the hypothesis, tell me the name of the part, for example 'the value proposition' or 'the experiment design'. If you want your project's status or your mentor's comments, first say 'log in'. And if you didn't catch something, just say 'repeat'. What can I help you with?",
    CANCEL_MESSAGE: "Got it, I canceled that. Would you like help with another phase, the canvas, or the hypothesis?",
    STOP_MESSAGE: "Good luck with your mini company! Come back anytime. Goodbye!",
    FALLBACK_MESSAGE: "Sorry, I didn't understand what you said. Remember you can say 'help' anytime to hear what I can do. What can I help you with?",
    NEEDS_LOGIN_MESSAGE: "Before continuing I need to verify your identity. Say 'log in' to give me your name and your access seed.",
    ROLE_NOT_ALLOWED_MESSAGE: "This feature is only available for entrepreneur accounts. If you're a mentor or evaluator, please use the web app for this. Do you need anything else?",
    SESSION_EXPIRED_MESSAGE: "Your session expired. Say 'log in' to verify your identity again.",
    PHASE_NOT_FOUND_MESSAGE: "I don't have information for that phase number. Remember there are 4 in total. Which one do you need help with?",
    CANVAS_STEP_NOT_FOUND_MESSAGE: "I don't have information for that part of the canvas. Can you tell me the name again, for example the problem or the value proposition?",
    HYPOTHESIS_STEP_NOT_FOUND_MESSAGE: "I don't have information for that part of the hypothesis. Can you tell me the name again, for example the experiment design?",
    LIST_CONJUNCTION: 'and',
    PROGRESS_MESSAGE: "Just a second, let me check that.",
    PROJECTS_FETCH_ERROR_MESSAGE: "I had a problem checking your projects. Please try again in a moment.",
    NO_PROJECTS_MESSAGE: "I couldn't find any projects registered under your name yet.",
    NEED_ANYTHING_ELSE: "Do you need anything else?",
    ASK_COMMENTS_MESSAGE: "Would you like me to tell you if your mentor left any comments on this project?",
    COMMENTS_OFFER_DECLINED: "Got it. Do you need anything else?",
    CANVAS_CLOSING: "If you want to dive into another part of the canvas, just tell me its name, for example 'the channels' or 'the key metrics'.",
    HYPOTHESIS_CLOSING: "If you want to see another part of the hypothesis, just tell me its name, like 'the results log'.",
    PHASES: {
      "1": {
        "title": "Creating Your Mini Company",
        "response": "In phase one you register your company's general information. For example, for the company SnackEco: the category would be Sustainability, and the market, Eco-friendly young people.",
        "closing": "If you want to move forward, just say 'give me phase' and the number you want, from 1 to 4."
      },
      "2": {
        "title": "Registering Products or Services",
        "response": "In phase two you register your products or services. For products: name, image, description, features, and price. For services: similar, without an image, and with pricing options: range, period, or custom.",
        "closing": "If you want to move forward, just say 'give me phase' and the number you want, from 1 to 4."
      },
      "3": {
        "title": "Building the Lean Canvas",
        "response": "In phase three you build your Lean Canvas, which has nine parts: problem, customer segment, value proposition, solution, channels, revenue streams, cost structure, key metrics, and unfair advantage.",
        "closing": "If you want to dive into a specific part, you can say something like 'help me with the value proposition'."
      },
      "4": {
        "title": "Hypothesis",
        "response": "Phase four validates your idea in three steps: creating the hypothesis, designing the experiment, and logging the results.",
        "closing": "If you want to dive into a specific part, you can say something like 'explain the experiment design'."
      }
    },
    CANVAS_STEPS: {
      "problema": {
        "title": "Problem",
        "response": "Here you define the problems your customers face. For the company SnackEco, the problem would be the lack of healthy, sustainable snacks at the university."
      },
      "segmento_clientes": {
        "title": "Customer Segment",
        "response": "Here you define who has that problem. For the company SnackEco, the customer segment would be environmentally-conscious college students."
      },
      "propuesta_valor": {
        "title": "Value Proposition",
        "response": "Here you describe the value you offer. For the company SnackEco, the value proposition is tasty, high-protein snacks that help the planet."
      },
      "solucion": {
        "title": "Solution",
        "response": "Here you describe how you solve the problem. For the company SnackEco, the solution is selling insect-based snacks in biodegradable packaging."
      },
      "canales": {
        "title": "Channels",
        "response": "Here you define how your product reaches the customer. For the company SnackEco, the channel would be a stand on campus, plus Instagram and TikTok."
      },
      "fuentes_ingreso": {
        "title": "Revenue Streams",
        "response": "Here you define how you make money. For the company SnackEco, the revenue stream would be direct sales at 50 pesos per package."
      },
      "estructura_costos": {
        "title": "Cost Structure",
        "response": "Here you define your main expenses. For the company SnackEco, the cost structure is raw materials, packaging, and stand rental."
      },
      "metricas_clave": {
        "title": "Key Metrics",
        "response": "Here you define how you'll measure your success. For the company SnackEco, the key metrics are packages sold per week and repeat customers."
      },
      "ventaja_injusta": {
        "title": "Unfair Advantage",
        "response": "Here you define what's hard to copy. For the company SnackEco, the unfair advantage is based on an exclusive partnership with an organic insect farm."
      }
    },
    HYPOTHESIS_STEPS: {
      "validacion": {
        "title": "Hypothesis Validation",
        "response": "Here you state a hypothesis and how you'll test it. For the company SnackEco, the hypothesis would be that 'students will buy the snack if it costs less than 60 pesos', and you'd test it with a survey."
      },
      "diseno": {
        "title": "Experiment Design",
        "response": "Here you plan the test for your hypothesis. For the company SnackEco, the experiment design is setting up a stand at the university and trying to sell at least 20 units in one day."
      },
      "registro": {
        "title": "Results Log",
        "response": "Here you record your findings and your conclusion. For the company SnackEco, the result would be that 25 units were sold, so the hypothesis holds."
      }
    },
    ESTADO_LABELS: {
      borrador: "in draft, you haven't sent it to mentoring yet",
      pendiente_mentoria: 'pending mentoring',
      en_mentoria: 'in mentoring',
      observaciones_pendientes: 'with pending feedback to address',
      observaciones_atendidas: 'with the feedback already addressed',
      pendiente_evaluacion: 'pending evaluation',
      en_evaluacion: 'under evaluation',
      publicado: 'published, it has already been evaluated',
      devuelto: 'returned, it needs adjustments',
    },
    LOGIN_FAILURE_REASONS: {
      USER_NOT_FOUND: "I couldn't find an account with that name.",
      SEED_MISMATCH: "That seed isn't valid.",
      SEED_ALREADY_USED: "That seed has already been used, each seed works only once.",
      SEED_EXPIRED: "That seed has expired, generate a new one from the web app.",
      BACKEND_UNAVAILABLE: "I had a problem verifying your information.",
      UNKNOWN: "I couldn't verify your information.",
    },
    ERRORS: {
      DEFAULT: "Sorry, I had a problem processing your request. Can you repeat it? Remember you can also say 'help' to hear your options.",
      NETWORK: "I had a connection problem reaching the server. Please try again in a moment.",
      INVALID_RESPONSE: "I had a problem generating the response. Please try again.",
      REQUEST: "I had trouble understanding part of your request. Can you repeat it?",
    },
    INTENT_ERRORS: {
      LoginIntent: "I had a problem verifying your seed. Let's try again.",
      StartProjectGuideIntent: "I had a problem opening the guide. Please try again in a moment.",
      OverviewPhasesIntent: "I had a problem showing the project's phases. Please try again.",
      GetSpecificPhaseIntent: "I had a problem with that phase's information. Please try again.",
      CanvasDeepDiveIntent: "I had a problem with that part of the canvas. Please try again.",
      HypothesisDeepDiveIntent: "I had a problem with that part of the hypothesis. Please try again.",
      GetProjectStatusIntent: "I had a problem checking your project's status. Please try again in a moment.",
      GetMentorCommentsIntent: "I had a problem checking your mentor's comments. Please try again in a moment.",
    },
    TEMPLATES: {
      loginRetry: (reasonMessage) => `${reasonMessage} Say 'log in' whenever you want to try again with your name and seed.`,
      loginSuccess: (username, menuMessage) => `Great, ${username}. ${menuMessage}`,
      launchAuthenticated: (username, menuMessage) => `Welcome back, ${username}. ${menuMessage}`,
      statusExampleQuestion: (name) => `how's my project ${name} going`,
      commentsExampleQuestion: (name) => `how many comments does ${name} have`,
      multipleProjects: (nombres, exampleQuestion) => `You have several projects: ${nombres}. Ask again saying the name, for example "${exampleQuestion}".`,
      singleProjectNotFound: (nombres) => `I couldn't find a project with that name. Your registered project is ${nombres}.`,
      projectStatus: (nombre, estadoLabel) => `Your project ${nombre} is ${estadoLabel}.`,
      noComments: (nombre) => `Your mentor hasn't left any comments on ${nombre} yet. Do you need anything else?`,
      commentsPlural: (count) => (count === 1 ? 'comment' : 'comments'),
      withComments: (count, plural, nombre) => `Your mentor left ${count} ${plural} on ${nombre}. Do you need anything else?`,
    },
  },
};

// Regresa el set de textos para un locale dado, con fallback a
// DEFAULT_LOCALE si el locale del request no está soportado (por ejemplo
// "en-GB" cuando solo tenemos "en-US").
function getResourcesForLocale(locale) {
  return languageStrings[locale] || languageStrings[DEFAULT_LOCALE];
}

// Igual que Alexa.getLocale, pero nunca truena: si el requestEnvelope llega
// incompleto o malformado, regresamos el locale por defecto en vez de dejar
// que el error tumbe también al ErrorHandler.
function safeGetLocale(handlerInput) {
  try {
    return Alexa.getLocale(handlerInput.requestEnvelope);
  } catch (error) {
    return DEFAULT_LOCALE;
  }
}

// Lee las request attributes que dejó LocalizationInterceptor. Si por algún
// motivo no corrieron los interceptors (p. ej. el error ocurrió antes), se
// resuelve el locale de nuevo aquí mismo como respaldo.
function getResources(handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  if (requestAttributes && requestAttributes.resources) {
    return requestAttributes.resources;
  }
  return getResourcesForLocale(safeGetLocale(handlerInput));
}

// =========================================================================
// RequestInterceptor de localización: resuelve el idioma de cada request y
// lo deja disponible para todos los handlers vía request attributes. Debe
// ser el primer interceptor registrado, para que el resto de la skill ya
// tenga `resources` disponible.
// =========================================================================
const LocalizationInterceptor = {
  process(handlerInput) {
    const locale = safeGetLocale(handlerInput);
    const resources = getResourcesForLocale(locale);
    handlerInput.attributesManager.setRequestAttributes({ resources, locale });
  },
};

// =========================================================================
// Diccionario + clasificador de errores, usado por el ErrorHandler. En vez
// de responder siempre el mismo mensaje genérico, se identifica el TIPO de
// error (problema de red con el backend, respuesta no parseable, problema
// de request/slots, o desconocido) y se busca el mensaje correspondiente
// en `resources.ERRORS`.
// =========================================================================
function classifyErrorType(error) {
  const message = String((error && error.message) || error || '');

  if (/ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(message)) {
    return 'NETWORK';
  }
  if (/Unexpected token|is not valid JSON|JSON\.parse/i.test(message)) {
    return 'INVALID_RESPONSE';
  }
  if (/Expecting request type|intent\.slots|resolutions/i.test(message)) {
    return 'REQUEST';
  }
  return 'DEFAULT';
}

// =========================================================================
// Login por semilla: valida nombre + semilla (código de 4 dígitos) contra
// el api-gateway del backend real (POST /auth/seeds/validate). Si es
// válida, el gateway regresa un access token JWT (mismo shape que un login
// normal, ver AuthService.buildAuthResponse en auth-service) que la skill
// guarda en las session attributes y reenvía como "Authorization: Bearer"
// en cada llamada posterior a /empresas y /empresas/:id/observaciones.
// SEED_API_URL es configurable por variable de entorno para apuntar a otro
// ambiente sin tocar código (en dev, un seed-service o el api-gateway local;
// en producción, la URL pública del api-gateway).
// =========================================================================
const SEED_API_URL = process.env.SEED_API_URL || 'http://localhost:3001';

// Alexa corta la conexión sola a los ~8s si el endpoint no respondió nada
// (y ahí sí muestra su propio error genérico, feo, que puede sacar al
// usuario de la skill). REQUEST_TIMEOUT_MS es a propósito más corto que
// eso: así, si el backend se tarda, es NUESTRO código el que corta la
// espera primero y responde algo controlado (ver classifyErrorType/
// resources.ERRORS.NETWORK), no Alexa.
const REQUEST_TIMEOUT_MS = 6000;

// Único helper HTTP: postJson/getJson eran casi idénticos salvo el método y
// si llevaban body; getJson además necesitaba poder mandar el header
// "Authorization" para las llamadas ya autenticadas.
function requestJson(method, url, { body, headers } = {}) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(url);
    } catch (error) {
      reject(error);
      return;
    }

    const lib = target.protocol === 'https:' ? https : http;
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const requestHeaders = { ...(headers || {}) };
    if (payload !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
      requestHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const request = lib.request({
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method,
      headers: requestHeaders,
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

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms: ${method} ${url}`));
    });
    request.on('error', reject);
    if (payload !== undefined) request.write(payload);
    request.end();
  });
}

function postJson(url, body) {
  return requestJson('POST', url, { body });
}

function getJson(url, headers) {
  return requestJson('GET', url, { headers });
}

async function validateSeedWithBackend(nombre, seed) {
  try {
    const { statusCode, body } = await postJson(`${SEED_API_URL}/auth/seeds/validate`, { nombre, seed });
    const accessToken = body && body.valid && body.auth && body.auth.accessToken;
    if (statusCode >= 200 && statusCode < 300 && accessToken) {
      return { valid: true, accessToken, nombre: body.auth.user.nombre, rol: body.auth.user.rol };
    }
    return { valid: false, reason: (body && body.reason) || 'UNKNOWN' };
  } catch (error) {
    console.error(`~~~~ Error al validar la semilla contra el backend: ${error}`);
    return { valid: false, reason: 'BACKEND_UNAVAILABLE' };
  }
}

// =========================================================================
// Consulta de empresas/proyectos y observaciones (comentarios de mentor):
// usadas por GetProjectStatusIntent y GetMentorCommentsIntent. Ambas van al
// api-gateway con el access token de la sesión ("Authorization: Bearer").
// Regresan `{ ok:false, reason:'UNAUTHORIZED' }` cuando el token murió
// (expiró o fue revocado) para que el handler pueda pedir que inicie
// sesión de nuevo, y `{ ok:false, reason:'BACKEND_UNAVAILABLE' }` para
// cualquier otro problema de conexión/respuesta.
// =========================================================================
async function fetchEmpresasForUser(accessToken) {
  try {
    const { statusCode, body } = await getJson(`${SEED_API_URL}/empresas`, { Authorization: `Bearer ${accessToken}` });
    if (statusCode === 401) {
      return { ok: false, reason: 'UNAUTHORIZED' };
    }
    if (statusCode >= 200 && statusCode < 300 && Array.isArray(body)) {
      return { ok: true, empresas: body };
    }
    return { ok: false, reason: 'BACKEND_UNAVAILABLE' };
  } catch (error) {
    console.error(`~~~~ Error al consultar las empresas: ${error}`);
    return { ok: false, reason: 'BACKEND_UNAVAILABLE' };
  }
}

async function fetchObservacionesForEmpresa(accessToken, empresaId) {
  try {
    const url = `${SEED_API_URL}/empresas/${encodeURIComponent(empresaId)}/observaciones`;
    const { statusCode, body } = await getJson(url, { Authorization: `Bearer ${accessToken}` });
    if (statusCode === 401) {
      return { ok: false, reason: 'UNAUTHORIZED' };
    }
    if (statusCode >= 200 && statusCode < 300 && Array.isArray(body)) {
      return { ok: true, observaciones: body };
    }
    return { ok: false, reason: 'BACKEND_UNAVAILABLE' };
  } catch (error) {
    console.error(`~~~~ Error al consultar las observaciones: ${error}`);
    return { ok: false, reason: 'BACKEND_UNAVAILABLE' };
  }
}

// =========================================================================
// Progressive Response: le pide a Alexa que diga una frase corta ("dame un
// segundo...") MIENTRAS el handler sigue esperando la llamada al backend
// (login, empresas, observaciones), en vez de dejar al usuario en
// silencio hasta que la respuesta final esté lista. Es un directive aparte
// (Alexa.getDirectiveServiceClient), no la respuesta normal del handler,
// así que un fallo aquí nunca debe tumbar la respuesta real: si algo sale
// mal (por ejemplo, sin apiAccessToken en pruebas locales por curl), solo
// se registra el error y la skill sigue su flujo normal sin la frase de
// espera.
// =========================================================================
async function sendProgressiveResponse(handlerInput, speechText) {
  try {
    const requestId = handlerInput.requestEnvelope.request.requestId;
    const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();
    await directiveServiceClient.enqueue({
      header: { requestId },
      directive: { type: 'VoicePlayer.Speak', speech: speechText },
    });
  } catch (error) {
    console.error(`~~~~ Error al mandar progressive response: ${error}`);
  }
}

// Consulta y arma el texto de "cuántos comentarios tiene {empresa}", usado
// tanto por GetMentorCommentsIntentHandler como por la confirmación de
// "sí" después de preguntar el estado de un proyecto (ver
// GetProjectStatusIntentHandler y YesNoIntentHandler) para no duplicar la
// misma lógica en los dos lugares.
async function fetchCommentsSpeech(accessToken, empresa, resources) {
  const observacionesResult = await fetchObservacionesForEmpresa(accessToken, empresa.id);

  if (!observacionesResult.ok) {
    if (observacionesResult.reason === 'UNAUTHORIZED') {
      return { unauthorized: true };
    }
    return { speakOutput: resources.PROJECTS_FETCH_ERROR_MESSAGE };
  }

  const comentarios = observacionesResult.observaciones;
  if (comentarios.length === 0) {
    return { speakOutput: resources.TEMPLATES.noComments(empresa.nombre) };
  }
  const plural = resources.TEMPLATES.commentsPlural(comentarios.length);
  return { speakOutput: resources.TEMPLATES.withComments(comentarios.length, plural, empresa.nombre) };
}

// Si el usuario dio un nombre de proyecto, busca coincidencia parcial
// (case-insensitive). Si no dio nombre: primero intenta el "proyecto
// activo" que haya quedado guardado en la sesión de una pregunta anterior
// (activeProjectId, ver GetProjectStatusIntentHandler/
// GetMentorCommentsIntentHandler), y si no hay ninguno, solo se resuelve
// solo cuando hay exactamente una empresa; con varias y sin proyecto
// activo, se deja que el handler pida que repita la pregunta con el
// nombre (nombreProyecto no tiene elicitación configurada en el modelo de
// interacción).
function resolveProject(empresas, nombreProyecto, activeProjectId) {
  if (nombreProyecto) {
    const normalized = nombreProyecto.trim().toLowerCase();
    return empresas.find((p) => p.nombre.toLowerCase().includes(normalized)) || null;
  }
  if (activeProjectId) {
    const activeProject = empresas.find((p) => p.id === activeProjectId);
    if (activeProject) return activeProject;
  }
  return empresas.length === 1 ? empresas[0] : null;
}

function isAuthenticated(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  return !!(sessionAttributes && sessionAttributes.authenticated && sessionAttributes.accessToken);
}

// =========================================================================
// Protección por rol: GetProjectStatusIntent/GetMentorCommentsIntent (y su
// seguimiento de "sí, dime los comentarios") consultan /empresas, que en
// el backend regresa cosas distintas según el rol (whereScope en
// empresas-service): al emprendedor sus propias empresas, al mentor las
// que mentorea, al evaluador las que evalúa. Pero el LENGUAJE de la skill
// ("tu mini empresa", "tu proyecto") solo tiene sentido para quien es
// dueño del proyecto. Por eso, aparte del scoping por fila que ya hace el
// backend, la skill bloquea estas funciones a cualquier rol que no sea
// "emprendedor" — un mentor o evaluador que inicie sesión por voz puede
// usar el resto de la guía, pero no esta parte.
// =========================================================================
const REQUIRED_ROLE_FOR_PROJECT_INTENTS = 'emprendedor';

function hasRequiredRole(handlerInput, requiredRole) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  return !!(sessionAttributes && sessionAttributes.rol === requiredRole);
}

function buildRoleNotAllowedResponse(handlerInput) {
  const resources = getResources(handlerInput);
  return handlerInput.responseBuilder
    .speak(resources.ROLE_NOT_ALLOWED_MESSAGE)
    .reprompt(resources.ROLE_NOT_ALLOWED_MESSAGE)
    .getResponse();
}

// Limpia la sesión cuando el access token ya no sirve (expiró o fue
// revocado): el usuario vuelve a quedar como si nunca hubiera iniciado
// sesión, sin necesidad de reabrir la skill.
function clearAuthentication(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  delete sessionAttributes.authenticated;
  delete sessionAttributes.username;
  delete sessionAttributes.accessToken;
  delete sessionAttributes.activeProjectId;
  delete sessionAttributes.rol;
  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
}

// Respuesta corta usada por los intents de contenido cuando el token de la
// sesión ya no sirve. Limpia la sesión y pide iniciar sesión de nuevo.
function buildSessionExpiredResponse(handlerInput) {
  clearAuthentication(handlerInput);
  const resources = getResources(handlerInput);
  return handlerInput.responseBuilder
    .speak(resources.SESSION_EXPIRED_MESSAGE)
    .reprompt(resources.SESSION_EXPIRED_MESSAGE)
    .getResponse();
}

// Respuesta corta usada por los intents de contenido cuando el usuario
// todavía no inició sesión. No delega el diálogo directamente para
// mantener el mismo patrón simple que ya usa el resto de la skill: el
// usuario dispara LoginIntent diciendo "inicia sesión".
function buildLoginRequiredResponse(handlerInput) {
  const resources = getResources(handlerInput);
  return handlerInput.responseBuilder
    .speak(resources.NEEDS_LOGIN_MESSAGE)
    .reprompt(resources.NEEDS_LOGIN_MESSAGE)
    .getResponse();
}

// Arma una lista en lenguaje natural ("a, b y c"), no "a y b y c": con 2
// elementos usa la conjunción entre ambos; con 3 o más, coma entre todos
// menos el último, y la conjunción antes del último. Usado para leer los
// nombres de las empresas cuando hay que pedirle al usuario que elija.
function joinWithConjunction(items, conjunction) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return items.join(` ${conjunction} `);
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
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
// LaunchRequest + StartProjectGuideIntent + AMAZON.NavigateHomeIntent
// (los tres regresan al mismo punto de partida: bienvenida o menú si ya
// hay sesión). AMAZON.NavigateHomeIntent estaba declarado en ambos modelos
// de interacción (models/es-MX.json, models/en-US.json) pero SIN handler:
// cualquier usuario que la disparara (p. ej. "ve al inicio") caía al
// ErrorHandler genérico en vez de recibir una respuesta útil.
// =========================================================================
const LaunchAndStartHandler = {
  canHandle(handlerInput) {
    // IMPORTANTE: se valida el requestType con && (corto-circuito) antes de
    // llamar a getIntentName, igual que el resto de los handlers de intents
    // (ver ejemplo en GetProjectStatusIntentHandler). getIntentName() lanza
    // un error si el request no es un IntentRequest, así que encadenarlo
    // con || detrás de "requestType === 'LaunchRequest'" hacía que CUALQUIER
    // otro tipo de request (SessionEndedRequest, etc.) tronara el canHandle
    // y mandara la skill al ErrorHandler sin necesidad.
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    if (requestType === 'LaunchRequest') {
      return true;
    }
    if (requestType !== 'IntentRequest') {
      return false;
    }
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    return intentName === 'StartProjectGuideIntent' || intentName === 'AMAZON.NavigateHomeIntent';
  },
  handle(handlerInput) {
    try {
      const resources = getResources(handlerInput);

      if (!isAuthenticated(handlerInput)) {
        // Ya NO se fuerza el login: solo una presentación breve. El usuario
        // decide si quiere iniciar sesión (para lo de sus proyectos) o usar
        // la guía general directamente.
        return handlerInput.responseBuilder
          .speak(resources.WELCOME_MESSAGE)
          .reprompt(resources.WELCOME_MESSAGE)
          .getResponse();
      }

      const { username } = handlerInput.attributesManager.getSessionAttributes();
      const speakOutput = resources.TEMPLATES.launchAuthenticated(username, resources.MENU_MESSAGE);
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(resources.MENU_MESSAGE)
        .getResponse();
    } catch (error) {
      console.error(`~~~~ Error en LaunchAndStartHandler: ${error}`);
      const resources = getResources(handlerInput);
      const speakOutput = resources.INTENT_ERRORS.StartProjectGuideIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
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
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LoginIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) === 'COMPLETED';
  },
  async handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      const nombreUsuario = getResolvedSlotId(handlerInput, 'nombreUsuario');
      const semilla = getResolvedSlotId(handlerInput, 'semilla');

      await sendProgressiveResponse(handlerInput, resources.PROGRESS_MESSAGE);
      const result = await validateSeedWithBackend(nombreUsuario, semilla);

      if (!result.valid) {
        const reasonMessage = resources.LOGIN_FAILURE_REASONS[result.reason] || resources.LOGIN_FAILURE_REASONS.UNKNOWN;
        const speakOutput = resources.TEMPLATES.loginRetry(reasonMessage);
        // NO se reinicia el diálogo con un directive (ver historial: tanto
        // "slots: {}" como una reconstrucción "completa" del updatedIntent
        // demostraron ser fráginles con confirmationRequired activo en
        // "semilla" — Alexa terminaba la sesión con su propio error
        // genérico antes de que nuestro try/catch pudiera reaccionar,
        // porque el problema ocurre al procesar el directive del lado de
        // Alexa, no en el JSON que regresamos). En vez de eso: se responde
        // con el motivo y se deja la sesión abierta con un reprompt plano,
        // sin ningún directive. El usuario simplemente vuelve a decir
        // "inicia sesión" para reintentar desde cero (ese camino, el de
        // LoginIntentDialogDelegationHandler con addDelegateDirective()
        // SIN argumentos, es el simple y ya probado que nunca ha fallado).
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(speakOutput)
          .getResponse();
      }

      // Se guarda el nombre REGISTRADO que regresó el backend (result.nombre),
      // no el que dijo el usuario por voz (nombreUsuario puede venir
      // incompleto, p. ej. solo el primer nombre) — así los saludos
      // posteriores usan el nombre completo real.
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.authenticated = true;
      sessionAttributes.username = result.nombre;
      sessionAttributes.accessToken = result.accessToken;
      sessionAttributes.rol = result.rol;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      const speakOutput = resources.TEMPLATES.loginSuccess(result.nombre, resources.MENU_MESSAGE);
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(resources.MENU_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en LoginIntentHandler: ${error}`);
      const speakOutput = resources.INTENT_ERRORS.LoginIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    }
  },
};

const LoginIntentDialogDelegationHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LoginIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) !== 'COMPLETED';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en LoginIntentDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
    }
  },
};

// =========================================================================
// OverviewPhasesIntent -> ahora es solo un menú corto (UX: no saturar)
// =========================================================================
const OverviewPhasesIntentHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OverviewPhasesIntent';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      return handlerInput.responseBuilder
        .speak(resources.OVERVIEW_MESSAGE)
        .reprompt(resources.OVERVIEW_REPROMPT)
        .getResponse();
    } catch (error) {
      console.error(`~~~~ Error en OverviewPhasesIntentHandler: ${error}`);
      const speakOutput = resources.INTENT_ERRORS.OverviewPhasesIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
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
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSpecificPhaseIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) === 'COMPLETED';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      const numeroFase = getResolvedSlotId(handlerInput, 'numeroFase');
      const fase = resources.PHASES[numeroFase];

      if (!fase) {
        return handlerInput.responseBuilder
          .speak(resources.PHASE_NOT_FOUND_MESSAGE)
          .reprompt(resources.PHASE_NOT_FOUND_MESSAGE)
          .getResponse();
      }

      const speakOutput = `${fase.response} ${fase.closing}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(fase.closing).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetSpecificPhaseIntentHandler: ${error}`);
      const speakOutput = resources.INTENT_ERRORS.GetSpecificPhaseIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    }
  },
};

const GetSpecificPhaseDialogDelegationHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSpecificPhaseIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) !== 'COMPLETED';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetSpecificPhaseDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
    }
  },
};

// =========================================================================
// CanvasDeepDiveIntent (slot: canvasStepName, tipo CANVAS_STEP_NAME)
// Ahora se pide por NOMBRE ("la propuesta de valor"), no por número.
// =========================================================================
const CanvasDeepDiveIntentHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CanvasDeepDiveIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) === 'COMPLETED';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      const canvasStepName = getResolvedSlotId(handlerInput, 'canvasStepName');
      const step = resources.CANVAS_STEPS[canvasStepName];

      if (!step) {
        return handlerInput.responseBuilder
          .speak(resources.CANVAS_STEP_NOT_FOUND_MESSAGE)
          .reprompt(resources.CANVAS_STEP_NOT_FOUND_MESSAGE)
          .getResponse();
      }

      const speakOutput = `${step.response} ${resources.CANVAS_CLOSING}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(resources.CANVAS_CLOSING).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en CanvasDeepDiveIntentHandler: ${error}`);
      const speakOutput = resources.INTENT_ERRORS.CanvasDeepDiveIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    }
  },
};

const CanvasDeepDiveDialogDelegationHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CanvasDeepDiveIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) !== 'COMPLETED';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en CanvasDeepDiveDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
    }
  },
};

// =========================================================================
// HypothesisDeepDiveIntent (slot: hypothesisStepName, tipo HYPOTHESIS_STEP_NAME)
// Reemplaza a las antiguas fases 4, 5 y 6. Se pide por NOMBRE, igual que el
// canvas ("el diseño del experimento").
// =========================================================================
const HypothesisDeepDiveIntentHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HypothesisDeepDiveIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) === 'COMPLETED';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      const hypothesisStepName = getResolvedSlotId(handlerInput, 'hypothesisStepName');
      const step = resources.HYPOTHESIS_STEPS[hypothesisStepName];

      if (!step) {
        return handlerInput.responseBuilder
          .speak(resources.HYPOTHESIS_STEP_NOT_FOUND_MESSAGE)
          .reprompt(resources.HYPOTHESIS_STEP_NOT_FOUND_MESSAGE)
          .getResponse();
      }

      const speakOutput = `${step.response} ${resources.HYPOTHESIS_CLOSING}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(resources.HYPOTHESIS_CLOSING).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en HypothesisDeepDiveIntentHandler: ${error}`);
      const speakOutput = resources.INTENT_ERRORS.HypothesisDeepDiveIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    }
  },
};

const HypothesisDeepDiveDialogDelegationHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HypothesisDeepDiveIntent'
      && Alexa.getDialogState(handlerInput.requestEnvelope) !== 'COMPLETED';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } catch (error) {
      console.error(`~~~~ Error en HypothesisDeepDiveDialogDelegationHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
    }
  },
};

// =========================================================================
// GetProjectStatusIntent (slot opcional: nombreProyecto, AMAZON.SearchQuery)
// Solo da el estatus del proyecto, sin detalles adicionales. Si el usuario
// tiene más de un proyecto y no dijo el nombre, se le pide que lo repita
// (el slot no tiene elicitación configurada en el modelo de interacción).
// Este es el patrón de canHandle "de referencia": valida requestType con &&
// (corto-circuito) antes de leer intent/slots, y no depende de dialogState.
// =========================================================================
const GetProjectStatusIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetProjectStatusIntent';
  },
  async handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      if (!isAuthenticated(handlerInput)) {
        return buildLoginRequiredResponse(handlerInput);
      }
      if (!hasRequiredRole(handlerInput, REQUIRED_ROLE_FOR_PROJECT_INTENTS)) {
        return buildRoleNotAllowedResponse(handlerInput);
      }

      const { accessToken, activeProjectId } = handlerInput.attributesManager.getSessionAttributes();
      const nombreProyecto = getResolvedSlotId(handlerInput, 'nombreProyecto');

      await sendProgressiveResponse(handlerInput, resources.PROGRESS_MESSAGE);
      const result = await fetchEmpresasForUser(accessToken);

      if (!result.ok) {
        if (result.reason === 'UNAUTHORIZED') {
          return buildSessionExpiredResponse(handlerInput);
        }
        return handlerInput.responseBuilder
          .speak(resources.PROJECTS_FETCH_ERROR_MESSAGE)
          .reprompt(resources.PROJECTS_FETCH_ERROR_MESSAGE)
          .getResponse();
      }

      const { empresas } = result;
      if (empresas.length === 0) {
        return handlerInput.responseBuilder
          .speak(resources.NO_PROJECTS_MESSAGE)
          .reprompt(resources.NO_PROJECTS_MESSAGE)
          .getResponse();
      }

      const empresa = resolveProject(empresas, nombreProyecto, activeProjectId);

      if (!empresa) {
        const nombres = joinWithConjunction(empresas.map((p) => p.nombre), resources.LIST_CONJUNCTION);
        const speakOutput = empresas.length > 1
          ? resources.TEMPLATES.multipleProjects(nombres, resources.TEMPLATES.statusExampleQuestion(empresas[0].nombre))
          : resources.TEMPLATES.singleProjectNotFound(nombres);
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      // Se recuerda como "proyecto activo" de la sesión: si en la siguiente
      // pregunta el usuario no vuelve a decir el nombre, se reusa este.
      // pendingCommentsProjectId marca que la PRÓXIMA respuesta "sí"/"no"
      // es la respuesta a "¿quieres que te diga si tiene comentarios?"
      // (ver YesNoIntentHandler), para no obligar al usuario a decir el
      // intent de comentarios completo si ya se lo estamos ofreciendo.
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.activeProjectId = empresa.id;
      sessionAttributes.pendingCommentsProjectId = empresa.id;
      sessionAttributes.pendingCommentsProjectName = empresa.nombre;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      const estadoLabel = resources.ESTADO_LABELS[empresa.estado] || empresa.estado;
      const speakOutput = `${resources.TEMPLATES.projectStatus(empresa.nombre, estadoLabel)} ${resources.ASK_COMMENTS_MESSAGE}`;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(resources.ASK_COMMENTS_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetProjectStatusIntentHandler: ${error}`);
      const speakOutput = resources.INTENT_ERRORS.GetProjectStatusIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
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
    const resources = getResources(handlerInput);
    try {
      if (!isAuthenticated(handlerInput)) {
        return buildLoginRequiredResponse(handlerInput);
      }
      if (!hasRequiredRole(handlerInput, REQUIRED_ROLE_FOR_PROJECT_INTENTS)) {
        return buildRoleNotAllowedResponse(handlerInput);
      }

      const { accessToken, activeProjectId } = handlerInput.attributesManager.getSessionAttributes();
      const nombreProyecto = getResolvedSlotId(handlerInput, 'nombreProyecto');

      await sendProgressiveResponse(handlerInput, resources.PROGRESS_MESSAGE);
      const empresasResult = await fetchEmpresasForUser(accessToken);

      if (!empresasResult.ok) {
        if (empresasResult.reason === 'UNAUTHORIZED') {
          return buildSessionExpiredResponse(handlerInput);
        }
        return handlerInput.responseBuilder
          .speak(resources.PROJECTS_FETCH_ERROR_MESSAGE)
          .reprompt(resources.PROJECTS_FETCH_ERROR_MESSAGE)
          .getResponse();
      }

      const { empresas } = empresasResult;
      if (empresas.length === 0) {
        return handlerInput.responseBuilder
          .speak(resources.NO_PROJECTS_MESSAGE)
          .reprompt(resources.NO_PROJECTS_MESSAGE)
          .getResponse();
      }

      const empresa = resolveProject(empresas, nombreProyecto, activeProjectId);

      if (!empresa) {
        const nombres = joinWithConjunction(empresas.map((p) => p.nombre), resources.LIST_CONJUNCTION);
        const speakOutput = empresas.length > 1
          ? resources.TEMPLATES.multipleProjects(nombres, resources.TEMPLATES.commentsExampleQuestion(empresas[0].nombre))
          : resources.TEMPLATES.singleProjectNotFound(nombres);
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      }

      // Se recuerda como "proyecto activo" de la sesión, igual que en
      // GetProjectStatusIntentHandler.
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.activeProjectId = empresa.id;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      // Solo se dice CUÁNTOS comentarios hay, nunca su contenido: para leer el
      // detalle de cada observación el usuario debe ir a la app web.
      const commentsResult = await fetchCommentsSpeech(accessToken, empresa, resources);
      if (commentsResult.unauthorized) {
        return buildSessionExpiredResponse(handlerInput);
      }
      return handlerInput.responseBuilder.speak(commentsResult.speakOutput).reprompt(resources.NEED_ANYTHING_ELSE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en GetMentorCommentsIntentHandler: ${error}`);
      const speakOutput = resources.INTENT_ERRORS.GetMentorCommentsIntent || resources.ERRORS.DEFAULT;
      return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    }
  },
};

// =========================================================================
// AMAZON.RepeatIntent + AMAZON.YesIntent/AMAZON.NoIntent: red de seguridad
// contra salidas accidentales. La causa más común de que un usuario
// termine saliendo de la skill sin querer es no entender/no escuchar bien
// una respuesta y quedarse callado hasta que Alexa cierra la sesión por
// timeout; poder decir "repite" evita eso. YesIntent/NoIntent no se usan
// para ningún diálogo de confirmación hoy, pero si Alexa los dispara por
// una interpretación ambigua, sin handler caerían al ErrorHandler
// genérico — aquí se atajan con un mensaje que reencauza al usuario en
// vez de un error, sin terminar la sesión.
// =========================================================================
const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      const { lastSpeech, lastReprompt } = handlerInput.attributesManager.getSessionAttributes();
      if (!lastSpeech) {
        return handlerInput.responseBuilder.speak(resources.MENU_MESSAGE).reprompt(resources.MENU_MESSAGE).getResponse();
      }
      return handlerInput.responseBuilder.speak(lastSpeech).reprompt(lastReprompt || lastSpeech).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en RepeatIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
    }
  },
};

const YesNoIntentHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    if (requestType !== 'IntentRequest') return false;
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    return intentName === 'AMAZON.YesIntent' || intentName === 'AMAZON.NoIntent';
  },
  async handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      // Si el turno anterior fue GetProjectStatusIntent ofreciendo leer los
      // comentarios (ver GetProjectStatusIntentHandler), este "sí"/"no" le
      // responde a ESA pregunta en vez del genérico menú de abajo.
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      const { pendingCommentsProjectId, pendingCommentsProjectName, accessToken } = sessionAttributes;
      const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);

      if (pendingCommentsProjectId) {
        delete sessionAttributes.pendingCommentsProjectId;
        delete sessionAttributes.pendingCommentsProjectName;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        if (intentName === 'AMAZON.NoIntent') {
          return handlerInput.responseBuilder
            .speak(resources.COMMENTS_OFFER_DECLINED)
            .reprompt(resources.NEED_ANYTHING_ELSE)
            .getResponse();
        }

        if (!isAuthenticated(handlerInput)) {
          return buildLoginRequiredResponse(handlerInput);
        }
        if (!hasRequiredRole(handlerInput, REQUIRED_ROLE_FOR_PROJECT_INTENTS)) {
          return buildRoleNotAllowedResponse(handlerInput);
        }

        await sendProgressiveResponse(handlerInput, resources.PROGRESS_MESSAGE);
        const empresa = { id: pendingCommentsProjectId, nombre: pendingCommentsProjectName };
        const commentsResult = await fetchCommentsSpeech(accessToken, empresa, resources);
        if (commentsResult.unauthorized) {
          return buildSessionExpiredResponse(handlerInput);
        }
        return handlerInput.responseBuilder
          .speak(commentsResult.speakOutput)
          .reprompt(resources.NEED_ANYTHING_ELSE)
          .getResponse();
      }

      return handlerInput.responseBuilder.speak(resources.MENU_MESSAGE).reprompt(resources.MENU_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en YesNoIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
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
    const resources = getResources(handlerInput);
    try {
      return handlerInput.responseBuilder.speak(resources.HELP_MESSAGE).reprompt(resources.HELP_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en HelpIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
    }
  },
};

// =========================================================================
// AMAZON.CancelIntent y AMAZON.StopIntent
// =========================================================================
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return requestType === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
      const speakOutput = intentName === 'AMAZON.StopIntent' ? resources.STOP_MESSAGE : resources.CANCEL_MESSAGE;
      const responseBuilder = handlerInput.responseBuilder.speak(speakOutput);

      if (intentName === 'AMAZON.StopIntent') {
        return responseBuilder.withShouldEndSession(true).getResponse();
      }
      return responseBuilder.reprompt(resources.CANCEL_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en CancelAndStopIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).withShouldEndSession(true).getResponse();
    }
  },
};

// =========================================================================
// AMAZON.FallbackIntent -> petición no reconocida. No debe terminar la
// sesión: siempre repregunta (reprompt), para que un intent mal
// interpretado nunca saque al usuario de la skill sin querer.
// =========================================================================
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const resources = getResources(handlerInput);
    try {
      return handlerInput.responseBuilder.speak(resources.FALLBACK_MESSAGE).reprompt(resources.FALLBACK_MESSAGE).getResponse();
    } catch (error) {
      console.error(`~~~~ Error en FallbackIntentHandler: ${error}`);
      return handlerInput.responseBuilder.speak(resources.ERRORS.DEFAULT).reprompt(resources.ERRORS.DEFAULT).getResponse();
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
// atrapados dentro de un handler, por ejemplo fallas del propio SDK o un
// canHandle que truena (ver nota en LaunchAndStartHandler).
//
// El mensaje ya no es siempre el mismo: `classifyErrorType` identifica el
// tipo de error y busca la respuesta correspondiente en el diccionario
// `resources.ERRORS` del locale del usuario, con "DEFAULT" como respaldo.
// Si el error ocurrió durante un SessionEndedRequest, no se manda
// speak/reprompt porque Alexa no lo acepta ahí.
// =========================================================================
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`~~~~ Error no controlado: ${(error && error.stack) || error}`);

    let requestType = null;
    try {
      requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    } catch (typeError) {
      requestType = null;
    }

    if (requestType === 'SessionEndedRequest') {
      return handlerInput.responseBuilder.getResponse();
    }

    // Si el error truena antes de que el propio handler llegue a su
    // try/catch (por ejemplo, un canHandle que lanza), este es el único
    // lugar que sabe qué intent se estaba procesando. Prioridad: mensaje
    // específico del intent (INTENT_ERRORS) > mensaje por tipo de error
    // (ERRORS, ver classifyErrorType) > genérico (ERRORS.DEFAULT).
    let intentName = null;
    try {
      if (requestType === 'IntentRequest') {
        intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
      }
    } catch (intentNameError) {
      intentName = null;
    }

    const resources = getResources(handlerInput);
    const errorKey = classifyErrorType(error);
    const speakOutput = (intentName && resources.INTENT_ERRORS[intentName])
      || resources.ERRORS[errorKey]
      || resources.ERRORS.DEFAULT;
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  },
};

// =========================================================================
// ResponseInterceptor: guarda el último "speak"/"reprompt" en las session
// attributes después de CADA respuesta, para que AMAZON.RepeatIntent pueda
// repetirlo sin que cada handler tenga que guardarlo por su cuenta. Se
// registra después de que el handler ya construyó su respuesta, así que
// nunca puede ser la causa de que un handler falle.
// =========================================================================
function stripSpeakTag(ssml) {
  return String(ssml).replace(/^<speak>/, '').replace(/<\/speak>$/, '');
}

const LastResponseInterceptor = {
  process(handlerInput, response) {
    try {
      const speechSsml = response && response.outputSpeech && response.outputSpeech.ssml;
      if (!speechSsml) return;

      const repromptSsml = response.reprompt
        && response.reprompt.outputSpeech
        && response.reprompt.outputSpeech.ssml;

      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.lastSpeech = stripSpeakTag(speechSsml);
      sessionAttributes.lastReprompt = repromptSsml ? stripSpeakTag(repromptSsml) : sessionAttributes.lastSpeech;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    } catch (error) {
      console.error(`~~~~ Error en LastResponseInterceptor: ${error}`);
    }
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
    RepeatIntentHandler,
    YesNoIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addResponseInterceptors(LastResponseInterceptor)
  .addErrorHandlers(ErrorHandler);

exports.skillBuilder = skillBuilder;
exports.handler = skillBuilder.lambda();

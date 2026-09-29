// Textos de la interfaz en español, inglés y portugués.
// Uso: t('nav.chat') o t('disp.libres', { n: 3 }).
// Para agregar un texto: añadir la misma clave en los tres idiomas.

import { COP_POR_BRL } from './config.js';

export const IDIOMAS = ['es', 'en', 'pt'];

const TEXTOS = {
  es: {
    'app.nombre': 'Ecoruta Conectada',
    'app.lema': 'Turismo directo con las comunidades del Amazonas',
    'idioma.etiqueta': 'Idioma',
    'nav.inicio': 'Inicio',
    'nav.chat': 'Asistente',
    'nav.experiencias': 'Experiencias',
    'nav.lenguas': 'Lenguas',
    'cargando': 'Cargando…',
    'volver': 'Volver',
    'reintentar': 'Reintentar',
    'error.red': 'Sin conexión. Revisa tu señal e inténtalo de nuevo.',
    'error.generico': 'Algo salió mal. Inténtalo de nuevo.',
    'error.noEncontrado': 'No encontramos lo que buscas.',

    'inicio.titulo': 'Bienvenido a Leticia',
    'inicio.texto': 'Reserva experiencias directamente con emprendimientos indígenas y locales, sin intermediarios, y aprende a saludar en sus lenguas.',
    'inicio.chat': 'Hablar con el asistente',
    'inicio.experiencias': 'Ver experiencias',
    'inicio.lenguas': 'Lenguas y saludos',
    'inicio.misReservas': 'Mis reservas',

    'chat.titulo': 'Asistente',
    'chat.bienvenida': 'Hola 👋 Cuéntame qué te interesa (aves, delfines, artesanías, cultura…) y te muestro experiencias. También puedo enseñarte saludos en lenguas indígenas.',
    'chat.placeholder': 'Escribe tu mensaje…',
    'chat.enviar': 'Enviar',
    'chat.escribiendo': 'El asistente está escribiendo…',
    'chat.privacidad': 'No escribas datos personales en el chat: para reservar te mostramos un formulario.',
    'chat.nueva': 'Nueva conversación',
    'chat.sugerencias': 'Quiero ver delfines|¿Cómo se dice gracias en tikuna?|Arma un itinerario de 2 días con cultura',

    'exp.titulo': 'Experiencias',
    'exp.todas': 'Todas',
    'exp.ninguna': 'No hay experiencias con ese interés.',
    'exp.ver': 'Ver detalle',
    'exp.porPersona': 'por persona',
    'exp.duracion': 'Duración',
    'exp.salida': 'Salida',
    'exp.dias': 'Días',
    'exp.dificultad': 'Dificultad',
    'exp.encuentro': 'Punto de encuentro',
    'exp.incluye': 'Incluye',
    'exp.noIncluye': 'No incluye',
    'exp.queLlevar': 'Qué llevar',
    'exp.cancelacion': 'Cancelación',
    'exp.privada': 'Reserva natural privada',
    'exp.guias': 'Idiomas de los guías',
    'exp.contacto': 'Escribir por WhatsApp',
    'exp.saludos': 'Saluda en la lengua de la comunidad',
    'exp.noReservable': 'Esta experiencia todavía no se puede reservar en línea.',
    'exp.mapa': 'Ver en el mapa',

    'disp.titulo': 'Reservar',
    'disp.fecha': 'Fecha',
    'disp.personas': 'Personas',
    'disp.consultar': 'Ver disponibilidad',
    'disp.libres': 'Hay {n} cupos libres.',
    'disp.motivo.NO_RESERVABLE': 'Todavía no tiene precio o capacidad definidos.',
    'disp.motivo.FECHA_PASADA': 'Esa fecha ya pasó.',
    'disp.motivo.YA_SALIO': 'Hoy ya pasó la hora de salida.',
    'disp.motivo.DIA_NO_OPERA': 'No opera ese día de la semana.',
    'disp.motivo.FECHA_BLOQUEADA': 'Esa fecha no está disponible.',
    'disp.motivo.SIN_CUPOS': 'No quedan cupos suficientes para esa fecha.',

    'res.titulo': 'Tus datos para la reserva',
    'res.resumen': '{fecha} · Personas: {n} · Total {total}',
    'res.nombre': 'Nombre',
    'res.email': 'Correo electrónico',
    'res.telefono': 'Teléfono o WhatsApp (opcional)',
    'res.enviar': 'Apartar cupo',
    'res.enviando': 'Apartando…',
    'res.privacidad': 'Tus datos solo se usan para esta reserva y no se envían al asistente de IA.',
    'res.apartado': 'El cupo queda apartado 15 minutos mientras pagas.',

    'resv.titulo': 'Tu reserva',
    'resv.estado.PENDIENTE_PAGO': 'Pendiente de pago',
    'resv.estado.CONFIRMADA': 'Confirmada',
    'resv.estado.CANCELADA': 'Cancelada',
    'resv.estado.EXPIRADA': 'Expirada',
    'resv.vence': 'El cupo está apartado por {tiempo}',
    'resv.vencida': 'El tiempo para pagar terminó.',
    'resv.pago': 'El pago en línea estará disponible muy pronto.',
    'resv.cancelar': 'Cancelar reserva',
    'resv.confirmarCancelar': '¿Seguro que quieres cancelar esta reserva?',
    'resv.fecha': 'Fecha',
    'resv.personas': 'Personas',
    'resv.total': 'Total',
    'resv.titular': 'A nombre de',
    'resv.codigo': 'Código',
    'resv.lista': 'Mis reservas',
    'resv.ninguna': 'Aún no tienes reservas en este dispositivo.',

    'len.titulo': 'Lenguas del Amazonas',
    'len.intro': 'Contenido verificado con hablantes y fuentes de cada comunidad. No lo genera ni lo traduce la inteligencia artificial.',
    'len.fichas': '{n} fichas verificadas',
    'len.enValidacion': 'En proceso de validación con la comunidad.',
    'len.escuchar': 'Escuchar',
    'len.pronunciacion': 'Pronunciación',
    'len.fuente': 'Fuente',
    'len.compartido': 'Compartido por',
    'len.permiso': 'Uso',
    'len.verificada': 'Verificada',
    'len.contexto': 'Cuándo se usa',
    'len.todas': 'Ver todas las lenguas',

    'iti.titulo': 'Itinerario sugerido',
    'iti.dia': 'Día {n}',

    'dia.lunes': 'lunes', 'dia.martes': 'martes', 'dia.miercoles': 'miércoles',
    'dia.jueves': 'jueves', 'dia.viernes': 'viernes', 'dia.sabado': 'sábado',
    'dia.domingo': 'domingo',
    'dificultad.baja': 'baja', 'dificultad.media': 'media', 'dificultad.alta': 'alta',

    'interes.aves': 'Aves', 'interes.delfines': 'Delfines', 'interes.pesca': 'Pesca',
    'interes.gastronomia': 'Gastronomía', 'interes.artesanias': 'Artesanías',
    'interes.plantas_medicinales': 'Plantas medicinales', 'interes.caminata': 'Caminata',
    'interes.cultura': 'Cultura', 'interes.fotografia': 'Fotografía',
    'interes.navegacion': 'Navegación', 'interes.musica_danza': 'Música y danza',
    'interes.aventura': 'Aventura', 'interes.fauna': 'Fauna',
  },

  en: {
    'app.nombre': 'Ecoruta Conectada',
    'app.lema': 'Direct tourism with Amazon communities',
    'idioma.etiqueta': 'Language',
    'nav.inicio': 'Home',
    'nav.chat': 'Assistant',
    'nav.experiencias': 'Experiences',
    'nav.lenguas': 'Languages',
    'cargando': 'Loading…',
    'volver': 'Back',
    'reintentar': 'Try again',
    'error.red': 'No connection. Check your signal and try again.',
    'error.generico': 'Something went wrong. Please try again.',
    'error.noEncontrado': "We couldn't find what you're looking for.",

    'inicio.titulo': 'Welcome to Leticia',
    'inicio.texto': 'Book experiences directly with Indigenous and local businesses, with no middlemen, and learn to greet people in their languages.',
    'inicio.chat': 'Talk to the assistant',
    'inicio.experiencias': 'See experiences',
    'inicio.lenguas': 'Languages and greetings',
    'inicio.misReservas': 'My bookings',

    'chat.titulo': 'Assistant',
    'chat.bienvenida': "Hi 👋 Tell me what you're interested in (birds, dolphins, crafts, culture…) and I'll show you experiences. I can also teach you greetings in Indigenous languages.",
    'chat.placeholder': 'Type your message…',
    'chat.enviar': 'Send',
    'chat.escribiendo': 'The assistant is typing…',
    'chat.privacidad': "Don't type personal data in the chat: to book, we'll show you a form.",
    'chat.nueva': 'New conversation',
    'chat.sugerencias': 'I want to see dolphins|How do you say thank you in Tikuna?|Plan a 2-day itinerary with culture',

    'exp.titulo': 'Experiences',
    'exp.todas': 'All',
    'exp.ninguna': 'No experiences with that interest.',
    'exp.ver': 'See details',
    'exp.porPersona': 'per person',
    'exp.duracion': 'Duration',
    'exp.salida': 'Departure',
    'exp.dias': 'Days',
    'exp.dificultad': 'Difficulty',
    'exp.encuentro': 'Meeting point',
    'exp.incluye': 'Includes',
    'exp.noIncluye': 'Not included',
    'exp.queLlevar': 'What to bring',
    'exp.cancelacion': 'Cancellation',
    'exp.privada': 'Private nature reserve',
    'exp.guias': "Guides' languages",
    'exp.contacto': 'Message on WhatsApp',
    'exp.saludos': "Greet in the community's language",
    'exp.noReservable': "This experience can't be booked online yet.",
    'exp.mapa': 'View on map',

    'disp.titulo': 'Book',
    'disp.fecha': 'Date',
    'disp.personas': 'People',
    'disp.consultar': 'Check availability',
    'disp.libres': '{n} spots available.',
    'disp.motivo.NO_RESERVABLE': "Price or capacity hasn't been set yet.",
    'disp.motivo.FECHA_PASADA': 'That date has already passed.',
    'disp.motivo.YA_SALIO': 'Today’s departure time has already passed.',
    'disp.motivo.DIA_NO_OPERA': "It doesn't run on that day of the week.",
    'disp.motivo.FECHA_BLOQUEADA': 'That date is not available.',
    'disp.motivo.SIN_CUPOS': 'Not enough spots left for that date.',

    'res.titulo': 'Your booking details',
    'res.resumen': '{fecha} · People: {n} · Total {total}',
    'res.nombre': 'Name',
    'res.email': 'Email',
    'res.telefono': 'Phone or WhatsApp (optional)',
    'res.enviar': 'Hold my spot',
    'res.enviando': 'Holding…',
    'res.privacidad': 'Your data is only used for this booking and is not sent to the AI assistant.',
    'res.apartado': 'Your spot is held for 15 minutes while you pay.',

    'resv.titulo': 'Your booking',
    'resv.estado.PENDIENTE_PAGO': 'Awaiting payment',
    'resv.estado.CONFIRMADA': 'Confirmed',
    'resv.estado.CANCELADA': 'Cancelled',
    'resv.estado.EXPIRADA': 'Expired',
    'resv.vence': 'Your spot is held for {tiempo}',
    'resv.vencida': 'The time to pay has run out.',
    'resv.pago': 'Online payment will be available very soon.',
    'resv.cancelar': 'Cancel booking',
    'resv.confirmarCancelar': 'Are you sure you want to cancel this booking?',
    'resv.fecha': 'Date',
    'resv.personas': 'People',
    'resv.total': 'Total',
    'resv.titular': 'Booked by',
    'resv.codigo': 'Code',
    'resv.lista': 'My bookings',
    'resv.ninguna': "You don't have bookings on this device yet.",

    'len.titulo': 'Languages of the Amazon',
    'len.intro': 'Content verified with speakers and sources from each community. It is not generated or translated by artificial intelligence.',
    'len.fichas': '{n} verified entries',
    'len.enValidacion': 'Being validated with the community.',
    'len.escuchar': 'Listen',
    'len.pronunciacion': 'Pronunciation',
    'len.fuente': 'Source',
    'len.compartido': 'Shared by',
    'len.permiso': 'Use',
    'len.verificada': 'Verified',
    'len.contexto': 'When to use it',
    'len.todas': 'See all languages',

    'iti.titulo': 'Suggested itinerary',
    'iti.dia': 'Day {n}',

    'dia.lunes': 'Monday', 'dia.martes': 'Tuesday', 'dia.miercoles': 'Wednesday',
    'dia.jueves': 'Thursday', 'dia.viernes': 'Friday', 'dia.sabado': 'Saturday',
    'dia.domingo': 'Sunday',
    'dificultad.baja': 'easy', 'dificultad.media': 'moderate', 'dificultad.alta': 'hard',

    'interes.aves': 'Birds', 'interes.delfines': 'Dolphins', 'interes.pesca': 'Fishing',
    'interes.gastronomia': 'Food', 'interes.artesanias': 'Crafts',
    'interes.plantas_medicinales': 'Medicinal plants', 'interes.caminata': 'Hiking',
    'interes.cultura': 'Culture', 'interes.fotografia': 'Photography',
    'interes.navegacion': 'Boating', 'interes.musica_danza': 'Music and dance',
    'interes.aventura': 'Adventure', 'interes.fauna': 'Wildlife',
  },

  pt: {
    'app.nombre': 'Ecoruta Conectada',
    'app.lema': 'Turismo direto com as comunidades da Amazônia',
    'idioma.etiqueta': 'Idioma',
    'nav.inicio': 'Início',
    'nav.chat': 'Assistente',
    'nav.experiencias': 'Experiências',
    'nav.lenguas': 'Línguas',
    'cargando': 'Carregando…',
    'volver': 'Voltar',
    'reintentar': 'Tentar de novo',
    'error.red': 'Sem conexão. Verifique o sinal e tente de novo.',
    'error.generico': 'Algo deu errado. Tente de novo.',
    'error.noEncontrado': 'Não encontramos o que você procura.',

    'inicio.titulo': 'Bem-vindo a Leticia',
    'inicio.texto': 'Reserve experiências diretamente com empreendimentos indígenas e locais, sem intermediários, e aprenda a cumprimentar nas suas línguas.',
    'inicio.chat': 'Falar com o assistente',
    'inicio.experiencias': 'Ver experiências',
    'inicio.lenguas': 'Línguas e saudações',
    'inicio.misReservas': 'Minhas reservas',

    'chat.titulo': 'Assistente',
    'chat.bienvenida': 'Olá 👋 Conte o que te interessa (aves, botos, artesanato, cultura…) e eu mostro experiências. Também posso ensinar saudações em línguas indígenas.',
    'chat.placeholder': 'Escreva sua mensagem…',
    'chat.enviar': 'Enviar',
    'chat.escribiendo': 'O assistente está escrevendo…',
    'chat.privacidad': 'Não escreva dados pessoais no chat: para reservar, mostramos um formulário.',
    'chat.nueva': 'Nova conversa',
    'chat.sugerencias': 'Quero ver botos|Como se diz obrigado em tikuna?|Monte um roteiro de 2 dias com cultura',

    'exp.titulo': 'Experiências',
    'exp.todas': 'Todas',
    'exp.ninguna': 'Não há experiências com esse interesse.',
    'exp.ver': 'Ver detalhes',
    'exp.porPersona': 'por pessoa',
    'exp.duracion': 'Duração',
    'exp.salida': 'Saída',
    'exp.dias': 'Dias',
    'exp.dificultad': 'Dificuldade',
    'exp.encuentro': 'Ponto de encontro',
    'exp.incluye': 'Inclui',
    'exp.noIncluye': 'Não inclui',
    'exp.queLlevar': 'O que levar',
    'exp.cancelacion': 'Cancelamento',
    'exp.privada': 'Reserva natural privada',
    'exp.guias': 'Idiomas dos guias',
    'exp.contacto': 'Escrever no WhatsApp',
    'exp.saludos': 'Cumprimente na língua da comunidade',
    'exp.noReservable': 'Esta experiência ainda não pode ser reservada online.',
    'exp.mapa': 'Ver no mapa',

    'disp.titulo': 'Reservar',
    'disp.fecha': 'Data',
    'disp.personas': 'Pessoas',
    'disp.consultar': 'Ver disponibilidade',
    'disp.libres': 'Há {n} vagas disponíveis.',
    'disp.motivo.NO_RESERVABLE': 'Ainda não tem preço ou capacidade definidos.',
    'disp.motivo.FECHA_PASADA': 'Essa data já passou.',
    'disp.motivo.YA_SALIO': 'O horário de saída de hoje já passou.',
    'disp.motivo.DIA_NO_OPERA': 'Não funciona nesse dia da semana.',
    'disp.motivo.FECHA_BLOQUEADA': 'Essa data não está disponível.',
    'disp.motivo.SIN_CUPOS': 'Não há vagas suficientes nessa data.',

    'res.titulo': 'Seus dados para a reserva',
    'res.resumen': '{fecha} · Pessoas: {n} · Total {total}',
    'res.nombre': 'Nome',
    'res.email': 'E-mail',
    'res.telefono': 'Telefone ou WhatsApp (opcional)',
    'res.enviar': 'Reservar vaga',
    'res.enviando': 'Reservando…',
    'res.privacidad': 'Seus dados são usados só nesta reserva e não são enviados ao assistente de IA.',
    'res.apartado': 'A vaga fica reservada por 15 minutos enquanto você paga.',

    'resv.titulo': 'Sua reserva',
    'resv.estado.PENDIENTE_PAGO': 'Aguardando pagamento',
    'resv.estado.CONFIRMADA': 'Confirmada',
    'resv.estado.CANCELADA': 'Cancelada',
    'resv.estado.EXPIRADA': 'Expirada',
    'resv.vence': 'Sua vaga está reservada por {tiempo}',
    'resv.vencida': 'O tempo para pagar terminou.',
    'resv.pago': 'O pagamento online estará disponível em breve.',
    'resv.cancelar': 'Cancelar reserva',
    'resv.confirmarCancelar': 'Tem certeza de que quer cancelar esta reserva?',
    'resv.fecha': 'Data',
    'resv.personas': 'Pessoas',
    'resv.total': 'Total',
    'resv.titular': 'Em nome de',
    'resv.codigo': 'Código',
    'resv.lista': 'Minhas reservas',
    'resv.ninguna': 'Você ainda não tem reservas neste dispositivo.',

    'len.titulo': 'Línguas da Amazônia',
    'len.intro': 'Conteúdo verificado com falantes e fontes de cada comunidade. Não é gerado nem traduzido por inteligência artificial.',
    'len.fichas': '{n} fichas verificadas',
    'len.enValidacion': 'Em processo de validação com a comunidade.',
    'len.escuchar': 'Ouvir',
    'len.pronunciacion': 'Pronúncia',
    'len.fuente': 'Fonte',
    'len.compartido': 'Compartilhado por',
    'len.permiso': 'Uso',
    'len.verificada': 'Verificada',
    'len.contexto': 'Quando se usa',
    'len.todas': 'Ver todas as línguas',

    'iti.titulo': 'Roteiro sugerido',
    'iti.dia': 'Dia {n}',

    'dia.lunes': 'segunda', 'dia.martes': 'terça', 'dia.miercoles': 'quarta',
    'dia.jueves': 'quinta', 'dia.viernes': 'sexta', 'dia.sabado': 'sábado',
    'dia.domingo': 'domingo',
    'dificultad.baja': 'fácil', 'dificultad.media': 'média', 'dificultad.alta': 'difícil',

    'interes.aves': 'Aves', 'interes.delfines': 'Botos', 'interes.pesca': 'Pesca',
    'interes.gastronomia': 'Gastronomia', 'interes.artesanias': 'Artesanato',
    'interes.plantas_medicinales': 'Plantas medicinais', 'interes.caminata': 'Caminhada',
    'interes.cultura': 'Cultura', 'interes.fotografia': 'Fotografia',
    'interes.navegacion': 'Navegação', 'interes.musica_danza': 'Música e dança',
    'interes.aventura': 'Aventura', 'interes.fauna': 'Fauna',
  },
};

// Todas las claves (para comprobar que los tres idiomas están completos).
export const CLAVES = TEXTOS;

let idiomaActual = 'es';

export function idioma() {
  return idiomaActual;
}

// Idioma guardado en el navegador o, si no hay, el del sistema.
export function iniciarIdioma() {
  let guardado = null;
  try {
    guardado = localStorage.getItem('ecoruta.idioma');
  } catch {
    // Almacenamiento bloqueado.
  }
  const sistema = (navigator.language ?? 'es').slice(0, 2);
  idiomaActual = [guardado, sistema].find((i) => IDIOMAS.includes(i)) ?? 'es';
  document.documentElement.lang = idiomaActual;
}

export function cambiarIdioma(nuevo) {
  if (!IDIOMAS.includes(nuevo)) return;
  idiomaActual = nuevo;
  document.documentElement.lang = nuevo;
  try {
    localStorage.setItem('ecoruta.idioma', nuevo);
  } catch {
    // Almacenamiento bloqueado: el idioma dura hasta cerrar la página.
  }
}

export function t(clave, variables = {}) {
  const texto = TEXTOS[idiomaActual][clave] ?? TEXTOS.es[clave] ?? clave;
  return texto.replace(/\{(\w+)\}/g, (_, nombre) =>
    String(variables[nombre] ?? `{${nombre}}`),
  );
}

// --- Formatos según el idioma ---

const LOCALES = { es: 'es-CO', en: 'en-US', pt: 'pt-BR' };

export function precio(cop) {
  if (cop === null || cop === undefined) return null;
  const locale = LOCALES[idiomaActual];
  const pesos = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(cop);
  const reales = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    currencyDisplay: 'narrowSymbol', // "R$ 82" en vez de "BRL 82"
    maximumFractionDigits: 0,
  }).format(cop / COP_POR_BRL);
  return { cop: `${pesos} COP`, brl: `≈ ${reales}` };
}

export function duracion(minutos) {
  if (!minutos) return null;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return [h ? `${h} h` : null, m ? `${m} min` : null].filter(Boolean).join(' ');
}

// "2026-10-05" -> "lunes, 5 de octubre" (según el idioma).
export function fechaLarga(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALES[idiomaActual], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(a, m - 1, d)));
}

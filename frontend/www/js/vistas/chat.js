import { pedir } from '../api.js';
import { el, vaciar } from '../dom.js';
import { crearDictado } from '../dictado.js';
import { idioma, t } from '../i18n.js';
import { tarjetaDelAgente } from '../tarjetas.js';

// La conversación vive en el navegador (el servidor no la guarda). Se
// conserva mientras la pestaña esté abierta.
const CLAVE = 'ecoruta.chat';
const MAX_HISTORIAL = 10;

function cargar() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE) ?? '[]');
  } catch {
    return [];
  }
}
function guardar(mensajes) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(mensajes));
  } catch {
    // Almacenamiento lleno o bloqueado: la conversación sigue en memoria.
  }
}

let mensajes = cargar();
let enviando = false;

export function vistaChat(contenedor) {
  const lista = el('ol', { class: 'chat-lista', 'aria-live': 'polite', 'aria-label': t('chat.titulo') });
  const entrada = el('input', {
    type: 'text',
    name: 'mensaje',
    class: 'chat-entrada',
    placeholder: t('chat.placeholder'),
    'aria-label': t('chat.placeholder'),
    maxlength: 1000,
    autocomplete: 'off',
    required: true,
  });
  const boton = el('button', { type: 'submit', class: 'boton' }, t('chat.enviar'));
  const dictado = crearDictado(entrada);
  const formulario = el('form', { class: 'chat-formulario' }, entrada, dictado?.boton, boton);

  const dibujar = () => {
    vaciar(
      lista,
      el('li', { class: 'mensaje asistente' }, el('p', {}, t('chat.bienvenida'))),
      mensajes.map((m) => burbuja(m)),
      enviando ? el('li', { class: 'mensaje asistente escribiendo' }, t('chat.escribiendo')) : null,
    );
    boton.disabled = enviando;
    lista.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  };

  const enviar = async (texto) => {
    texto = texto.trim();
    if (!texto || enviando) return;
    // Solo el texto de los mensajes anteriores (sin tarjetas) va al servidor.
    const historial = mensajes
      .slice(-MAX_HISTORIAL)
      .map((m) => ({ rol: m.rol, texto: m.texto }));
    mensajes.push({ rol: 'usuario', texto });
    enviando = true;
    entrada.value = '';
    dibujar();
    try {
      const respuesta = await pedir('/agente/mensaje', {
        metodo: 'POST',
        cuerpo: { mensaje: texto, idioma: idioma(), historial },
      });
      mensajes.push({ rol: 'asistente', texto: respuesta.texto, tarjetas: respuesta.tarjetas });
    } catch (error) {
      // 429 (muchos mensajes) y 503 (sin LLM) ya traen un mensaje amable.
      mensajes.push({ rol: 'asistente', texto: error.message, error: true });
    } finally {
      enviando = false;
      guardar(mensajes);
      dibujar();
      entrada.focus();
    }
  };

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    dictado?.detener();
    enviar(entrada.value);
  });

  const sugerencias = el(
    'div',
    { class: 'chat-sugerencias' },
    t('chat.sugerencias')
      .split('|')
      .map((s) => el('button', { type: 'button', class: 'chip', onClick: () => enviar(s) }, s)),
  );
  const nueva = el(
    'button',
    {
      type: 'button',
      class: 'enlace',
      onClick: () => {
        mensajes = [];
        guardar(mensajes);
        dibujar();
      },
    },
    t('chat.nueva'),
  );

  vaciar(
    contenedor,
    el(
      'section',
      { class: 'chat' },
      el('div', { class: 'titulo-fila' }, el('h1', {}, t('chat.titulo')), nueva),
      lista,
      sugerencias,
      formulario,
      dictado?.estado,
      el('p', { class: 'nota' }, t('chat.privacidad')),
      dictado?.aviso,
    ),
  );
  dibujar();
  // Al salir del chat, apagar el micrófono si quedó escuchando.
  return () => dictado?.detener();
}

function burbuja(mensaje) {
  return el(
    'li',
    { class: `mensaje ${mensaje.rol}${mensaje.error ? ' error' : ''}` },
    // textContent: el texto del LLM nunca se interpreta como HTML.
    el('p', {}, mensaje.texto),
    mensaje.tarjetas?.length
      ? el('div', { class: 'mensaje-tarjetas' }, mensaje.tarjetas.map(tarjetaDelAgente))
      : null,
  );
}

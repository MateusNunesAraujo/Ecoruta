// Dictado por voz para el chat (Web Speech API).
// El navegador convierte la voz en texto y lo pone en la caja del mensaje;
// el turista lo revisa y lo envía con "Enviar" (el dictado puede equivocarse,
// sobre todo con palabras en lenguas indígenas).
// Datos mínimos: en Chrome el audio se procesa en servidores de Google, por
// eso se avisa debajo del chat. No existe en Firefox ni dentro de la app
// Android (Capacitor, Bloque 8): ahí no se muestra el botón.

import { el } from './dom.js';
import { idioma, t } from './i18n.js';

const Reconocimiento = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const IDIOMA_VOZ = { es: 'es-CO', en: 'en-US', pt: 'pt-BR' };

// Devuelve { boton, estado, aviso, detener } o null si no hay dictado.
export function crearDictado(entrada) {
  if (!Reconocimiento || window.Capacitor?.isNativePlatform?.()) return null;

  let reconocimiento = null;
  const estado = el('p', { class: 'dictado-estado', 'aria-live': 'polite' });
  const aviso = el('p', { class: 'nota' }, t('chat.dictadoAviso'));
  const boton = el(
    'button',
    { type: 'button', class: 'boton-dictar', 'aria-pressed': 'false', 'aria-label': t('chat.dictar'), title: t('chat.dictar') },
    el('span', { 'aria-hidden': 'true' }, '🎤'),
  );

  boton.addEventListener('click', () => {
    // Si ya escucha, "stop" termina y entrega lo último que se dijo.
    if (reconocimiento) {
      reconocimiento.stop();
      return;
    }
    let error = null;
    // Lo dictado se agrega a lo que ya estaba escrito.
    const previo = entrada.value.trim() ? `${entrada.value.trim()} ` : '';
    reconocimiento = new Reconocimiento();
    reconocimiento.lang = IDIOMA_VOZ[idioma()] ?? 'es-CO';
    reconocimiento.interimResults = true;
    reconocimiento.onresult = (evento) => {
      const texto = Array.from(evento.results, (r) => r[0].transcript).join('');
      entrada.value = (previo + texto).slice(0, entrada.maxLength > 0 ? entrada.maxLength : undefined);
    };
    reconocimiento.onerror = (evento) => {
      if (evento.error === 'no-speech' || evento.error === 'aborted') return;
      error = ['not-allowed', 'service-not-allowed'].includes(evento.error)
        ? t('chat.dictadoPermiso')
        : t('chat.dictadoError');
    };
    reconocimiento.onend = () => {
      reconocimiento = null;
      boton.setAttribute('aria-pressed', 'false');
      estado.textContent = error ?? '';
      entrada.focus();
    };
    try {
      reconocimiento.start();
      boton.setAttribute('aria-pressed', 'true');
      estado.textContent = t('chat.escuchando');
    } catch {
      reconocimiento = null;
      estado.textContent = t('chat.dictadoError');
    }
  });

  // "abort" apaga el micrófono y descarta lo que falte por llegar (al enviar
  // el mensaje o al salir del chat).
  const detener = () => reconocimiento?.abort();
  return { boton, estado, aviso, detener };
}

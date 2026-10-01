// Punto de entrada del frontend: idioma, navegación y enrutador.
// Las rutas usan "#" (ej. #/experiencia/EXP-01) para que funcionen igual en
// la web y en la app Android, sin configurar nada en el servidor.

import { el, vaciar } from './dom.js';
import { cambiarIdioma, idioma, IDIOMAS, iniciarIdioma, t } from './i18n.js';
import { aplicarTema } from './tema.js';
import { vistaAjustes } from './vistas/ajustes.js';
import { vistaChat } from './vistas/chat.js';
import { vistaExperiencia } from './vistas/experiencia.js';
import { vistaExperiencias } from './vistas/experiencias.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaLenguas } from './vistas/lenguas.js';
import { vistaPagoSimulado } from './vistas/pago-simulado.js';
import { vistaMisReservas, vistaReserva } from './vistas/reserva.js';

const RUTAS = [
  [/^\/?$/, vistaInicio, 'inicio'],
  [/^\/chat$/, vistaChat, 'chat'],
  [/^\/experiencias$/, vistaExperiencias, 'experiencias'],
  [/^\/experiencia\/([A-Za-z0-9-]+)$/, vistaExperiencia, 'experiencias'],
  [/^\/lenguas(?:\/([A-Za-z-]+))?$/, vistaLenguas, 'lenguas'],
  [/^\/reserva\/([0-9a-f-]{36})$/, vistaReserva, 'inicio'],
  [/^\/reservas$/, vistaMisReservas, 'inicio'],
  [/^\/pago-simulado\/([A-Z0-9-]+)$/, vistaPagoSimulado, 'inicio'],
  [/^\/ajustes$/, vistaAjustes, 'ajustes'],
];

const principal = document.getElementById('principal');
let limpiar = null;

function navegar() {
  // "#/experiencias?interes=aves" -> ruta "/experiencias" + consulta
  const [ruta, textoConsulta = ''] = location.hash.slice(1).split('?');
  const consulta = new URLSearchParams(textoConsulta);
  const [patron, vista, seccion] =
    RUTAS.find(([p]) => p.test(ruta)) ?? RUTAS[0];
  const parametros = (patron.exec(ruta) ?? [])
    .slice(1)
    .filter((p) => p !== undefined);

  limpiar?.();
  limpiar = vista(principal, parametros, consulta) ?? null;
  marcarNavegacion(seccion);
  // Lleva el foco al contenido nuevo (útil con lector de pantalla).
  principal.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function marcarNavegacion(seccion) {
  for (const enlace of document.querySelectorAll('.navegacion a')) {
    if (enlace.dataset.seccion === seccion) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }
}

// Cabecera y barra de navegación (se redibujan al cambiar de idioma).
function dibujarMarco() {
  document.title = t('app.nombre');
  const selector = el(
    'select',
    { id: 'idioma', 'aria-label': t('idioma.etiqueta') },
    IDIOMAS.map((i) =>
      el('option', { value: i, selected: i === idioma() }, { es: 'Español', en: 'English', pt: 'Português' }[i]),
    ),
  );
  selector.addEventListener('change', () => {
    cambiarIdioma(selector.value);
    dibujarMarco();
    navegar();
  });

  vaciar(
    document.getElementById('cabecera'),
    el('a', { class: 'marca', href: '#/' }, el('span', { 'aria-hidden': 'true' }, '🌿 '), t('app.nombre')),
    selector,
  );

  const enlace = (href, seccion, icono, texto) =>
    el('a', { href, 'data-seccion': seccion }, el('span', { class: 'icono', 'aria-hidden': 'true' }, icono), el('span', {}, texto));
  vaciar(
    document.getElementById('navegacion'),
    enlace('#/', 'inicio', '🏠', t('nav.inicio')),
    enlace('#/chat', 'chat', '💬', t('nav.chat')),
    enlace('#/experiencias', 'experiencias', '🛶', t('nav.experiencias')),
    enlace('#/lenguas', 'lenguas', '🗣️', t('nav.lenguas')),
    enlace('#/ajustes', 'ajustes', '⚙️', t('nav.ajustes')),
  );
}

aplicarTema();
iniciarIdioma();
dibujarMarco();
// "Ir al contenido": mueve el foco sin cambiar la ruta (el "#" es del enrutador).
document.querySelector('.saltar').addEventListener('click', (evento) => {
  evento.preventDefault();
  principal.focus();
});
window.addEventListener('hashchange', navegar);
navegar();

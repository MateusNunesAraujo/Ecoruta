import { misReservas } from '../api.js';
import { el, vaciar } from '../dom.js';
import { t } from '../i18n.js';

// Pantalla de inicio: a ella llega el turista al escanear el QR.
export function vistaInicio(contenedor) {
  const hayReservas = misReservas().length > 0;
  vaciar(
    contenedor,
    el(
      'section',
      { class: 'portada' },
      el('h1', {}, t('inicio.titulo')),
      el('p', { class: 'portada-texto' }, t('inicio.texto')),
      el(
        'nav',
        { class: 'accesos', 'aria-label': t('nav.inicio') },
        el('a', { class: 'boton boton-grande', href: '#/chat' }, el('span', { class: 'icono-avatar', 'aria-hidden': 'true' }), t('inicio.chat')),
        el('a', { class: 'boton boton-grande boton-secundario', href: '#/experiencias' }, '🛶 ', t('inicio.experiencias')),
        el('a', { class: 'boton boton-grande boton-secundario', href: '#/lenguas' }, '🗣️ ', t('inicio.lenguas')),
        hayReservas
          ? el('a', { class: 'boton boton-grande boton-secundario', href: '#/reservas' }, '🎟️ ', t('inicio.misReservas'))
          : null,
      ),
    ),
  );
}

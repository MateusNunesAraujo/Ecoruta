import { pedir } from '../api.js';
import { el, vaciar } from '../dom.js';
import { idioma, t } from '../i18n.js';
import { aviso, tarjetaFicha } from '../tarjetas.js';

// #/lenguas -> las 5 lenguas. #/lenguas/L-TIK -> fichas de una lengua.
export function vistaLenguas(contenedor, [lenguaId]) {
  const cargar = async () => {
    vaciar(contenedor, aviso(t('cargando')));
    try {
      // Mismo orden que CLAUDE.md: Tikuna, Murui, Yagua, Miraña, Bora.
      const orden = ['L-TIK', 'L-MUR', 'L-YAG', 'L-MIR', 'L-BOR'];
      const lenguas = (await pedir('/cultural/lenguas')).sort(
        (a, b) => orden.indexOf(a.id) - orden.indexOf(b.id),
      );
      const elegida = lenguas.find((l) => l.id === lenguaId);
      if (elegida) {
        const fichas = await pedir(`/cultural?lengua=${elegida.id}`);
        dibujarLengua(contenedor, elegida, fichas);
      } else {
        dibujarLista(contenedor, lenguas);
      }
    } catch (error) {
      vaciar(contenedor, aviso(error.message, { reintentar: cargar }));
    }
  };
  cargar();
}

function descripcion(lengua) {
  const sufijo = { es: 'Es', en: 'En', pt: 'Pt' }[idioma()];
  return lengua[`descripcion${sufijo}`] ?? lengua.descripcionEs;
}

function dibujarLista(contenedor, lenguas) {
  vaciar(
    contenedor,
    el(
      'section',
      {},
      el('h1', {}, t('len.titulo')),
      el('p', { class: 'nota' }, t('len.intro')),
      el(
        'div',
        { class: 'rejilla' },
        lenguas.map((lengua) =>
          el(
            'article',
            { class: 'tarjeta tarjeta-lengua' },
            el(
              'h2',
              {},
              lengua.fichasVerificadas > 0
                ? el('a', { href: `#/lenguas/${lengua.id}` }, lengua.nombreComun)
                : lengua.nombreComun,
            ),
            lengua.autodenominacion ? el('p', { class: 'ficha-texto pequeno' }, lengua.autodenominacion) : null,
            el('p', {}, descripcion(lengua)),
            el(
              'p',
              { class: 'tarjeta-meta' },
              lengua.fichasVerificadas > 0
                ? t('len.fichas', { n: lengua.fichasVerificadas })
                : t('len.enValidacion'),
            ),
          ),
        ),
      ),
    ),
  );
}

function dibujarLengua(contenedor, lengua, fichas) {
  vaciar(
    contenedor,
    el(
      'section',
      {},
      el('a', { class: 'enlace', href: '#/lenguas' }, '← ', t('len.todas')),
      el(
        'h1',
        {},
        lengua.autodenominacion
          ? [el('span', { class: 'ficha-texto pequeno' }, lengua.autodenominacion), ' / ']
          : null,
        lengua.nombreComun,
      ),
      el('p', {}, descripcion(lengua)),
      lengua.fuente ? el('p', { class: 'nota' }, `${t('len.fuente')}: ${lengua.fuente}`) : null,
      el('div', { class: 'rejilla' }, fichas.map(tarjetaFicha)),
    ),
  );
}

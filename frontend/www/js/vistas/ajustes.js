import { el, vaciar } from '../dom.js';
import { t } from '../i18n.js';
import { cambiarTema, tema, TEMAS } from '../tema.js';

// #/ajustes -> preferencias guardadas en este navegador (por ahora, el tema).
export function vistaAjustes(contenedor) {
  const actual = tema();
  const opcion = (valor) =>
    el(
      'label',
      { class: 'opcion' },
      el('input', {
        type: 'radio',
        name: 'tema',
        value: valor,
        checked: valor === actual,
        onChange: () => cambiarTema(valor),
      }),
      el('span', {}, t(`ajustes.tema.${valor}`)),
    );
  vaciar(
    contenedor,
    el(
      'section',
      { class: 'ajustes' },
      el('h1', {}, t('ajustes.titulo')),
      el(
        'fieldset',
        { class: 'grupo-opciones' },
        el('legend', {}, t('ajustes.apariencia')),
        el('div', { class: 'opciones' }, TEMAS.map(opcion)),
      ),
      el('p', { class: 'nota' }, t('ajustes.tema.ayuda')),
    ),
  );
}

import { pedir } from '../api.js';
import { el, vaciar } from '../dom.js';
import { t } from '../i18n.js';
import { aviso, tarjetaExperiencia } from '../tarjetas.js';

// Mismas etiquetas que backend/src/emprendimientos/intereses.ts
const INTERESES = [
  'aves', 'delfines', 'pesca', 'gastronomia', 'artesanias',
  'plantas_medicinales', 'caminata', 'cultura', 'fotografia', 'navegacion',
  'musica_danza', 'aventura', 'fauna',
];

// Catálogo con filtro por interés: #/experiencias o #/experiencias?interes=aves
export function vistaExperiencias(contenedor, _params, consulta) {
  const interes = INTERESES.includes(consulta.get('interes')) ? consulta.get('interes') : null;
  const resultados = el('div', { class: 'rejilla' }, aviso(t('cargando')));

  const chip = (valor, texto) =>
    el(
      'a',
      {
        class: 'chip',
        href: valor ? `#/experiencias?interes=${valor}` : '#/experiencias',
        'aria-current': valor === interes ? 'true' : null,
      },
      texto,
    );

  vaciar(
    contenedor,
    el(
      'section',
      {},
      el('h1', {}, t('exp.titulo')),
      el(
        'nav',
        { class: 'filtros', 'aria-label': t('exp.titulo') },
        chip(null, t('exp.todas')),
        INTERESES.map((i) => chip(i, t(`interes.${i}`))),
      ),
      resultados,
    ),
  );

  const cargar = async () => {
    vaciar(resultados, aviso(t('cargando')));
    try {
      const experiencias = await pedir(interes ? `/experiencias?interes=${interes}` : '/experiencias');
      vaciar(
        resultados,
        experiencias.length ? experiencias.map(tarjetaExperiencia) : aviso(t('exp.ninguna')),
      );
    } catch (error) {
      vaciar(resultados, aviso(error.message, { reintentar: cargar }));
    }
  };
  cargar();
}

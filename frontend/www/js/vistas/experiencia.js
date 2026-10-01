import { esSinConexion, pedir } from '../api.js';
import { el, vaciar } from '../dom.js';
import { rutaAnterior } from '../historial.js';
import { duracion, fechaLarga, t } from '../i18n.js';
import {
  aviso,
  bloquePrecio,
  etiquetasIntereses,
  formularioReserva,
  normalizarExperiencia,
  tarjetaFicha,
  textoDisponibilidad,
} from '../tarjetas.js';

// Fecha de hoy según el teléfono, en formato AAAA-MM-DD (para <input type=date>).
function hoy() {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

// Detalle: #/experiencia/EXP-01 (o con ?fecha=2026-10-05 desde el chat).
export function vistaExperiencia(contenedor, [id], consulta) {
  const cargar = async () => {
    vaciar(contenedor, aviso(t('cargando')));
    let experiencia;
    try {
      experiencia = await pedir(`/experiencias/${encodeURIComponent(id)}`);
    } catch (error) {
      vaciar(
        contenedor,
        aviso(error.status === 404 ? t('error.noEncontrado') : error.message, {
          reintentar: error.status === 404 ? null : cargar,
        }),
      );
      return;
    }
    dibujar(contenedor, experiencia, consulta.get('fecha'));
  };
  cargar();
}

function dibujar(contenedor, experiencia, fechaInicial) {
  const e = normalizarExperiencia(experiencia);
  const emprendimiento = experiencia.emprendimiento;
  const comunidad = emprendimiento?.comunidad;

  const dato = (etiqueta, valor) =>
    valor ? [el('dt', {}, etiqueta), el('dd', {}, valor)] : null;

  const mapa =
    e.latitud !== null && e.longitud !== null
      ? el(
          'a',
          {
            href: `https://www.openstreetmap.org/?mlat=${e.latitud}&mlon=${e.longitud}#map=14/${e.latitud}/${e.longitud}`,
            target: '_blank',
            rel: 'noopener',
          },
          t('exp.mapa'),
        )
      : null;

  const whatsapp = emprendimiento?.whatsapp?.replace(/[^\d]/g, '');

  vaciar(
    contenedor,
    el(
      'article',
      { class: 'detalle' },
      botonVolver(),
      e.foto
        ? el('img', { class: 'detalle-foto', src: e.foto, alt: '' })
        : el('div', { class: 'detalle-foto sin-foto', 'aria-hidden': 'true' }),
      el('h1', {}, e.nombre),
      el(
        'p',
        { class: 'tarjeta-sub' },
        emprendimiento?.nombre,
        ' · ',
        comunidad ? comunidad.nombre : t('exp.privada'),
      ),
      bloquePrecio(e.precioCop, t('exp.porPersona')),
      etiquetasIntereses(e.intereses),
      e.descripcion ? el('p', {}, e.descripcion) : null,
      el(
        'dl',
        { class: 'datos' },
        dato(t('exp.duracion'), duracion(e.duracionMinutos)),
        dato(t('exp.salida'), e.horaSalida),
        dato(t('exp.dias'), e.diasOperacion.map((d) => t(`dia.${d}`)).join(', ')),
        dato(t('exp.dificultad'), e.dificultad ? t(`dificultad.${e.dificultad}`) : null),
        dato(t('exp.encuentro'), e.puntoEncuentro),
        dato(t('exp.guias'), emprendimiento?.idiomasGuias?.join(', ')),
        // Estos textos solo existen en español en el Excel.
        dato(t('exp.incluye'), experiencia.incluye),
        dato(t('exp.noIncluye'), experiencia.noIncluye),
        dato(t('exp.queLlevar'), experiencia.queLlevar),
        dato(t('exp.cancelacion'), experiencia.cancelacion),
      ),
      mapa ? el('p', {}, mapa) : null,
      whatsapp
        ? el('a', { class: 'boton boton-secundario', href: `https://wa.me/${whatsapp}`, target: '_blank', rel: 'noopener' }, t('exp.contacto'))
        : null,
      seccionReserva(experiencia, fechaInicial),
      experiencia.fichas?.length
        ? el(
            'section',
            { class: 'seccion' },
            el('h2', {}, t('exp.saludos')),
            el('div', { class: 'rejilla' }, experiencia.fichas.map(tarjetaFicha)),
          )
        : null,
    ),
  );
}

// "Volver" regresa a la pantalla anterior de la app (chat, itinerario,
// lista…). Si se llegó directo (enlace o QR) o desde otra experiencia, va a
// la lista de experiencias.
function botonVolver() {
  const anterior = rutaAnterior();
  const destino = anterior && !anterior.startsWith('#/experiencia/') ? anterior : '#/experiencias';
  const texto = destino.startsWith('#/chat') ? t('volver.chat') : t('volver');
  return el('a', { class: 'enlace', href: destino }, '← ', texto);
}

// Paso 1: fecha y personas -> disponibilidad. Paso 2: formulario de datos.
function seccionReserva(experiencia, fechaInicial) {
  if (experiencia.capacidad === null || experiencia.precioCop === null) {
    return el('section', { class: 'seccion' }, aviso(t('exp.noReservable')));
  }
  const resultado = el('div', { role: 'status' });
  const fecha = el('input', { id: 'fecha', type: 'date', name: 'fecha', required: true, min: hoy(), value: fechaInicial ?? '' });
  const personas = el('input', { id: 'personas', type: 'number', name: 'personas', required: true, min: 1, max: experiencia.capacidad, value: 1 });
  const boton = el('button', { type: 'submit', class: 'boton' }, t('disp.consultar'));

  const formulario = el(
    'form',
    { class: 'tarjeta formulario-disponibilidad' },
    el('div', { class: 'campos-fila' },
      el('div', { class: 'campo' }, el('label', { for: 'fecha' }, t('disp.fecha')), fecha),
      el('div', { class: 'campo' }, el('label', { for: 'personas' }, t('disp.personas')), personas),
    ),
    boton,
    resultado,
  );

  const consultar = async () => {
    boton.disabled = true;
    vaciar(resultado, t('cargando'));
    try {
      const d = await pedir(
        `/reservas/disponibilidad?experiencia=${experiencia.id}&fecha=${fecha.value}`,
      );
      const n = Number(personas.value);
      if (!d.disponible || n > d.cuposLibres) {
        vaciar(resultado, el('p', { class: 'mensaje-error' }, `${fechaLarga(fecha.value)}: `,
          d.disponible ? t('disp.motivo.SIN_CUPOS') + ' ' + t('disp.libres', { n: d.cuposLibres }) : textoDisponibilidad(d)));
        return;
      }
      vaciar(
        resultado,
        el('p', { class: 'mensaje-ok' }, textoDisponibilidad(d), ' ', t('res.apartado')),
        formularioReserva({
          experienciaId: experiencia.id,
          fecha: fecha.value,
          personas: n,
          totalCop: n * d.precioCop,
        }),
      );
    } catch (error) {
      if (!esSinConexion(error)) {
        vaciar(resultado, el('p', { class: 'mensaje-error' }, error.message));
        return;
      }
      // Sin señal no se pueden ver los cupos: se ofrece dejar una
      // pre-reserva que se envía al volver la conexión (Bloque 7).
      const n = Number(personas.value);
      vaciar(
        resultado,
        el('p', { class: 'nota' }, t('cola.sinVerificar')),
        formularioReserva({
          experienciaId: experiencia.id,
          fecha: fecha.value,
          personas: n,
          totalCop: n * experiencia.precioCop,
        }),
      );
    } finally {
      boton.disabled = false;
    }
  };

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    consultar();
  });
  // Si viene del chat con una fecha, se consulta de una vez.
  if (fechaInicial) queueMicrotask(consultar);

  return el('section', { class: 'seccion' }, el('h2', {}, t('disp.titulo')), formulario);
}

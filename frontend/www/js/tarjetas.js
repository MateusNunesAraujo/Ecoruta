// Componentes que se repiten en varias pantallas: tarjetas de experiencia,
// fichas culturales, disponibilidad, itinerario y formulario de reserva.
// El chat usa las mismas funciones para dibujar las "tarjetas" del agente.

import {
  configPagos,
  ErrorApi,
  irAPagar,
  misReservas,
  pedir,
  recordarReserva,
} from './api.js';
import { el } from './dom.js';
import { duracion, fechaLarga, idioma, precio, t } from './i18n.js';

// Código ISO 639-3 de cada lengua: el atributo lang ayuda a los lectores de
// pantalla a no leer el texto indígena como si fuera español.
const ISO_LENGUA = {
  'L-TIK': 'tca',
  'L-MUR': 'huu',
  'L-YAG': 'yad',
  'L-MIR': 'boa',
  'L-BOR': 'boa',
};

// Acepta la experiencia tal como la da la API (nombreEs, emprendimiento
// como objeto…) o el resumen que envía el agente, y la deja igual.
export function normalizarExperiencia(e) {
  if ('nombre' in e) return e; // ya es un resumen del agente
  const sufijo = { es: 'Es', en: 'En', pt: 'Pt' }[idioma()];
  return {
    id: e.id,
    nombre: e[`nombre${sufijo}`] ?? e.nombreEs,
    descripcion: e[`descripcion${sufijo}`] ?? e.descripcionEs,
    emprendimiento: e.emprendimiento?.nombre ?? '',
    comunidad: e.emprendimiento?.comunidad?.nombre ?? null,
    precioCop: e.precioCop,
    duracionMinutos: e.duracionMinutos,
    horaSalida: e.horaSalida,
    diasOperacion: e.diasOperacion ?? [],
    intereses: e.intereses ?? [],
    dificultad: e.dificultad,
    puntoEncuentro: e.puntoEncuentro,
    latitud: e.latitud,
    longitud: e.longitud,
  };
}

export function bloquePrecio(cop, extra) {
  const p = precio(cop);
  if (!p) return null;
  return el(
    'p',
    { class: 'precio' },
    el('strong', {}, p.cop),
    ' ',
    el('span', { class: 'precio-brl' }, p.brl),
    extra ? el('span', { class: 'precio-extra' }, ` ${extra}`) : null,
  );
}

export function etiquetasIntereses(intereses) {
  return el(
    'ul',
    { class: 'etiquetas', 'aria-label': t('nav.experiencias') },
    intereses.map((i) => el('li', {}, t(`interes.${i}`))),
  );
}

export function tarjetaExperiencia(experiencia) {
  const e = normalizarExperiencia(experiencia);
  const detalles = [
    duracion(e.duracionMinutos),
    e.horaSalida ? `${t('exp.salida')} ${e.horaSalida}` : null,
  ].filter(Boolean);
  return el(
    'article',
    { class: 'tarjeta tarjeta-experiencia' },
    el('h3', {}, el('a', { href: `#/experiencia/${e.id}` }, e.nombre)),
    el(
      'p',
      { class: 'tarjeta-sub' },
      e.emprendimiento,
      e.comunidad ? ` · ${e.comunidad}` : null,
    ),
    detalles.length ? el('p', { class: 'tarjeta-meta' }, detalles.join(' · ')) : null,
    bloquePrecio(e.precioCop, t('exp.porPersona')),
    etiquetasIntereses(e.intereses),
    el('a', { class: 'boton boton-secundario', href: `#/experiencia/${e.id}` }, t('exp.ver')),
  );
}

// --- Fichas culturales ---

let audioActual = null;

function botonAudio(archivo) {
  // Ruta relativa: en la app Android los audios van dentro del APK.
  const src = /^https?:\/\//.test(archivo)
    ? archivo
    : `audio/${encodeURIComponent(archivo)}`;
  const boton = el(
    'button',
    { type: 'button', class: 'boton boton-audio', 'aria-pressed': 'false' },
    '▶ ',
    t('len.escuchar'),
  );
  boton.addEventListener('click', () => {
    audioActual?.pause();
    audioActual = new Audio(src);
    boton.setAttribute('aria-pressed', 'true');
    audioActual.addEventListener('ended', () =>
      boton.setAttribute('aria-pressed', 'false'),
    );
    audioActual.play().catch(() => boton.setAttribute('aria-pressed', 'false'));
  });
  return boton;
}

export function tarjetaFicha(ficha) {
  const sufijo = { es: 'Es', en: 'En', pt: 'Pt' }[idioma()];
  const significado = ficha[`significado${sufijo}`] ?? ficha.significadoEs;
  const atribucion = [
    ficha.comunidadOHablante ? `${t('len.compartido')}: ${ficha.comunidadOHablante}` : null,
    ficha.fuente ? `${t('len.fuente')}: ${ficha.fuente}` : null,
    ficha.permisoUso ? `${t('len.permiso')}: ${ficha.permisoUso}` : null,
  ].filter(Boolean);

  return el(
    'article',
    { class: 'tarjeta tarjeta-ficha' },
    el(
      'p',
      { class: 'ficha-cabecera' },
      el('span', {}, ficha.lengua?.nombreComun ?? ''),
      el('span', { class: 'insignia' }, '✓ ', t('len.verificada')),
    ),
    // Texto en lengua indígena: tal cual viene de la fuente verificada.
    el('p', { class: 'ficha-texto', lang: ISO_LENGUA[ficha.lenguaId] ?? null }, ficha.textoOriginal),
    significado ? el('p', { class: 'ficha-significado' }, significado) : null,
    ficha.pronunciacion
      ? el('p', { class: 'ficha-pronunciacion' }, `${t('len.pronunciacion')}: `, el('i', {}, ficha.pronunciacion))
      : null,
    ficha.audio ? botonAudio(ficha.audio) : null,
    // El contexto solo está en español en el Excel.
    ficha.contexto && idioma() === 'es'
      ? el('p', { class: 'ficha-contexto' }, `${t('len.contexto')}: ${ficha.contexto}`)
      : null,
    atribucion.length ? el('p', { class: 'ficha-atribucion' }, atribucion.join(' · ')) : null,
  );
}

// --- Disponibilidad ---

export function textoDisponibilidad(d) {
  return d.disponible
    ? t('disp.libres', { n: d.cuposLibres })
    : t(`disp.motivo.${d.motivo}`);
}

export function tarjetaDisponibilidad(d) {
  return el(
    'article',
    { class: `tarjeta tarjeta-disponibilidad ${d.disponible ? 'ok' : 'no'}` },
    el('p', {}, el('strong', {}, fechaLarga(d.fecha))),
    el('p', {}, textoDisponibilidad(d)),
    el(
      'a',
      { class: 'boton boton-secundario', href: `#/experiencia/${d.experienciaId}?fecha=${d.fecha}` },
      t('exp.ver'),
    ),
  );
}

export function tarjetaItinerario(dias) {
  return el(
    'article',
    { class: 'tarjeta tarjeta-itinerario' },
    el('h3', {}, t('iti.titulo')),
    el(
      'ol',
      {},
      dias.map((d) =>
        el(
          'li',
          {},
          el('strong', {}, t('iti.dia', { n: d.dia })),
          el(
            'ul',
            {},
            d.experiencias.map((experiencia) => {
              const e = normalizarExperiencia(experiencia);
              return el(
                'li',
                {},
                e.horaSalida ? `${e.horaSalida} · ` : null,
                el('a', { href: `#/experiencia/${e.id}` }, e.nombre),
              );
            }),
          ),
        ),
      ),
    ),
  );
}

// --- Formulario de reserva ---
// Los datos del turista van directo a POST /api/reservas, nunca al agente
// (regla 3 de CLAUDE.md).
export function formularioReserva({ experienciaId, fecha, personas, totalCop }) {
  const estado = el('p', { class: 'form-estado', role: 'status' });
  const boton = el('button', { type: 'submit', class: 'boton' }, t('res.enviar'));
  const total = precio(totalCop);

  const formulario = el(
    'form',
    { class: 'tarjeta formulario-reserva', novalidate: false },
    el('h3', {}, t('res.titulo')),
    el(
      'p',
      { class: 'tarjeta-meta' },
      t('res.resumen', { fecha: fechaLarga(fecha), n: personas, total: total ? `${total.cop} (${total.brl})` : '' }),
    ),
    campo('nombre', t('res.nombre'), { type: 'text', required: true, minlength: 2, maxlength: 120, autocomplete: 'name' }),
    campo('email', t('res.email'), { type: 'email', required: true, maxlength: 200, autocomplete: 'email' }),
    campo('telefono', t('res.telefono'), { type: 'tel', maxlength: 30, autocomplete: 'tel' }),
    el('p', { class: 'nota' }, t('res.privacidad')),
    boton,
    estado,
  );

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    boton.disabled = true;
    boton.textContent = t('res.enviando');
    estado.textContent = '';
    try {
      const reserva = await pedir('/reservas', {
        metodo: 'POST',
        cuerpo: {
          experienciaId,
          fecha,
          personas,
          nombre: String(datos.get('nombre')).trim(),
          email: String(datos.get('email')).trim(),
          ...(String(datos.get('telefono')).trim() && {
            telefono: String(datos.get('telefono')).trim(),
          }),
          idioma: idioma(),
        },
      });
      recordarReserva(reserva.id);
      location.hash = `#/reserva/${reserva.id}`;
    } catch (error) {
      const motivo = error instanceof ErrorApi ? error.datos?.motivo : null;
      estado.textContent = motivo ? t(`disp.motivo.${motivo}`) : error.message;
      boton.disabled = false;
      boton.textContent = t('res.enviar');
    }
  });
  return formulario;
}

let contadorCampos = 0;
function campo(nombre, etiqueta, atributos) {
  const id = `campo-${nombre}-${++contadorCampos}`;
  return el(
    'div',
    { class: 'campo' },
    el('label', { for: id }, etiqueta),
    el('input', { id, name: nombre, ...atributos }),
  );
}

// Botón "Pagar con Wompi" (con aviso de datos de prueba en sandbox).
export function botonPagar(reservaId, config) {
  const estado = el('p', { class: 'form-estado', role: 'status' });
  const boton = el('button', { type: 'button', class: 'boton boton-grande' }, t('pago.boton'));
  boton.addEventListener('click', async () => {
    boton.disabled = true;
    boton.textContent = t('pago.redirigiendo');
    estado.textContent = '';
    try {
      await irAPagar(reservaId);
    } catch (error) {
      estado.textContent = error.message;
      boton.disabled = false;
      boton.textContent = t('pago.boton');
    }
  });
  return el(
    'div',
    { class: 'pago' },
    boton,
    config.sandbox ? el('p', { class: 'nota' }, t('pago.sandbox')) : null,
    estado,
  );
}

// Tarjeta "pago" del agente: reservas pendientes de este dispositivo con su
// botón de pagar. El agente nunca recibe los ids de las reservas.
function tarjetaPago() {
  const contenido = el('div', {}, t('cargando'));
  (async () => {
    const config = await configPagos();
    const reservas = await Promise.all(
      misReservas().map((id) => pedir(`/reservas/${id}`).catch(() => null)),
    );
    const pendientes = reservas.filter(
      (r) => r?.estado === 'PENDIENTE_PAGO' && new Date(r.expiraEn) > new Date(),
    );
    if (!config.habilitado || pendientes.length === 0) {
      contenido.replaceChildren(t(config.habilitado ? 'pago.ninguna' : 'resv.pago'));
      return;
    }
    contenido.replaceChildren(
      ...pendientes.map((r) => {
        const e = normalizarExperiencia(r.experiencia);
        return el(
          'div',
          { class: 'pago-pendiente' },
          el('p', {}, el('a', { href: `#/reserva/${r.id}` }, e.nombre), ` · ${fechaLarga(r.fecha)}`),
          bloquePrecio(r.totalCop),
          botonPagar(r.id, config),
        );
      }),
    );
  })();
  return el('article', { class: 'tarjeta' }, el('h3', {}, t('pago.titulo')), contenido);
}

// Tarjeta según el tipo que envía el agente.
export function tarjetaDelAgente(tarjeta) {
  switch (tarjeta.tipo) {
    case 'experiencia':
      return tarjetaExperiencia(tarjeta.experiencia);
    case 'ficha_cultural':
      return tarjetaFicha(tarjeta.ficha);
    case 'disponibilidad':
      return tarjetaDisponibilidad(tarjeta.disponibilidad);
    case 'itinerario':
      return tarjetaItinerario(tarjeta.dias);
    case 'pago':
      return tarjetaPago();
    case 'formulario_reserva':
      return formularioReserva({
        experienciaId: tarjeta.experiencia.id,
        fecha: tarjeta.fecha,
        personas: tarjeta.personas,
        totalCop: tarjeta.totalCop,
      });
    default:
      return null;
  }
}

// Mensaje de carga o de error dentro de una pantalla.
export function aviso(texto, { reintentar } = {}) {
  return el(
    'div',
    { class: 'aviso', role: 'status' },
    el('p', {}, texto),
    reintentar
      ? el('button', { type: 'button', class: 'boton boton-secundario', onClick: reintentar }, t('reintentar'))
      : null,
  );
}

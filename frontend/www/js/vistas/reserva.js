import { configPagos, misReservas, pedir } from '../api.js';
import { el, vaciar } from '../dom.js';
import { fechaLarga, t } from '../i18n.js';
import {
  aviso,
  bloquePrecio,
  botonPagar,
  normalizarExperiencia,
} from '../tarjetas.js';

const RESULTADOS_OK = ['APPROVED'];

// #/reserva/<uuid>: estado de la reserva con cuenta regresiva.
// Al volver de Wompi llega como #/reserva/<uuid>?pago=APPROVED (o DECLINED…).
export function vistaReserva(contenedor, [id], consulta) {
  let temporizador = null;
  const resultadoPago = consulta.get('pago');
  // Se quita ?pago= de la URL para que el aviso no reaparezca al recargar
  // (replaceState no dispara el enrutador).
  if (resultadoPago) history.replaceState(null, '', `#/reserva/${id}`);

  const cargar = async () => {
    clearInterval(temporizador);
    vaciar(contenedor, aviso(t('cargando')));
    try {
      const [reserva, config] = await Promise.all([
        pedir(`/reservas/${id}`),
        configPagos(),
      ]);
      temporizador = dibujar(contenedor, reserva, cargar, config, resultadoPago);
    } catch (error) {
      vaciar(
        contenedor,
        aviso(error.status === 404 || error.status === 400 ? t('error.noEncontrado') : error.message, {
          reintentar: error.status >= 500 || error.status === 0 ? cargar : null,
        }),
      );
    }
  };
  cargar();
  // Al salir de la pantalla se detiene la cuenta regresiva.
  return () => clearInterval(temporizador);
}

function dibujar(contenedor, reserva, recargar, config, resultadoPago) {
  const e = normalizarExperiencia(reserva.experiencia);
  const pendiente = reserva.estado === 'PENDIENTE_PAGO';
  const cuenta = el('p', { class: 'cuenta-regresiva', role: 'timer', 'aria-live': 'off' });
  const estado = el('p', { class: 'form-estado', role: 'status' });

  let temporizador = null;
  if (pendiente) {
    let primeraVez = true;
    const actualizar = () => {
      const restante = new Date(reserva.expiraEn).getTime() - Date.now();
      if (restante <= 0) {
        clearInterval(temporizador);
        // Solo se recarga si el tiempo se acabó con la pantalla abierta (el
        // backend la marca EXPIRADA al consultarla). Si ya había vencido al
        // abrirla (reloj del teléfono adelantado), no se recarga en bucle.
        if (primeraVez) cuenta.textContent = t('resv.vencida');
        else recargar();
        return;
      }
      primeraVez = false;
      const m = Math.floor(restante / 60000);
      const s = String(Math.floor((restante % 60000) / 1000)).padStart(2, '0');
      cuenta.textContent = t('resv.vence', { tiempo: `${m}:${s}` });
    };
    actualizar();
    temporizador = setInterval(actualizar, 1000);
  }

  const cancelar = async () => {
    if (!confirm(t('resv.confirmarCancelar'))) return;
    try {
      await pedir(`/reservas/${reserva.id}/cancelar`, { metodo: 'POST' });
      recargar();
    } catch (error) {
      estado.textContent = error.message;
    }
  };

  vaciar(
    contenedor,
    el(
      'article',
      { class: 'detalle' },
      el('h1', {}, t('resv.titulo')),
      resultadoPago
        ? el(
            'p',
            {
              class: RESULTADOS_OK.includes(resultadoPago) ? 'aviso-pago ok' : 'aviso-pago no',
              role: 'status',
            },
            t(`pago.resultado.${resultadoPago}`),
          )
        : null,
      el('p', { class: `estado-reserva estado-${reserva.estado.toLowerCase()}` }, t(`resv.estado.${reserva.estado}`)),
      el('h2', {}, el('a', { href: `#/experiencia/${e.id}` }, e.nombre)),
      el(
        'dl',
        { class: 'datos' },
        el('dt', {}, t('resv.fecha')), el('dd', {}, fechaLarga(reserva.fecha), e.horaSalida ? ` · ${e.horaSalida}` : ''),
        el('dt', {}, t('resv.personas')), el('dd', {}, String(reserva.personas)),
        el('dt', {}, t('resv.titular')), el('dd', {}, reserva.nombreTurista),
        el('dt', {}, t('resv.codigo')), el('dd', { class: 'codigo' }, reserva.id.slice(0, 8).toUpperCase()),
      ),
      el('div', {}, el('strong', {}, t('resv.total')), bloquePrecio(reserva.totalCop)),
      pendiente ? cuenta : null,
      // Botón de Wompi si los pagos están configurados; si no, un aviso.
      pendiente
        ? config.habilitado
          ? botonPagar(reserva.id, config)
          : el('p', { class: 'nota' }, t('resv.pago'))
        : null,
      reserva.estado === 'CONFIRMADA'
        ? el('p', { class: 'mensaje-ok' }, t('resv.confirmadaTexto'))
        : null,
      reserva.estado === 'EXPIRADA' ? el('p', { class: 'nota' }, t('resv.vencida')) : null,
      pendiente
        ? el('button', { type: 'button', class: 'boton boton-peligro', onClick: cancelar }, t('resv.cancelar'))
        : null,
      estado,
    ),
  );
  return temporizador;
}

// #/reservas: reservas hechas desde este dispositivo.
export function vistaMisReservas(contenedor) {
  const ids = misReservas();
  const lista = el('ul', { class: 'lista-reservas' });
  vaciar(
    contenedor,
    el('section', {}, el('h1', {}, t('resv.lista')), ids.length ? lista : aviso(t('resv.ninguna'))),
  );
  for (const id of ids) {
    const item = el('li', {}, el('a', { href: `#/reserva/${id}` }, id.slice(0, 8).toUpperCase()));
    lista.append(item);
    // Se completa con el nombre y el estado cuando responde la API.
    pedir(`/reservas/${id}`)
      .then((r) => {
        const e = normalizarExperiencia(r.experiencia);
        vaciar(
          item,
          el('a', { href: `#/reserva/${id}` }, e.nombre),
          el('span', { class: 'tarjeta-meta' }, ` · ${fechaLarga(r.fecha)} · ${t(`resv.estado.${r.estado}`)}`),
        );
      })
      .catch(() => {});
  }
}

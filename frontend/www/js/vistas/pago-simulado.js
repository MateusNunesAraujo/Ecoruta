import { ErrorApi, pedir } from '../api.js';
import { el, vaciar } from '../dom.js';
import { fechaLarga, t } from '../i18n.js';
import { aviso, bloquePrecio, normalizarExperiencia } from '../tarjetas.js';

// #/pago-simulado/<referencia>: reemplaza a Wompi cuando no hay cuenta
// (PAGOS_SIMULADOS=true). Dice claramente que es una simulación: sirve para
// probar y mostrar en la demo cómo se confirma una reserva.
export function vistaPagoSimulado(contenedor, [referencia]) {
  const cargar = async () => {
    vaciar(contenedor, aviso(t('cargando')));
    try {
      const pago = await pedir(`/pagos/simulado/${referencia}`);
      dibujar(contenedor, pago);
    } catch (error) {
      vaciar(
        contenedor,
        aviso(error.status === 404 ? t('error.noEncontrado') : error.message),
      );
    }
  };
  cargar();
}

function dibujar(contenedor, pago) {
  const e = normalizarExperiencia(pago.experiencia);
  const estado = el('p', { class: 'form-estado', role: 'status' });

  const responder = async (resultado, botones) => {
    botones.forEach((b) => (b.disabled = true));
    estado.textContent = t('sim.procesando');
    try {
      const r = await pedir(`/pagos/simulado/${pago.referencia}`, {
        metodo: 'POST',
        cuerpo: { estado: resultado },
      });
      // Igual que al volver de Wompi: a la reserva con el resultado.
      location.hash = `#/reserva/${r.reservaId}?pago=${r.resultado}`;
    } catch (error) {
      estado.textContent =
        error instanceof ErrorApi && error.datos?.motivo === 'ENLACE_VENCIDO'
          ? t('resv.vencida')
          : error.message;
      botones.forEach((b) => (b.disabled = false));
    }
  };

  const aprobar = el('button', { type: 'button', class: 'boton boton-grande' }, '✓ ', t('sim.aprobar'));
  const rechazar = el('button', { type: 'button', class: 'boton boton-grande boton-peligro' }, '✕ ', t('sim.rechazar'));
  const botones = [aprobar, rechazar];
  aprobar.addEventListener('click', () => responder('APPROVED', botones));
  rechazar.addEventListener('click', () => responder('DECLINED', botones));

  vaciar(
    contenedor,
    el(
      'article',
      { class: 'detalle' },
      el('h1', {}, t('sim.titulo')),
      el('p', { class: 'aviso-simulacion', role: 'note' }, t('sim.aviso')),
      el('h2', {}, e.nombre),
      el(
        'p',
        { class: 'tarjeta-meta' },
        `${fechaLarga(pago.fecha)} · ${t('resv.personas')}: ${pago.personas}`,
      ),
      el('p', {}, el('strong', {}, t('sim.total'))),
      bloquePrecio(pago.totalCop),
      el('p', { class: 'nota' }, `${t('resv.codigo')}: ${pago.referencia}`),
      el('div', { class: 'botones-simulacion' }, botones),
      estado,
    ),
  );
}

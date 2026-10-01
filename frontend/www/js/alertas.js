// Ventanas emergentes con SweetAlert2 (en vez de alert/confirm del navegador).
// La librería está descargada en vendor/sweetalert2/ (v11.26.25, MIT) para
// que funcione sin conexión; ese archivo ya trae su CSS.
//
// Los colores salen de las variables de estilos.css (--superficie, --texto…),
// así la ventana sigue el tema claro u oscuro. Los botones usan las mismas
// clases que el resto de la app (boton, boton-secundario, boton-peligro).

import Swal from '../vendor/sweetalert2/sweetalert2.esm.all.min.js';
import { t } from './i18n.js';

const base = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true, // en celular, la acción principal queda a la derecha
  background: 'var(--superficie)',
  color: 'var(--texto)',
  customClass: {
    popup: 'alerta',
    confirmButton: 'boton',
    cancelButton: 'boton boton-secundario',
  },
});

// Pregunta sí/no. Devuelve true si el turista confirma.
//   await confirmar(t('resv.confirmarCancelar'), { si: t('resv.cancelarSi'), peligro: true })
export async function confirmar(texto, { titulo, si, no, peligro = false } = {}) {
  const { isConfirmed } = await base.fire({
    icon: peligro ? 'warning' : 'question',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: si ?? t('alerta.si'),
    cancelButtonText: no ?? t('alerta.no'),
    focusCancel: peligro, // en acciones peligrosas, Enter no confirma por error
    customClass: {
      popup: 'alerta',
      confirmButton: peligro ? 'boton boton-peligro' : 'boton',
      cancelButton: 'boton boton-secundario',
    },
  });
  return isConfirmed;
}

// Mensaje informativo con un solo botón.
export function avisar(texto, { titulo, icono = 'info' } = {}) {
  return base.fire({ icon: icono, title: titulo, text: texto, confirmButtonText: t('alerta.entendido') });
}

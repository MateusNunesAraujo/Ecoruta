import { el } from './dom.js';
import { t } from './i18n.js';

// Aviso de conexión debajo de la cabecera: "Sin conexión…" mientras no hay
// señal o se muestran datos guardados, y mensajes breves (señal recuperada,
// pre-reservas enviadas).
//
// navigator.onLine solo dice si el teléfono tiene red, no si hay internet:
// por eso también se avisa cuando una petición falla y se usa la copia local.
// En la app Android, @capacitor/network (Bloque 8) podrá dar un dato mejor.

let aviso = null;
let temporizador = null;

export function iniciarConexion({ alVolver }) {
  aviso = el('p', { id: 'aviso-conexion', class: 'aviso-conexion nota', role: 'status', hidden: true });
  document.getElementById('cabecera').after(aviso);
  if (!navigator.onLine) avisarSinConexion();

  window.addEventListener('offline', () => avisarSinConexion());
  window.addEventListener('online', () => {
    mostrarBreve(t('conexion.volvio'));
    alVolver?.();
  });
}

// guardadoEn (opcional): cuándo se guardó la copia que se está mostrando.
export function avisarSinConexion(guardadoEn) {
  if (!aviso) return;
  clearTimeout(temporizador);
  temporizador = null;
  aviso.textContent = guardadoEn
    ? t('conexion.guardado', { fecha: new Date(guardadoEn).toLocaleString(document.documentElement.lang, { dateStyle: 'medium', timeStyle: 'short' }) })
    : t('conexion.sin');
  aviso.hidden = false;
}

// Una petición llegó al servidor: si el aviso decía "Sin conexión", se quita.
export function hayConexion() {
  if (aviso && !aviso.hidden && !temporizador && navigator.onLine) aviso.hidden = true;
}

export function mostrarBreve(texto) {
  if (!aviso) return;
  clearTimeout(temporizador);
  aviso.textContent = texto;
  aviso.hidden = false;
  temporizador = setTimeout(() => {
    aviso.hidden = true;
    temporizador = null;
  }, 6000);
}

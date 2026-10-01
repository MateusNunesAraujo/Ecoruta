import { API_BASE } from './config.js';
import { t } from './i18n.js';

// Error de la API con el código HTTP y el mensaje del backend.
export class ErrorApi extends Error {
  constructor(status, mensaje, datos) {
    super(mensaje);
    this.status = status;
    this.datos = datos;
  }
}

// Llama al backend: pedir('/experiencias') o
// pedir('/reservas', { metodo: 'POST', cuerpo: {...} }).
export async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}/api${ruta}`, {
      method: metodo,
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, t('error.red'));
  }
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos?.message)
      ? datos.message.join('. ')
      : (datos?.message ?? t('error.generico'));
    throw new ErrorApi(respuesta.status, mensaje, datos);
  }
  return datos;
}

// --- Pagos (Wompi) ---

let configuracionPagos = null;

// { habilitado, sandbox }. Si falla, se asume que no hay pagos en línea.
export function configPagos() {
  configuracionPagos ??= pedir('/pagos/config').catch(() => ({
    habilitado: false,
    sandbox: false,
  }));
  return configuracionPagos;
}

// Pide al backend el enlace firmado y lleva al turista a Wompi. Al terminar,
// Wompi lo devuelve a la pantalla de su reserva con el resultado.
// En la app Android (Bloque 8) se abrirá con @capacitor/browser.
export async function irAPagar(reservaId) {
  const { url } = await pedir(`/pagos/reservas/${reservaId}/enlace`, {
    metodo: 'POST',
  });
  location.href = url;
}

// --- Reservas del turista en este navegador ---
// Solo se guardan los ids (no nombre ni email) para poder volver a consultarlas.
const CLAVE_RESERVAS = 'ecoruta.reservas';

export function misReservas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RESERVAS) ?? '[]');
  } catch {
    return [];
  }
}

export function recordarReserva(id) {
  const ids = [id, ...misReservas().filter((x) => x !== id)].slice(0, 20);
  try {
    localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(ids));
  } catch {
    // Navegación privada o almacenamiento bloqueado: no pasa nada.
  }
}

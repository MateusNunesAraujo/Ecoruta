import { guardarRespuesta, leerRespuesta } from './almacen.js';
import { API_BASE } from './config.js';
import { avisarSinConexion, hayConexion } from './conexion.js';
import { t } from './i18n.js';

// Error de la API con el código HTTP y el mensaje del backend.
export class ErrorApi extends Error {
  constructor(status, mensaje, datos) {
    super(mensaje);
    this.status = status;
    this.datos = datos;
  }
}

// ¿El error es por falta de conexión (sin red o backend inalcanzable)?
export function esSinConexion(error) {
  return error instanceof ErrorApi && error.status === 0;
}

// Respuestas que se guardan para verlas sin señal (Bloque 7). No se guardan
// reservas ni pagos: cambian a cada minuto.
const GUARDABLES = /^\/(experiencias|emprendimientos|cultural|faq)(\/|\?|$)/;

// Llama al backend: pedir('/experiencias') o
// pedir('/reservas', { metodo: 'POST', cuerpo: {...} }).
export async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  const guardable = metodo === 'GET' && GUARDABLES.test(ruta);
  try {
    const datos = await pedirAlServidor(ruta, metodo, cuerpo);
    hayConexion();
    if (guardable) guardarRespuesta(ruta, datos);
    return datos;
  } catch (error) {
    if (guardable && esSinConexion(error)) {
      const copia = await copiaLocal(ruta);
      if (copia) {
        avisarSinConexion(copia.guardadoEn);
        return copia.datos;
      }
    }
    if (esSinConexion(error)) avisarSinConexion();
    throw error;
  }
}

// Copia guardada de la ruta. Si es un filtro que nunca se abrió con señal
// (/experiencias?interes=aves), se filtra la copia del catálogo completo.
async function copiaLocal(ruta) {
  const copia = await leerRespuesta(ruta);
  const interes = /^\/experiencias\?interes=([a-z_]+)$/.exec(ruta)?.[1];
  if (copia || !interes) return copia;
  const catalogo = await leerRespuesta('/experiencias');
  return catalogo && {
    guardadoEn: catalogo.guardadoEn,
    datos: catalogo.datos.filter((e) => e.intereses?.includes(interes)),
  };
}

async function pedirAlServidor(ruta, metodo, cuerpo) {
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
  // 502/503/504/530 sin JSON: el backend no responde (por ejemplo, el túnel de
  // la demo está cerrado). Cuenta como falta de conexión.
  if ([502, 503, 504, 530].includes(respuesta.status) && !respuesta.headers.get('content-type')?.includes('json')) {
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

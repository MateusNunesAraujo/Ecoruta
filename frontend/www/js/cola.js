import { esSinConexion, pedir, recordarReserva } from './api.js';

// Cola de pre-reservas (Bloque 7): si el turista llena el formulario sin
// señal, la reserva se guarda en este teléfono y se envía al volver la
// conexión. Hasta entonces NO aparta cupo: se muestra "pendiente de
// confirmar". Al enviarla, el backend la crea en PENDIENTE_PAGO como siempre
// (con sus 15 minutos para pagar).
//
// Los datos personales solo quedan en este teléfono y se borran apenas la
// reserva se envía o es rechazada.

const CLAVE = 'ecoruta.cola';

export function colaReservas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
  } catch {
    return [];
  }
}

function guardar(cola) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(cola));
    return true;
  } catch {
    return false;
  }
}

// cuerpo: lo mismo que se enviaría a POST /api/reservas.
// Devuelve false si no se pudo guardar (almacenamiento bloqueado).
export function encolarReserva(cuerpo, totalCop) {
  const pendiente = {
    idLocal: crypto.randomUUID?.() ?? String(Date.now()),
    estado: 'PENDIENTE',
    creadaEn: new Date().toISOString(),
    totalCop,
    cuerpo,
  };
  return guardar([...colaReservas(), pendiente]);
}

export function quitarDeCola(idLocal) {
  guardar(colaReservas().filter((r) => r.idLocal !== idLocal));
}

let enviando = false;

// Envía las pre-reservas pendientes, una por una. Devuelve cuántas se
// crearon. Si se pierde la señal a mitad de camino, las demás esperan.
export async function enviarCola() {
  if (enviando || !navigator.onLine) return 0;
  enviando = true;
  let creadas = 0;
  try {
    for (const pendiente of colaReservas().filter((r) => r.estado === 'PENDIENTE')) {
      try {
        const reserva = await pedir('/reservas', { metodo: 'POST', cuerpo: pendiente.cuerpo });
        recordarReserva(reserva.id);
        quitarDeCola(pendiente.idLocal);
        creadas++;
      } catch (error) {
        if (esSinConexion(error) || error.status >= 500 || error.status === 429) break;
        // Rechazada (sin cupos, fecha pasada…): se conserva para avisar al
        // turista, pero sin sus datos personales.
        const { experienciaId, fecha, personas } = pendiente.cuerpo;
        guardar(
          colaReservas().map((r) =>
            r.idLocal === pendiente.idLocal
              ? {
                  ...r,
                  estado: 'RECHAZADA',
                  motivo: error.datos?.motivo ?? null,
                  mensaje: error.message,
                  cuerpo: { experienciaId, fecha, personas },
                }
              : r,
          ),
        );
      }
    }
  } finally {
    enviando = false;
  }
  if (creadas > 0) {
    window.dispatchEvent(new CustomEvent('ecoruta:cola-enviada', { detail: { creadas } }));
  }
  return creadas;
}

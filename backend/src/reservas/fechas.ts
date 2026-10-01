import { DIAS_SEMANA } from '../emprendimientos/intereses.js';

// Leticia usa la hora de Colombia (UTC-5, sin horario de verano). El servidor
// puede estar en otra zona horaria, así que "hoy" se calcula siempre aquí.
const ZONA_HORARIA = 'America/Bogota';

// Fecha y hora actuales en Colombia: { fecha: "2026-10-05", hora: "14:30" }
export function ahoraEnColombia(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ahora);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return {
    fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
    hora: `${valor('hour')}:${valor('minute')}`,
  };
}

// true si el texto es una fecha real con formato AAAA-MM-DD.
export function esFechaValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [a, m, d] = partes.slice(1).map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

// "2026-10-05" -> "lunes" (mismos nombres que dias_operacion del Excel).
export function diaDeLaSemana(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  // getUTCDay: 0 = domingo, 1 = lunes, …
  const indice = (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
  return DIAS_SEMANA[indice];
}

import { LectorFila } from './lector-fila.js';
import { Problemas } from './problemas.js';

// Crea un lector para una fila con un solo valor en la columna "x".
function lector(valor: unknown) {
  const problemas = new Problemas();
  return {
    fila: new LectorFila('Prueba', 3, { x: valor }, problemas),
    problemas,
  };
}

describe('LectorFila', () => {
  it('convierte la hora de Excel (30/12/1899 09:00) a "09:00"', () => {
    const { fila } = lector(new Date(Date.UTC(1899, 11, 30, 9, 0)));
    expect(fila.hora('x')).toBe('09:00');
  });

  it('redondea horas guardadas como 08:59:59.999', () => {
    const { fila } = lector(new Date(Date.UTC(1899, 11, 30, 8, 59, 59, 999)));
    expect(fila.hora('x')).toBe('09:00');
  });

  it('acepta horas escritas como texto "5:30"', () => {
    expect(lector('5:30').fila.hora('x')).toBe('05:30');
  });

  it('reporta una hora inválida y devuelve null', () => {
    const { fila, problemas } = lector('25:99');
    expect(fila.hora('x')).toBeNull();
    expect(problemas.errores).toBe(1);
  });

  it('convierte "24/09/2026" a "2026-09-24"', () => {
    expect(lector('24/09/2026').fila.fecha('x')).toBe('2026-09-24');
  });

  it('rechaza fechas imposibles como 31/02/2026', () => {
    const { fila, problemas } = lector('31/02/2026');
    expect(fila.fecha('x')).toBeNull();
    expect(problemas.errores).toBe(1);
  });

  it('separa listas por coma y quita espacios', () => {
    expect(lector('EXP-01, EXP-03 ,').fila.lista('x')).toEqual([
      'EXP-01',
      'EXP-03',
    ]);
  });

  it('entiende Si / Sí / No', () => {
    expect(lector('Sí').fila.siNo('x')).toBe(true);
    expect(lector('No').fila.siNo('x')).toBe(false);
  });

  it('acepta números con coma decimal', () => {
    expect(lector('-4,1523').fila.numero('x')).toBe(-4.1523);
  });
});

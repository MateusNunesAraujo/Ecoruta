import { ahoraEnColombia, diaDeLaSemana, esFechaValida } from './fechas.js';

describe('fechas', () => {
  it.each([
    ['2026-10-05', 'lunes'],
    ['2026-10-07', 'miercoles'],
    ['2026-10-10', 'sabado'],
    ['2026-10-11', 'domingo'],
  ])('%s es %s', (fecha, dia) => {
    expect(diaDeLaSemana(fecha)).toBe(dia);
  });

  it('usa la hora de Colombia (UTC-5), no la del servidor', () => {
    // 02:00 UTC del 6 de octubre = 21:00 del 5 de octubre en Colombia.
    const ahora = ahoraEnColombia(new Date('2026-10-06T02:00:00Z'));
    expect(ahora).toEqual({ fecha: '2026-10-05', hora: '21:00' });
  });

  it('valida fechas reales con formato AAAA-MM-DD', () => {
    expect(esFechaValida('2026-10-05')).toBe(true);
    expect(esFechaValida('2026-02-31')).toBe(false);
    expect(esFechaValida('05/10/2026')).toBe(false);
  });
});

import { ocultarDatosPersonales } from './datos-personales.js';

describe('ocultarDatosPersonales', () => {
  it('oculta emails', () => {
    expect(ocultarDatosPersonales('mi correo es ana.perez@gmail.com')).toBe(
      'mi correo es [email]',
    );
  });

  it.each([
    '+57 300 123 4567',
    '3001234567',
    '(601) 555-1234',
    '+55 97 99123-4567',
  ])('oculta el teléfono "%s"', (telefono) => {
    expect(ocultarDatosPersonales(`llámame al ${telefono}`)).toBe(
      'llámame al [teléfono]',
    );
  });

  it('no toca fechas, horas, cantidades ni códigos', () => {
    const texto = 'EXP-01 el 2026-10-05 4 personas a las 09:00 por 60000 COP';
    expect(ocultarDatosPersonales(texto)).toBe(texto);
  });
});

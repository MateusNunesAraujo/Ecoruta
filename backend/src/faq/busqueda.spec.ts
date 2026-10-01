import { puntuar, raices } from './busqueda.js';

describe('búsqueda por palabras clave', () => {
  it('quita palabras vacías y usa la raíz', () => {
    expect(raices('¿Hay que vacunarse para ir?')).toEqual(['vacun']);
  });

  it.each([
    [
      '¿Hay que vacunarse?',
      '¿Es obligatorio vacunarse contra la fiebre amarilla?',
    ],
    ['Preciso de vacina?', 'A vacina contra a febre amarela é obrigatória?'],
    [
      'Do I need a passport to visit Tabatinga?',
      'Do I need a passport to visit Tabatinga (Brazil)?',
    ],
    [
      '¿Aceptan tarjeta de crédito?',
      '¿Aceptan tarjetas de crédito en las comunidades?',
    ],
  ])('"%s" encuentra la pregunta frecuente', (consulta, pregunta) => {
    expect(puntuar(consulta, pregunta)).toBeGreaterThan(0);
  });

  it('no encuentra nada en un texto sin relación', () => {
    expect(puntuar('¿Hay que vacunarse?', 'La mejor época para viajar')).toBe(
      0,
    );
  });
});

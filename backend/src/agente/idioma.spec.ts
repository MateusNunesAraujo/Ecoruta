import { detectarIdioma } from './idioma.js';

describe('detectarIdioma', () => {
  it.each([
    ['Hola, quiero ver delfines mañana', 'es'],
    ['¿Cuánto cuesta el taller de artesanías?', 'es'],
    ['Somos 3 personas y buscamos algo de cultura', 'es'],
    ['Hi! I want to see dolphins tomorrow', 'en'],
    ['How much is the birdwatching tour?', 'en'],
    ['Olá, quero ver botos amanhã', 'pt'],
    ['Quanto custa a experiência? Somos três pessoas', 'pt'],
    ['Você tem passeios de observação de aves?', 'pt'],
  ] as const)('"%s" -> %s', (texto, idioma) => {
    expect(detectarIdioma(texto, 'es')).toBe(idioma);
  });

  it('sin pistas usa el idioma de la interfaz', () => {
    expect(detectarIdioma('EXP-01 2026-10-05', 'pt')).toBe('pt');
    expect(detectarIdioma('👍', 'en')).toBe('en');
  });
});

import {
  buscarLengua,
  crearIndiceLenguas,
  normalizarNombre,
} from './nombres-lengua.js';

// Mismos nombres que la hoja Lenguas del Excel.
const indice = crearIndiceLenguas([
  { id: 'L-TIK', nombreComun: 'Tikuna', autodenominacion: 'Duüxügu' },
  {
    id: 'L-MUR',
    nombreComun: 'Huitoto / Murui',
    autodenominacion: 'Mɨnɨka / Nɨpode',
  },
  { id: 'L-YAG', nombreComun: 'Yagua', autodenominacion: 'Nijyamïï Nikyee' },
  { id: 'L-MIR', nombreComun: 'Miraña', autodenominacion: 'Míraña' },
  { id: 'L-BOR', nombreComun: 'Bora', autodenominacion: 'Meea' },
]);

describe('nombres de lengua', () => {
  it('normaliza tildes, diéresis, mayúsculas y la ɨ', () => {
    expect(normalizarNombre('Mɨnɨka / Nɨpode')).toBe('minika nipode');
    expect(normalizarNombre('MAGÜTA')).toBe('maguta');
  });

  it.each([
    ['tikuna', 'L-TIK'],
    ['Magüta', 'L-TIK'],
    ['duüxügu', 'L-TIK'],
    ['lengua magüta', 'L-TIK'],
    ['huitoto', 'L-MUR'],
    ['Murui', 'L-MUR'],
    ['witoto', 'L-MUR'],
    ['minika', 'L-MUR'],
    ['Yagua', 'L-YAG'],
    ['miraña', 'L-MIR'],
    ['mirana', 'L-MIR'],
    ['bora', 'L-BOR'],
    ['L-BOR', 'L-BOR'],
  ])('"%s" -> %s', (texto, id) => {
    expect(buscarLengua(indice, texto)).toBe(id);
  });

  it('no inventa: una lengua desconocida devuelve null', () => {
    expect(buscarLengua(indice, 'quechua')).toBeNull();
    expect(buscarLengua(indice, '')).toBeNull();
  });
});

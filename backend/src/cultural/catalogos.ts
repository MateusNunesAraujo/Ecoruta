// Valores fijos del módulo cultural (copiados de la hoja "Listas" del Excel).
// Si el equipo agrega un valor en el Excel, hay que agregarlo también aquí.

export const ESTADOS_FICHA = ['PENDIENTE', 'VERIFICADA'] as const;
export type EstadoFicha = (typeof ESTADOS_FICHA)[number];

export const TIPOS_FICHA = [
  'saludo',
  'palabra',
  'frase',
  'planta',
  'animal',
  'narrativa',
  'transporte',
  'estructura',
  'comida',
] as const;

// Temas de cortesía: al mostrar una experiencia se incluyen automáticamente
// (junto con las fichas de tipo "saludo") en la lengua de su comunidad.
export const TEMAS_CORTESIA = [
  'hola',
  'bienvenido',
  'gracias',
  'adios',
  'con_permiso',
];

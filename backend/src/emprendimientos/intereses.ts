// Intereses con los que se clasifican los emprendimientos.
// Se escriben sin tildes ni mayúsculas para que el filtro sea predecible.
// El agente (Bloque 4) usará esta misma lista para entender al turista.
export const INTERESES = [
  'aves',
  'delfines',
  'gastronomia',
  'artesanias',
  'caminata',
] as const;

export type Interes = (typeof INTERESES)[number];

// Etiquetas de interés de las experiencias (columna "Etiquetas de interés" de
// la hoja "Listas" del Excel). Sin tildes ni mayúsculas para que el filtro sea
// predecible. El agente (Bloque 4) buscará solo con estas etiquetas: si el
// equipo agrega una en el Excel, hay que agregarla también aquí.
export const INTERESES = [
  'aves',
  'delfines',
  'pesca',
  'gastronomia',
  'artesanias',
  'plantas_medicinales',
  'caminata',
  'cultura',
  'fotografia',
  'navegacion',
  'musica_danza',
  'aventura',
  'fauna',
] as const;

export type Interes = (typeof INTERESES)[number];

export const DIAS_SEMANA = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
] as const;

export const DIFICULTADES = ['baja', 'media', 'alta'] as const;

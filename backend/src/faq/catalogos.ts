// Valores fijos de las preguntas frecuentes (hoja "Listas" del Excel).
export const CATEGORIAS_FAQ = [
  'como_llegar',
  'clima_ropa',
  'salud',
  'dinero_pagos',
  'conectividad',
  'respeto_comunidades',
  'frontera',
  'seguridad',
] as const;

export const IDIOMAS = ['es', 'en', 'pt'] as const;
export type Idioma = (typeof IDIOMAS)[number];

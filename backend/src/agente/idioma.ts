import type { Idioma } from '../faq/catalogos.js';

// Detecta si el turista escribe en español, inglés o portugués contando
// palabras típicas de cada idioma. Sin LLM: es gratis, instantáneo y fácil de
// probar. Si no hay pistas claras (ej. "EXP-01"), usa el idioma de la interfaz.

// prettier-ignore
const PISTAS: Record<Idioma, string[]> = {
  // Sin "que", "como", "dias" ni "esta": también son muy comunes en portugués.
  es: [
    'hola', 'quiero', 'gracias', 'donde', 'cuanto', 'cuesta', 'los', 'las',
    'del', 'por', 'favor', 'hay', 'puedo', 'tengo', 'buenos', 'manana',
    'personas', 'busco', 'tambien', 'estoy', 'muy', 'cual', 'nosotros',
    'usted', 'hacer', 'ver', 'quisiera', 'podemos', 'el', 'y', 'mi',
  ],
  en: [
    'hello', 'hi', 'the', 'want', 'where', 'how', 'much', 'what', 'can',
    'please', 'thanks', 'thank', 'you', 'is', 'are', 'and', 'for', 'with',
    'book', 'people', 'tomorrow', 'would', 'like', 'we', 'looking', 'there',
    'any', 'my', 'of', 'to', 'in', 'which', 'your', 'this',
  ],
  // Sin "no" ni "o": también son palabras comunes en español.
  pt: [
    'ola', 'oi', 'quero', 'obrigado', 'obrigada', 'onde', 'quanto', 'custa',
    'voce', 'nao', 'sim', 'com', 'tem', 'posso', 'amanha', 'pessoas',
    'tambem', 'muito', 'gostaria', 'estou', 'bom', 'dia', 'isso', 'eu',
    'nos', 'meu', 'minha', 'fazer', 'qual', 'e', 'na', 'do', 'ao', 'pra',
  ],
};

// Letras o signos que casi solo aparecen en un idioma.
const MARCAS: Record<Idioma, RegExp> = {
  es: /[ñ¿¡]/,
  en: /\b(i'm|don't|it's)\b/,
  pt: /[ãõç]|ção|ções/,
};

export function detectarIdioma(texto: string, porDefecto: Idioma): Idioma {
  const minusculas = texto.toLowerCase();
  const palabras = minusculas
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z']+/)
    .filter(Boolean);

  const puntos: Record<Idioma, number> = { es: 0, en: 0, pt: 0 };
  for (const idioma of ['es', 'en', 'pt'] as const) {
    for (const palabra of palabras) {
      if (PISTAS[idioma].includes(palabra)) puntos[idioma] += 1;
    }
    if (MARCAS[idioma].test(minusculas)) puntos[idioma] += 2;
  }

  const [primero, segundo] = (['es', 'en', 'pt'] as const)
    .map((idioma) => [idioma, puntos[idioma]] as const)
    .sort((a, b) => b[1] - a[1]);
  // Sin pistas o empate: se respeta el idioma elegido en la interfaz.
  if (primero[1] === 0 || primero[1] === segundo[1]) return porDefecto;
  return primero[0];
}
